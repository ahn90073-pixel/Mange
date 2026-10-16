import { useCallback, useEffect, useMemo, useState } from 'react'
import { BellRing, Image, LoaderCircle, MessageCircle, PackageCheck, RefreshCw, Send, Users, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { adminApi } from '../api/client'
import { useDashboard } from '../context/DashboardContext'
import { shipmentWhatsAppUrl } from '../utils/shipmentWhatsApp'

const audienceLabels = { customer: 'العملاء', merchant: 'التجار' }

function formatLastSeen(value) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch {
    return '—'
  }
}

function formatApproxLocation(contact) {
  const parts = [contact.locationCity, contact.locationRegion].filter(Boolean)
  if (contact.locationCountry) {
    try {
      parts.push(new Intl.DisplayNames(['ar'], { type: 'region' }).of(contact.locationCountry) || contact.locationCountry)
    } catch {
      parts.push(contact.locationCountry)
    }
  }
  return parts.join('، ') || 'غير متاح'
}

export default function NotificationsPage() {
  const { vendors, showToast } = useDashboard()
  const [searchParams] = useSearchParams()
  const [audience, setAudience] = useState('customer')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageData, setImageData] = useState('')
  const [imageName, setImageName] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [status, setStatus] = useState(null)
  const [contacts, setContacts] = useState([])
  const [shipmentRequests, setShipmentRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [processingShipmentRequestId, setProcessingShipmentRequestId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    if (audience === 'customer') setContacts([])
    try {
      const [nextStatus, nextContacts, nextShipmentRequests] = await Promise.all([
        adminApi.notificationStatus(),
        audience === 'merchant' ? adminApi.notificationContacts('merchant', 1, 50) : Promise.resolve(null),
        adminApi.shipmentActivationRequests('all', 50),
      ])
      setStatus(nextStatus)
      setContacts(audience === 'merchant' ? nextContacts?.items || [] : [])
      setShipmentRequests(nextShipmentRequests?.items || [])
    } catch (error) {
      showToast('error', error.message || 'تعذر تحميل مركز الإشعارات.')
    } finally {
      setLoading(false)
    }
  }, [audience, showToast])

  useEffect(() => { void load() }, [load])

  const audienceStats = status?.audiences?.[audience] || { readyToSend: 0, optedIn: 0, total: 0 }
  const customerCities = audience === 'customer' && Array.isArray(status?.customerCities) ? status.customerCities : []
  const configured = Boolean(status?.configured?.[audience])
  const requiredSecret = audience === 'customer' ? 'FCM_PUBLIC_SERVICE_ACCOUNT_JSON' : 'FCM_SERVICE_ACCOUNT_JSON'
  const selectedStore = useMemo(() => vendors.find((vendor) => vendor.id === companyId), [companyId, vendors])

  useEffect(() => {
    const requestedAudience = searchParams.get('audience')
    if (audienceLabels[requestedAudience]) {
      setAudience(requestedAudience)
      if (requestedAudience === 'customer') setCompanyId('')
    }
  }, [searchParams])

  const submit = async (event) => {
    event.preventDefault()
    setSending(true)
    setResult(null)
    try {
      const response = await adminApi.sendNotification({
        audience,
        title: title.trim(),
        body: body.trim(),
        ...(imageData ? { imageData, imageName } : {}),
        ...(companyId ? { companyId } : {}),
      })
      setResult(response)
      showToast('success', 'تم تنفيذ حملة الإشعار.')
    } catch (error) {
      showToast('error', error.message || 'تعذر إرسال الحملة.')
    } finally {
      setSending(false)
    }
  }

  const notifyPreparedShipment = async (shipmentRequest) => {
    setProcessingShipmentRequestId(shipmentRequest.id)
    const whatsappWindow = window.open('about:blank', '_blank')
    try {
      const updated = await adminApi.updateOrder(shipmentRequest.companyId, shipmentRequest.orderId, { shipmentStatus: 'ready' })
      const whatsappUrl = shipmentWhatsAppUrl(updated)
      let whatsappSummary = ''
      if (whatsappUrl && whatsappWindow) {
        whatsappWindow.location.href = whatsappUrl
        whatsappSummary = 'فُتحت مسودة WhatsApp للمراجعة؛ اضغط إرسال يدويًا بعد مراجعتها.'
      } else {
        if (whatsappWindow) whatsappWindow.close()
        whatsappSummary = whatsappUrl
          ? 'تعذر فتح WhatsApp؛ اسمح بالنوافذ المنبثقة في المتصفح.'
          : 'لا يتوفر رقم هاتف صالح لفتح WhatsApp.'
      }

      setShipmentRequests((current) => current.map((request) => request.id === shipmentRequest.id
        ? { ...request, status: 'processed', processedAt: new Date().toISOString() }
        : request))

      const notification = updated.notification || {}
      let pushSummary = ''
      let toastType = 'error'
      if (notification.status === 'sent') {
        pushSummary = `تم إرسال Push إلى ${notification.sent} جهاز.`
        toastType = 'success'
      } else if (notification.status === 'completed_with_failures') {
        pushSummary = `نتيجة Push: نجح ${notification.sent} وفشل ${notification.failed}.`
      } else if (notification.status === 'no_tokens') {
        pushSummary = 'حُفظت حالة التجهيز لكن لا توجد أجهزة عميل مسجلة لإشعار Push.'
      } else if (notification.status === 'not_configured') {
        pushSummary = 'حُفظت حالة التجهيز لكن إعداد Push غير مكتمل.'
      } else if (notification.status === 'no_customer_phone') {
        pushSummary = 'حُفظت حالة التجهيز لكن رقم هاتف العميل غير متاح لخدمة الإشعار.'
      } else if (notification.status === 'not_requested') {
        pushSummary = 'حُفظت الحالة؛ لم يُرسل Push جديد لأن الشحنة كانت مجهزة مسبقًا.'
      } else {
        pushSummary = 'حُفظت حالة التجهيز لكن تعذر إرسال Push.'
      }
      showToast(toastType, `${pushSummary} ${whatsappSummary}`)
    } catch (error) {
      if (whatsappWindow) whatsappWindow.close()
      showToast('error', error.message || 'تعذر إرسال إشعار الشحن وفتح WhatsApp.')
    } finally {
      setProcessingShipmentRequestId('')
    }
  }

  const handleImage = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      showToast('error', 'اختر صورة PNG أو JPG أو WEBP فقط.')
      event.target.value = ''
      return
    }
    if (file.size > 1_500_000) {
      showToast('error', 'حجم صورة الإشعار يجب ألا يتجاوز 1.5 ميجابايت.')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImageData(String(reader.result || ''))
      setImageName(file.name)
      setImagePreview(String(reader.result || ''))
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImageData('')
    setImageName('')
    setImagePreview('')
  }

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">مركز الإشعارات</h2>
          <p className="mt-1 text-sm text-neutral-500">حملات FCM للعملاء أو التجار المسجلين مع تفعيل الإشعارات.</p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="btn-secondary"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />تحديث</button>
      </div>

      {!configured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <strong>الإرسال متوقف لجمهور {audienceLabels[audience]}:</strong> يجب إعداد السر <code dir="ltr">{requiredSecret}</code> بحساب Firebase الخاص بالتطبيق في بيئة الخادم.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-neutral-500">جهات {audienceLabels[audience]}</p>{audience === 'customer' && <span className="text-[11px] font-semibold text-neutral-400">المدن التقريبية</span>}</div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-2xl font-bold text-neutral-900">{audienceStats.total}</p>
            {audience === 'customer' && <div aria-label="المدن التقريبية لتوكنات الجمهور" className="flex flex-wrap gap-1.5">
              {customerCities.length ? customerCities.slice(0, 4).map((city) => <span key={`${city.city}-${city.region}-${city.country}`} title={[city.region, city.country].filter(Boolean).join('، ')} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-800">{city.city} <bdi dir="ltr" className="mr-1 text-primary-600">{city.tokens}</bdi></span>) : <span className="text-xs text-neutral-400">لا توجد مدن مسجلة بعد</span>}
              {customerCities.length > 4 && <span className="self-center text-xs text-neutral-500">+{customerCities.length - 4} مدن</span>}
            </div>}
          </div>
          <p className="mt-1 text-xs text-neutral-500">المفعّل منهم: {audienceStats.optedIn}</p>
        </section>
        <section className="card p-4"><p className="text-xs text-neutral-500">مستلمون جاهزون</p><p className="mt-2 text-2xl font-bold text-primary-700">{audienceStats.readyToSend}</p><p className="mt-1 text-xs text-neutral-500">الحد الأقصى للحملة: 500 رمز</p></section>
        <section className="card p-4"><p className="text-xs text-neutral-500">نطاق الحملة</p><p className="mt-2 font-bold text-neutral-900">{audience === 'customer' ? 'كل العملاء' : (selectedStore?.companyName || 'كل التجار')}</p><p className="mt-1 text-xs text-neutral-500">{audience === 'customer' ? 'أجهزة العملاء المسجلة' : (companyId ? 'تاجر محدد' : 'كل التجار')}</p></section>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-neutral-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-neutral-900"><PackageCheck size={18} className="text-primary-600" />طرود جهزها التجار — بانتظار إشعار العميل</h3>
            <p className="mt-1 text-xs text-neutral-500">بعد ضغط التاجر «تم التجهيز»، يظهر الطلب هنا. الزر يرسل Push ويفتح مسودة WhatsApp؛ إرسال WhatsApp النهائي يدوي بعد المراجعة.</p>
          </div>
          <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">بانتظار الإشعار: {shipmentRequests.filter((request) => request.status === 'pending').length}</span>
        </div>
        {loading ? <div className="flex items-center justify-center gap-2 p-8 text-sm text-neutral-500"><LoaderCircle size={17} className="animate-spin" />جارٍ تحميل الطرود المجهزة...</div> : shipmentRequests.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">لا توجد طرود مجهزة تنتظر الإشعار.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right text-sm">
              <thead className="bg-neutral-50 text-xs text-neutral-500"><tr>
                <th className="px-4 py-3">رقم الطلب</th><th className="px-4 py-3">التاجر / المتجر</th><th className="px-4 py-3">مرسل الطلب</th><th className="px-4 py-3">وقت التجهيز</th><th className="px-4 py-3">الحالة</th><th className="px-4 py-3">الإشعار</th>
              </tr></thead>
              <tbody className="divide-y divide-neutral-100">
                {shipmentRequests.map((request) => <tr key={request.id} className="table-row-hover">
                  <td className="px-4 py-3 font-bold text-neutral-800" dir="ltr">{request.orderNumber}</td>
                  <td className="px-4 py-3">{request.companyName || '—'}</td>
                  <td className="px-4 py-3">{request.requestedBy || '—'}</td>
                  <td className="px-4 py-3 text-xs text-neutral-600">{formatLastSeen(request.requestedAt)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${request.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{request.status === 'pending' ? 'مجهز من التاجر — بانتظار الإشعار' : 'تمت المعالجة من الإدارة'}</span></td>
                  <td className="px-4 py-3">{request.status === 'pending' ? <button type="button" onClick={() => notifyPreparedShipment(request)} disabled={Boolean(processingShipmentRequestId)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
                    {processingShipmentRequestId === request.id ? <LoaderCircle size={14} className="animate-spin" /> : <><BellRing size={14} /><MessageCircle size={14} /></>}
                    {processingShipmentRequestId === request.id ? 'جارٍ التنفيذ...' : 'إشعار + WhatsApp'}
                  </button> : <span className="text-xs font-semibold text-emerald-700">تمت المعالجة</span>}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-2"><BellRing size={19} className="text-primary-600" /><h3 className="font-bold text-neutral-900">إنشاء حملة</h3></div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div role="group" aria-label="اختيار جمهور الإشعارات" className="grid grid-cols-2 gap-2 sm:col-span-2">
              <button type="button" aria-pressed={audience === 'customer'} onClick={() => { setAudience('customer'); setCompanyId('') }} className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${audience === 'customer' ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'}`}>إشعارات الجمهور</button>
              <button type="button" aria-pressed={audience === 'merchant'} onClick={() => setAudience('merchant')} className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${audience === 'merchant' ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'}`}>إشعارات التجار</button>
            </div>
            {audience === 'merchant' && <label className="block space-y-1.5"><span className="text-xs font-semibold text-neutral-600">التاجر (اختياري)</span><select className="input" value={companyId} onChange={(event) => setCompanyId(event.target.value)}><option value="">كل التجار</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.companyName || vendor.name || vendor.id}</option>)}</select></label>}
          </div>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-neutral-600">العنوان <span className="font-normal text-neutral-400">(120 حرفًا)</span></span><input required maxLength={120} className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="عنوان الإشعار" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-neutral-600">النص <span className="font-normal text-neutral-400">(500 حرف)</span></span><textarea required maxLength={500} rows={4} className="input resize-y" value={body} onChange={(event) => setBody(event.target.value)} placeholder="نص الرسالة التي ستظهر للمستلم" /></label>
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="flex items-center gap-2 text-sm font-bold text-neutral-800"><Image size={17} className="text-primary-600" />صورة الإشعار <span className="text-xs font-normal text-neutral-500">اختياري — حتى 1.5 ميجابايت</span></p><p className="mt-1 text-xs text-neutral-500">ستظهر الصورة في إشعار Firebase على الأجهزة التي تدعمها.</p></div>
              <label className="btn-secondary cursor-pointer"><Image size={16} />رفع صورة<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleImage} /></label>
            </div>
            {imagePreview && <div className="relative mt-3 w-fit"><img src={imagePreview} alt="معاينة صورة الإشعار" className="max-h-32 max-w-xs rounded-lg border border-neutral-200 object-cover" /><button type="button" onClick={clearImage} className="absolute -right-2 -top-2 rounded-full bg-rose-600 p-1 text-white shadow" aria-label="إزالة الصورة"><X size={14} /></button><p className="mt-1 max-w-xs truncate text-xs text-neutral-500">{imageName}</p></div>}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-neutral-500"><Users size={14} className="ml-1 inline" />سيصل الإشعار إلى من فعّل الإشعارات وسجّل رمز Push فقط. واتساب العادي يفتح رسالة جاهزة يدويًا من سجل الطلب، ولا يرسل تلقائيًا.</p>
            <button type="submit" disabled={sending || loading || !configured || audienceStats.readyToSend === 0 || !title.trim() || !body.trim()} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">{sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}{sending ? 'جارٍ الإرسال...' : 'إرسال الحملة'}</button>
          </div>
        </form>
        {result && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">نتيجة الإرسال: <b>{result.sent}</b> ناجح، <b>{result.failed}</b> فاشل، من أصل <b>{result.total}</b> مستلم.</div>}
      </section>

      {audience === 'merchant' && <section className="card overflow-hidden">
        <div className="border-b border-neutral-100 px-5 py-4">
          <h3 className="font-bold text-neutral-900">جدول توكنات التجار</h3>
          <p className="mt-1 text-xs text-neutral-500">
            اسم التاجر والشركة والموقع التقريبي من اتصال IP. لا تعرض القائمة التوكن كاملًا.
          </p>
        </div>
        {loading ? <div className="flex items-center justify-center gap-2 p-8 text-sm text-neutral-500"><LoaderCircle size={17} className="animate-spin" />جارٍ التحميل...</div> : contacts.length === 0 ? <p className="p-8 text-center text-sm text-neutral-500">لا توجد أجهزة مطابقة.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-right text-sm">
              <thead className="bg-neutral-50 text-xs text-neutral-500">
                <tr>
                  <th className="px-4 py-3">اسم التاجر</th>
                  <th className="px-4 py-3">اسم الشركة</th>
                  <th className="px-4 py-3">الهاتف</th>
                  <th className="px-4 py-3">الموقع التقريبي</th>
                  <th className="px-4 py-3">المنصة / الإصدار</th>
                  <th className="px-4 py-3">آخر نشاط</th>
                  <th className="px-4 py-3">التوكن المختصر</th>
                  <th className="px-4 py-3">Push</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {contacts.map((contact, index) => (
                  <tr key={`${contact.companyId}-${contact.whatsappPhone}-${index}`} className="table-row-hover">
                    <td className="px-4 py-3"><p className="font-semibold">{contact.name}</p></td>
                    <td className="px-4 py-3">{contact.companyName || contact.storeName || '—'}</td>
                    <td dir="ltr" className="px-4 py-3 text-left">{contact.whatsappPhone}</td>
                    <td className="px-4 py-3 text-xs text-neutral-600">{formatApproxLocation(contact)}</td>
                    <td className="px-4 py-3">{contact.platform} / {contact.appVersion}</td>
                    <td className="px-4 py-3 text-xs text-neutral-600">{formatLastSeen(contact.lastSeenAt)}</td>
                    <td dir="ltr" className="px-4 py-3 text-left font-mono text-xs text-neutral-500">{contact.tokenHint}</td>
                    <td className="px-4 py-3">{contact.pushEnabled && contact.hasPushToken ? <span className="badge-success">مفعّل</span> : <span className="badge-neutral">غير جاهز</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>}
    </div>
  )
}
