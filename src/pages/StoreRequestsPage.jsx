import { useCallback, useEffect, useState } from 'react'
import { Check, Clock3, Download, FileCheck2, LoaderCircle, RefreshCw, Store, X } from 'lucide-react'
import { adminApi } from '../api/client'

const statusLabels = { pending: 'قيد المراجعة', approved: 'تمت الموافقة', rejected: 'مرفوض' }
const documentLabels = {
  nationalId: 'البطاقة الشخصية لصاحب الحساب',
  commercialRegister: 'مستند السجل التجاري',
  propertyContract: 'عقد أو بوليصة إثبات عنوان المستودع',
}
const payoutLabels = { vodafone_cash: 'فودافون كاش', instapay: 'InstaPay', bank: 'حساب بنكي' }
const requiredDocumentTypes = Object.keys(documentLabels)

function missingProfileSections(request) {
  const profile = request.profileData || {}
  const address = profile.warehouseAddress || {}
  const missing = []
  if (!profile.legalName || !profile.displayName || !profile.email) missing.push('الاسم القانوني واسم المتجر وبريد الشركة')
  if ((profile.commercialRegisterNumber || '').trim().length < 5) missing.push('رقم السجل التجاري')
  if ((profile.taxId || '').trim().length < 5) missing.push('رقم البطاقة الضريبية')
  if (!address.governorate || !address.city || !address.street) missing.push('عنوان المستودع')
  if (!payoutLabels[profile.payoutMethod] || !profile.payoutNumber) missing.push('وسيلة التحويل ورقم الحساب')
  const documents = new Set((request.documents || []).map((item) => item.documentType))
  if (requiredDocumentTypes.some((type) => !documents.has(type))) missing.push('المستندات الثلاثة')
  return missing
}

function Value({ label, value, dir = 'auto' }) {
  return <div><dt className="text-xs text-neutral-500">{label}</dt><dd dir={dir} className="mt-1 break-words text-sm font-semibold text-neutral-900">{value || '—'}</dd></div>
}

