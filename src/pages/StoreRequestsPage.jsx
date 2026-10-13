import { useCallback, useEffect, useState } from 'react'
import { Check, Clock3, LoaderCircle, RefreshCw, Store, X } from 'lucide-react'
import { adminApi } from '../api/client'

const statusLabels = { pending: 'قيد المراجعة', approved: 'تمت الموافقة', rejected: 'مرفوض' }

export default function StoreRequestsPage() {
  const [status, setStatus] = useState('pending')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
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

  return (
    <div dir="rtl" className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-xl font-bold text-neutral-900">طلبات إنشاء متجر</h2><p className="mt-1 text-sm leading-6 text-neutral-500">تُنشأ الشركة وبيئتها المنفصلة عند اعتماد الطلب فقط.</p></div>
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
            return <article key={request.id} className="card space-y-5 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Store size={20} /></span><div><h3 className="text-lg font-bold text-neutral-900">{request.storeName}</h3><p className="mt-1 text-sm text-neutral-500">أُرسل {request.createdAt ? new Date(request.createdAt).toLocaleString('ar-EG') : '—'}</p></div></div>
                <span className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${request.status === 'pending' ? 'bg-amber-50 text-amber-800' : request.status === 'approved' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}><Clock3 size={14} />{statusLabels[request.status] || request.status}</span>
              </div>

              <dl className="grid gap-4 rounded-xl bg-neutral-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-xs text-neutral-500">اسم التاجر</dt><dd className="mt-1 font-semibold text-neutral-900">{request.fullName}</dd></div>
                <div><dt className="text-xs text-neutral-500">البريد الإلكتروني</dt><dd className="mt-1 break-all text-sm font-medium text-neutral-800" dir="ltr">{request.email}</dd></div>
                <div><dt className="text-xs text-neutral-500">رقم الهاتف</dt><dd className="mt-1 text-sm font-medium text-neutral-800" dir="ltr">{request.phone}</dd></div>
                <div><dt className="text-xs text-neutral-500">المحافظة</dt><dd className="mt-1 font-medium text-neutral-800">{request.governorate}</dd></div>
              </dl>

              {request.adminNote && <p className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800">ملاحظة الإدارة السابقة: {request.adminNote}</p>}
              {request.status === 'pending' && <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
                <label className="flex-1 space-y-1.5"><span className="text-xs font-semibold text-neutral-600">ملاحظة الرفض (اختيارية)</span><input className="input" maxLength={1000} value={notes[request.id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="اكتب سببًا لمساعدة التاجر على تصحيح الطلب" /></label>
                <div className="flex gap-2">
                  <button type="button" disabled={isBusy} onClick={() => void decide(request, 'reject')} className="btn-secondary text-rose-700 disabled:opacity-50">{isBusy ? <LoaderCircle size={16} className="animate-spin" /> : <X size={16} />}رفض الطلب</button>
                  <button type="button" disabled={isBusy} onClick={() => void decide(request, 'approve')} className="btn-primary disabled:opacity-50">{isBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}اعتماد وإنشاء المتجر</button>
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
