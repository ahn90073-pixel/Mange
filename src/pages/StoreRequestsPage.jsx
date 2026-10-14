import { useCallback, useEffect, useState } from 'react'
import { Check, Clock3, Download, Eye, FileCheck2, LoaderCircle, RefreshCw, Share2, Store, X } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { adminApi } from '../api/client'

const statusLabels = { pending: 'قيد المراجعة', approved: 'تمت الموافقة', rejected: 'مرفوض' }
const documentLabels = {
  nationalId: 'البطاقة الشخصية لصاحب الحساب',
  commercialRegister: 'مستند السجل التجاري',
  propertyContract: 'عقد أو بوليصة إثبات عنوان المستودع',
}
const payoutLabels = { vodafone_cash: 'فودافون كاش', instapay: 'InstaPay', bank: 'حساب بنكي' }
const requiredDocumentTypes = Object.keys(documentLabels)
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '')
    reader.onerror = () => reject(reader.error || new Error('تعذر قراءة الملف.'))
    reader.readAsDataURL(blob)
  })
}
async function shareNativeFiles(files, title, text = '') {
  const saved = []
  try {
    const uris = []
    for (const [index, file] of files.entries()) {
      const safeName = file.name.replace(/[^\p{L}\p{N}._-]/gu, '_')
      const path = `merchant-documents/${Date.now()}-${index}-${safeName}`
      const result = await Filesystem.writeFile({
        path,
        data: await blobToBase64(file),
        directory: Directory.Cache,
        recursive: true,
      })
      saved.push(path)
      uris.push(result.uri)
    }
    return await Share.share({ title, text, files: uris, dialogTitle: title })
  } finally {
    await Promise.all(saved.map((path) => Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => {})))
  }
}

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
  const [sharingId, setSharingId] = useState('')
  const [pendingShare, setPendingShare] = useState(null)
  const [preview, setPreview] = useState(null)
  const [notes, setNotes] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const nativePlatform = Capacitor.isNativePlatform()
  const nativeFileShareAvailable = nativePlatform && Capacitor.isPluginAvailable('Filesystem') && Capacitor.isPluginAvailable('Share')

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

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
  }, [preview?.url])

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
      const extension = contentType === 'application/pdf' ? 'pdf' : contentType === 'image/png' ? 'png' : 'jpg'
      const fileName = `${documentType}.${extension}`
      const file = new File([blob], fileName, { type: contentType || blob.type })
      if (nativeFileShareAvailable) {
        await shareNativeFiles([file], fileName)
      } else if (nativePlatform && typeof navigator.share !== 'function') {
        throw new Error('يلزم تثبيت إصدار التطبيق الجديد لتفعيل حفظ ومشاركة المستندات على الهاتف.')
      } else if (nativePlatform && typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: fileName, files: [file] })
      } else {
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = fileName
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 30000)
      }
    } catch (downloadError) {
      if (downloadError?.name !== 'AbortError') setError(downloadError.message || 'تعذر تنزيل المستند.')
    } finally {
      setBusyDocument('')
    }
  }

  const previewDocument = async (requestId, documentType, contentType) => {
    const key = `${requestId}:${documentType}`
    setBusyDocument(key)
    setError('')
    try {
      const blob = await adminApi.storeRequestDocument(requestId, documentType)
      const resolvedType = contentType || blob.type
      const extension = resolvedType === 'application/pdf' ? 'pdf' : resolvedType === 'image/png' ? 'png' : 'jpg'
      setPreview({ requestId, documentType, url: URL.createObjectURL(blob), contentType: resolvedType, label: documentLabels[documentType], fileName: `${documentType}.${extension}` })
    } catch (previewError) {
      setError(previewError.message || 'تعذر فتح المستند.')
    } finally {
      setBusyDocument('')
    }
  }

  const shareRequestDocuments = async (request) => {
    const documents = request.documents || []
    if (!documents.length) return
    if (!nativeFileShareAvailable && typeof navigator.share !== 'function') {
      setError(nativePlatform ? 'يلزم تثبيت إصدار التطبيق الجديد لتفعيل مشاركة الملفات.' : 'مشاركة الملفات غير مدعومة في هذا المتصفح. نزّل الملفات ثم أرفقها يدويًا في WhatsApp.')
      return
    }
    setSharingId(request.id)
    setError('')
    try {
      const files = await Promise.all(documents.map(async (document) => {
        const blob = await adminApi.storeRequestDocument(request.id, document.documentType)
        const extension = document.contentType === 'application/pdf' ? 'pdf' : document.contentType === 'image/png' ? 'png' : 'jpg'
        return new File([blob], `${document.documentType}.${extension}`, { type: document.contentType || blob.type })
      }))
      if (typeof navigator.canShare === 'function' && !navigator.canShare({ files })) {
        throw new Error('الجهاز لا يدعم مشاركة هذه الملفات. نزّلها ثم أرفقها يدويًا في WhatsApp.')
      }
      setPendingShare({ requestId: request.id, title: `مستندات تسجيل ${request.storeName || 'المنشأة'}`, files })
    } catch (shareError) {
      setError(shareError.message || 'تعذر تجهيز الملفات للمشاركة من هذا الجهاز.')
    } finally {
      setSharingId('')
    }
  }

  const confirmShare = async () => {
    if (!pendingShare || (!nativeFileShareAvailable && typeof navigator.share !== 'function')) return
    try {
      setSharingId(pendingShare.requestId)
      setError('')
      if (nativeFileShareAvailable) {
        await shareNativeFiles(pendingShare.files, pendingShare.title, 'مستندات طلب تسجيل المنشأة')
      } else {
        await navigator.share({ title: pendingShare.title, text: 'مستندات طلب تسجيل المنشأة', files: pendingShare.files })
      }
      setPendingShare(null)
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') setError(shareError.message || 'تعذرت مشاركة الملفات من هذا الجهاز.')
    } finally {
      setSharingId('')
    }
  }

  return (
    <div dir="rtl" className="w-full min-w-0 max-w-full space-y-5 overflow-x-hidden sm:space-y-6">
      <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0"><h2 className="text-xl font-bold text-neutral-900">طلبات إنشاء متجر</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-500">تعرض هذه الصفحة ملف الشركة ومستنداته الخاصة. لا تُنشأ الشركة أو بيئتها المنفصلة إلا بعد اعتماد ملف مكتمل.</p></div>
        <div className="flex w-full min-w-0 gap-2 sm:w-auto">
          <select aria-label="حالة الطلب" className="input min-w-0 flex-1 text-base sm:w-44 sm:flex-none sm:text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="pending">قيد المراجعة</option><option value="all">كل الطلبات</option><option value="approved">المعتمدة</option><option value="rejected">المرفوضة</option>
          </select>
          <button type="button" onClick={loadRequests} disabled={loading} className="btn-secondary shrink-0 px-3 sm:px-4" aria-label="تحديث الطلبات"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />تحديث</button>
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
            return <article key={request.id} className="card min-w-0 space-y-4 p-3 sm:space-y-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Store size={20} /></span><div><h3 className="text-lg font-bold text-neutral-900">{request.storeName}</h3><p className="mt-1 text-sm text-neutral-500">أُرسل {request.createdAt ? new Date(request.createdAt).toLocaleString('ar-EG') : '—'}</p></div></div>
                <span className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${request.status === 'pending' ? 'bg-amber-50 text-amber-800' : request.status === 'approved' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}><Clock3 size={14} />{statusLabels[request.status] || request.status}</span>
              </div>

              <section className="space-y-4">
                <h4 className="font-bold text-neutral-800">بيانات مقدم الطلب والمنشأة</h4>
                <dl className="grid min-w-0 grid-cols-1 gap-3 rounded-xl bg-neutral-50 p-3 min-[420px]:grid-cols-2 sm:gap-4 sm:p-4 lg:grid-cols-4">
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
                  return <div key={type} className="flex min-w-0 flex-col gap-3 rounded-xl border border-neutral-200 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-words text-sm font-semibold text-neutral-800">{documentLabels[type]}</p><p className="mt-1 text-xs text-neutral-500">{document ? `${Math.ceil(Number(document.sizeBytes || 0) / 1024)} كيلوبايت · ${document.contentType || ''}` : 'غير مرفوع'}</p></div>{document && <div className="flex shrink-0 flex-wrap gap-2"><button type="button" className="btn-secondary px-3" disabled={busyDocument === key} onClick={() => void previewDocument(request.id, type, document.contentType)} aria-label={`عرض ${documentLabels[type]}`}>{busyDocument === key ? <LoaderCircle size={16} className="animate-spin" /> : <Eye size={16} />}عرض</button><button type="button" className="btn-secondary px-3" disabled={busyDocument === key} onClick={() => void downloadDocument(request.id, type, document.contentType)} aria-label={`${nativePlatform ? 'حفظ أو مشاركة' : 'تنزيل'} ${documentLabels[type]}`}><Download size={16} />{nativePlatform ? nativeFileShareAvailable ? 'حفظ / مشاركة' : 'تحديث مطلوب' : 'تنزيل'}</button></div>}</div>
                })}</div>}
              </section>

              {documents.length > 0 && <div className="space-y-2 rounded-xl border border-sky-100 bg-sky-50 p-3"><button type="button" className="btn-secondary" disabled={sharingId === request.id} onClick={() => pendingShare?.requestId === request.id ? void confirmShare() : void shareRequestDocuments(request)}>{sharingId === request.id ? <LoaderCircle size={16} className="animate-spin" /> : <Share2 size={16} />}{pendingShare?.requestId === request.id ? 'فتح WhatsApp لمشاركة الملفات' : 'تجهيز المستندات للمشاركة'}</button><p className="text-xs leading-5 text-sky-900">اضغط للتجهيز، ثم اضغط مرة أخرى لفتح شاشة المشاركة. اختر WhatsApp والمحادثة المقصودة، ولن ترسل الملفات إلا عند تأكيدك الإرسال.</p></div>}

              {request.status === 'pending' && missing.length > 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">الطلب قديم أو غير مكتمل، ولا يمكن إنشاء المتجر قبل استكمال: {missing.join('، ')}. يظل الاعتماد محميًا في الخادم أيضًا.</p>}
              {request.adminNote && <p className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800">ملاحظة الإدارة السابقة: {request.adminNote}</p>}
              {request.status === 'pending' && <div className="flex min-w-0 flex-col gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
                <label className="min-w-0 flex-1 space-y-1.5"><span className="text-xs font-semibold text-neutral-600">ملاحظة الرفض (اختيارية)</span><input className="input min-w-0 text-base sm:text-sm" maxLength={1000} value={notes[request.id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="اكتب سببًا لمساعدة التاجر على تصحيح الطلب" /></label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={isBusy} onClick={() => void decide(request, 'reject')} className="btn-secondary text-rose-700 disabled:opacity-50">{isBusy ? <LoaderCircle size={16} className="animate-spin" /> : <X size={16} />}رفض الطلب</button>
                  <button type="button" disabled={isBusy || missing.length > 0} title={missing.length ? `الملف ناقص: ${missing.join('، ')}` : ''} onClick={() => void decide(request, 'approve')} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">{isBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}اعتماد وإنشاء المتجر</button>
                </div>
              </div>}
              {request.companyId && <p className="text-xs text-neutral-500">معرّف المتجر: <code dir="ltr">{request.companyId}</code></p>}
            </article>
          })}
        </div>
      )}

      {preview && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-2 sm:p-6" role="dialog" aria-modal="true" aria-label={`معاينة ${preview.label}`} onClick={() => setPreview(null)}><section className="flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]" onClick={(event) => event.stopPropagation()}><header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-3 py-2 sm:px-4 sm:py-3"><h2 className="min-w-0 break-words text-sm font-bold text-neutral-900 sm:text-base">{preview.label}</h2><button type="button" className="shrink-0 rounded-lg p-2 text-neutral-600 hover:bg-neutral-100" onClick={() => setPreview(null)} aria-label="إغلاق المعاينة"><X size={20} /></button></header><div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-neutral-100 p-2 sm:p-5">{preview.contentType?.startsWith('image/') ? <img src={preview.url} alt={preview.label} className="max-h-[calc(100dvh-8rem)] max-w-full object-contain" /> : <iframe src={preview.url} title={preview.label} className="h-[calc(100dvh-8rem)] w-full rounded-lg bg-white" />}</div><footer className="flex shrink-0 justify-end border-t border-neutral-200 p-3"><button type="button" className="btn-primary" onClick={() => void downloadDocument(preview.requestId, preview.documentType, preview.contentType)}><Download size={16} />{nativePlatform ? nativeFileShareAvailable ? 'حفظ أو مشاركة' : 'تحديث التطبيق مطلوب' : 'تنزيل المستند'}</button></footer></section></div>}
    </div>
  )
}