export default function StoreRequestsPage() {
  const [status, setStatus] = useState('pending')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [busyDocument, setBusyDocument] = useState('')
  const [notes, setNotes] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await adminApi.storeRequests(status, 1, 100)
      setRequests(result?.items || [])
    } catch (loadError) {
      setError(loadError.message || 'تعذر تحميل طلبات المتاجر.')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { void loadRequests() }, [loadRequests])

  const decide = async (request, decision) => {
    setBusyId(request.id)
    setError('')
    setNotice('')
    try {
      if (decision === 'approve') {
        await adminApi.approveStoreRequest(request.id)
        setNotice(`تم اعتماد طلب «${request.storeName}» وإنشاء متجره ومساحة بياناته.`)
      } else {
        await adminApi.rejectStoreRequest(request.id, notes[request.id] || '')
        setNotice(`تم رفض طلب «${request.storeName}».`)
      }
      await loadRequests()
    } catch (actionError) {
      setError(actionError.message || 'تعذر حفظ قرار الطلب.')
    } finally {
      setBusyId('')
    }
  }

  const downloadDocument = async (requestId, documentType, contentType) => {
    const key = `${requestId}:${documentType}`
    setBusyDocument(key)
    setError('')
    try {
      const blob = await adminApi.storeRequestDocument(requestId, documentType)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      const extension = contentType === 'application/pdf' ? 'pdf' : contentType === 'image/png' ? 'png' : 'jpg'
      anchor.download = `${documentType}.${extension}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (downloadError) {
      setError(downloadError.message || 'تعذر تنزيل المستند.')
    } finally {
      setBusyDocument('')
    }
  }

  return (
    <div dir="rtl" className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-xl font-bold text-neutral-900">طلبات إنشاء متجر</h2><p className="mt-1 text-sm leading-6 text-neutral-500">تعرض هذه الصفحة ملف الشركة ومستنداته الخاصة. لا تُنشأ الشركة أو بيئتها المنفصلة إلا بعد اعتماد ملف مكتمل.</p></div>
        <div className="flex gap-2">
          <select aria-label="حالة الطلب" className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="pending">قيد المراجعة</option><option value="all">كل الطلبات</option><option value="approved">المعتمدة</option><option value="rejected">المرفوضة</option>
          </select>
          <button type="button" onClick={loadRequests} disabled={loading} className="btn-secondary" aria-label="تحديث الطلبات"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />تحديث</button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

      {loading ? <div className="card flex items-center justify-center gap-2 py-14 text-sm text-neutral-500"><LoaderCircle className="animate-spin" size={19} />جارٍ تحميل الطلبات...</div> : requests.length === 0 ? (
        <div className="card flex flex-col items-center py-14 text-center text-neutral-500"><Store size={34} className="mb-3 text-neutral-300" /><p className="font-semibold">لا توجد طلبات في هذا العرض.</p></div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const isBusy = busyId === request.id
            const profile = request.profileData || {}
            const address = profile.warehouseAddress || {}
            const missing = missingProfileSections(request)
            const documents = request.documents || []
            return <article key={request.id} className="card space-y-5 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Store size={20} /></span><div><h3 className="text-lg font-bold text-neutral-900">{request.storeName}</h3><p className="mt-1 text-sm text-neutral-500">أُرسل {request.createdAt ? new Date(request.createdAt).toLocaleString('ar-EG') : '—'}</p></div></div>
                <span className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${request.status === 'pending' ? 'bg-amber-50 text-amber-800' : request.status === 'approved' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}><Clock3 size={14} />{statusLabels[request.status] || request.status}</span>
              </div>

              <section className="space-y-4">
                <h4 className="font-bold text-neutral-800">بيانات مقدم الطلب والمنشأة</h4>
                <dl className="grid gap-4 rounded-xl bg-neutral-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Value label="اسم التاجر" value={request.fullName} />
                  <Value label="بريد حساب الدخول" value={request.email} dir="ltr" />
                  <Value label="رقم الهاتف" value={request.phone} dir="ltr" />
                  <Value label="محافظة المتجر" value={request.governorate} />
                  <Value label="الاسم القانوني" value={profile.legalName} />
                  <Value label="اسم المتجر الظاهر" value={profile.displayName || request.storeName} />
                  <Value label="بريد الشركة" value={profile.email} dir="ltr" />
                  <Value label="رقم السجل التجاري" value={profile.commercialRegisterNumber} />
                  <Value label="رقم البطاقة الضريبية" value={profile.taxId} />
                  <Value label="المحافظة / المدينة" value={[address.governorate, address.city].filter(Boolean).join(' / ')} />
                  <Value label="عنوان المستودع بالتفصيل" value={address.street} />
                  <Value label="وسيلة التحويل" value={payoutLabels[profile.payoutMethod]} />
                  <Value label="رقم الحساب أو المحفظة" value={profile.payoutNumber} dir="ltr" />
                </dl>
              </section>

              <section className="space-y-3">
                <h4 className="flex items-center gap-2 font-bold text-neutral-800"><FileCheck2 size={17} />المستندات الخاصة</h4>
                {documents.length === 0 ? <p className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">لا توجد مستندات مرفوعة في هذا الطلب.</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{requiredDocumentTypes.map((type) => {
                  const document = documents.find((item) => item.documentType === type)
                  const key = `${request.id}:${type}`
                  return <div key={type} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-3"><div className="min-w-0"><p className="text-sm font-semibold text-neutral-800">{documentLabels[type]}</p><p className="mt-1 text-xs text-neutral-500">{document ? `${Math.ceil(Number(document.sizeBytes || 0) / 1024)} كيلوبايت · ${document.contentType || ''}` : 'غير مرفوع'}</p></div>{document && <button type="button" className="btn-secondary shrink-0 px-3" disabled={busyDocument === key} onClick={() => void downloadDocument(request.id, type, document.contentType)} aria-label={`تنزيل ${documentLabels[type]}`}>{busyDocument === key ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}تنزيل</button>}</div>
                })}</div>}
              </section>

              {request.status === 'pending' && missing.length > 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">الطلب قديم أو غير مكتمل، ولا يمكن إنشاء المتجر قبل استكمال: {missing.join('، ')}. يظل الاعتماد محميًا في الخادم أيضًا.</p>}
              {request.adminNote && <p className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800">ملاحظة الإدارة السابقة: {request.adminNote}</p>}
              {request.status === 'pending' && <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
                <label className="flex-1 space-y-1.5"><span className="text-xs font-semibold text-neutral-600">ملاحظة الرفض (اختيارية)</span><input className="input" maxLength={1000} value={notes[request.id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="اكتب سببًا لمساعدة التاجر على تصحيح الطلب" /></label>
                <div className="flex gap-2">
                  <button type="button" disabled={isBusy} onClick={() => void decide(request, 'reject')} className="btn-secondary text-rose-700 disabled:opacity-50">{isBusy ? <LoaderCircle size={16} className="animate-spin" /> : <X size={16} />}رفض الطلب</button>
                  <button type="button" disabled={isBusy || missing.length > 0} title={missing.length ? `الملف ناقص: ${missing.join('، ')}` : ''} onClick={() => void decide(request, 'approve')} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">{isBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}اعتماد وإنشاء المتجر</button>
                </div>
              </div>}
              {request.companyId && <p className="text-xs text-neutral-500">معرّف المتجر: <code dir="ltr">{request.companyId}</code></p>}
            </article>
          })}
        </div>
      )}
    </div>
  )
}
