import { useCallback, useEffect, useMemo, useState } from 'react'
import { BellRing, LoaderCircle, RefreshCw, Send, Users } from 'lucide-react'
import { adminApi } from '../api/client'
import { useDashboard } from '../context/DashboardContext'

const audienceLabels = { customer: 'العملاء', merchant: 'التجار' }

export default function NotificationsPage() {
  const { vendors, showToast } = useDashboard()
  const [audience, setAudience] = useState('customer')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [status, setStatus] = useState(null)
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [nextStatus, nextContacts] = await Promise.all([
        adminApi.notificationStatus(),
        adminApi.notificationContacts(audience, 1, 50),
      ])
      setStatus(nextStatus)
      setContacts(nextContacts?.items || [])
    } catch (error) {
      showToast('error', error.message || 'تعذر تحميل مركز الإشعارات.')
    } finally {
      setLoading(false)
    }
  }, [audience, showToast])

  useEffect(() => { void load() }, [load])

  const audienceStats = status?.audiences?.[audience] || { readyToSend: 0, optedIn: 0, total: 0 }
  const configured = Boolean(status?.configured?.[audience])
  const requiredSecret = audience === 'customer' ? 'FCM_PUBLIC_SERVICE_ACCOUNT_JSON' : 'FCM_SERVICE_ACCOUNT_JSON'
  const selectedStore = useMemo(() => vendors.find((vendor) => vendor.id === companyId), [companyId, vendors])

  const submit = async (event) => {
    event.preventDefault()
    setSending(true)
    setResult(null)
    try {
      const response = await adminApi.sendNotification({
        audience,
        title: title.trim(),
        body: body.trim(),
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
        <section className="card p-4"><p className="text-xs text-neutral-500">جهات {audienceLabels[audience]}</p><p className="mt-2 text-2xl font-bold text-neutral-900">{audienceStats.total}</p><p className="mt-1 text-xs text-neutral-500">المفعّل منهم: {audienceStats.optedIn}</p></section>
        <section className="card p-4"><p className="text-xs text-neutral-500">مستلمون جاهزون</p><p className="mt-2 text-2xl font-bold text-primary-700">{audienceStats.readyToSend}</p><p className="mt-1 text-xs text-neutral-500">الحد الأقصى للحملة: 500 رمز</p></section>
        <section className="card p-4"><p className="text-xs text-neutral-500">نطاق الحملة</p><p className="mt-2 font-bold text-neutral-900">{selectedStore?.companyName || 'كل المتاجر'}</p><p className="mt-1 text-xs text-neutral-500">{companyId ? 'متجر محدد' : 'الجمهور الكامل'}</p></section>
      </div>

      <section className="card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-2"><BellRing size={19} className="text-primary-600" /><h3 className="font-bold text-neutral-900">إنشاء حملة</h3></div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div role="group" aria-label="اختيار جمهور الإشعارات" className="grid grid-cols-2 gap-2 sm:col-span-2">
              <button type="button" aria-pressed={audience === 'customer'} onClick={() => setAudience('customer')} className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${audience === 'customer' ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'}`}>إشعارات الجمهور</button>
              <button type="button" aria-pressed={audience === 'merchant'} onClick={() => setAudience('merchant')} className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${audience === 'merchant' ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'}`}>إشعارات التجار</button>
            </div>
            <label className="block space-y-1.5"><span className="text-xs font-semibold text-neutral-600">المتجر (اختياري)</span><select className="input" value={companyId} onChange={(event) => setCompanyId(event.target.value)}><option value="">كل المتاجر</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.companyName || vendor.name || vendor.id}</option>)}</select></label>
          </div>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-neutral-600">العنوان <span className="font-normal text-neutral-400">(120 حرفًا)</span></span><input required maxLength={120} className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="عنوان الإشعار" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-neutral-600">النص <span className="font-normal text-neutral-400">(500 حرف)</span></span><textarea required maxLength={500} rows={4} className="input resize-y" value={body} onChange={(event) => setBody(event.target.value)} placeholder="نص الرسالة التي ستظهر للمستلم" /></label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-neutral-500"><Users size={14} className="ml-1 inline" />سيصل الإشعار إلى من فعّل الإشعارات وسجّل رمز Push فقط. واتساب العادي يفتح رسالة جاهزة يدويًا من سجل الطلب، ولا يرسل تلقائيًا.</p>
            <button type="submit" disabled={sending || loading || !configured || audienceStats.readyToSend === 0 || !title.trim() || !body.trim()} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">{sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}{sending ? 'جارٍ الإرسال...' : 'إرسال الحملة'}</button>
          </div>
        </form>
        {result && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">نتيجة الإرسال: <b>{result.sent}</b> ناجح، <b>{result.failed}</b> فاشل، من أصل <b>{result.total}</b> مستلم.</div>}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-neutral-100 px-5 py-4"><h3 className="font-bold text-neutral-900">جهات مختصرة</h3><p className="mt-1 text-xs text-neutral-500">لا تعرض هذه القائمة رموز FCM أو أي أسرار.</p></div>
        {loading ? <div className="flex items-center justify-center gap-2 p-8 text-sm text-neutral-500"><LoaderCircle size={17} className="animate-spin" />جارٍ التحميل...</div> : contacts.length === 0 ? <p className="p-8 text-center text-sm text-neutral-500">لا توجد جهات مطابقة.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-right text-sm"><thead className="bg-neutral-50 text-xs text-neutral-500"><tr><th className="px-4 py-3">{audience === 'merchant' ? 'اسم التاجر' : 'الاسم'}</th><th className="px-4 py-3">المتجر</th><th className="px-4 py-3">WhatsApp</th><th className="px-4 py-3">Push</th></tr></thead><tbody className="divide-y divide-neutral-100">{contacts.map((contact, index) => <tr key={`${contact.companyId}-${contact.whatsappPhone}-${index}`} className="table-row-hover"><td className="px-4 py-3">{contact.name}</td><td className="px-4 py-3">{contact.storeName}</td><td dir="ltr" className="px-4 py-3 text-left">{contact.whatsappPhone}</td><td className="px-4 py-3">{contact.pushEnabled && contact.hasPushToken ? <span className="badge-success">مفعّل</span> : <span className="badge-neutral">غير جاهز</span>}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  )
}
