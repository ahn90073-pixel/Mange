import { useState } from 'react'
import {
  Check,
  X,
  Search,
  Package,
  Store,
  Calendar,
  Tag,
  FileText,
  Filter,
  CheckCircle2,
  XCircle,
  Pencil,
  ImagePlus,
} from 'lucide-react'
import { useDashboard } from '../context/DashboardContext'
import { formatCurrency, formatDate } from '../utils/format'
import Modal from '../components/ui/Modal'

const fieldClass = 'input'

function EditField({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-neutral-600 mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function editValues(product) {
  return {
    name: product.name || '',
    sku: product.sku || '',
    description: product.description || '',
    shortDescription: product.shortDescription || '',
    category: product.category === '—' ? '' : product.category || '',
    price: product.price ?? '',
    compareAtPrice: product.compareAtPrice ?? '',
    costPrice: product.costPrice ?? '',
    currency: product.currency || 'EGP',
    weightGrams: product.weightGrams ?? '',
    brand: product.brand || '',
    sellerName: product.sellerName || '',
    badge: product.badge || '',
    stockQuantity: product.stockQuantity ?? 0,
    imageUrl: product.imageUrl || '',
    trustedSeller: Boolean(product.trustedSeller),
    freeShipping: Boolean(product.freeShipping),
    isFeatured: Boolean(product.isFeatured),
    isFlashDeal: Boolean(product.isFlashDeal),
  }
}

export default function PendingProductsPage() {
  const { products, approveProduct, rejectProduct, updateProduct } = useDashboard()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [busyProductId, setBusyProductId] = useState(null)

  const filtered = products.filter((p) => {
    const query = search.trim().toLocaleLowerCase()
    const matchesSearch =
      String(p.name || '').toLocaleLowerCase().includes(query) ||
      String(p.vendorName || '').toLocaleLowerCase().includes(query) ||
      String(p.id || '').toLocaleLowerCase().includes(query)
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCount = products.filter((p) => p.status === 'pending').length
  const approvedCount = products.filter((p) => p.status === 'approved').length
  const rejectedCount = products.filter((p) => p.status === 'rejected').length

  const handleApprove = async (product) => {
    setBusyProductId(product.id)
    try {
      await approveProduct(product.id)
    } finally {
      setBusyProductId(null)
    }
  }

  const handleReject = async () => {
    if (rejectModal && rejectReason.trim()) {
      setBusyProductId(rejectModal.id)
      try {
        const result = await rejectProduct(rejectModal.id, rejectReason.trim())
        if (result) {
          setRejectModal(null)
          setRejectReason('')
        }
      } finally {
        setBusyProductId(null)
      }
    }
  }

  const openEditor = (product) => {
    setEditModal(product)
    setEditForm(editValues(product))
  }

  const setField = (field, value) => setEditForm((current) => ({ ...current, [field]: value }))

  const handleSaveEdit = async (event) => {
    event.preventDefault()
    if (!editModal || !editForm) return
    setBusyProductId(editModal.id)
    const updates = { ...editForm }
    for (const key of ['price', 'compareAtPrice', 'costPrice', 'weightGrams', 'stockQuantity']) {
      updates[key] = updates[key] === '' ? null : Number(updates[key])
    }
    try {
      const result = await updateProduct(editModal.id, updates)
      if (result) {
        setEditModal(null)
        setEditForm(null)
      }
    } finally {
      setBusyProductId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center text-warning-600"><Package size={20} /></div>
          <div><p className="text-xl font-bold text-neutral-900">{pendingCount}</p><p className="text-xs text-neutral-500">بانتظار المراجعة</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center text-success-600"><CheckCircle2 size={20} /></div>
          <div><p className="text-xl font-bold text-neutral-900">{approvedCount}</p><p className="text-xs text-neutral-500">تمت الموافقة</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center text-danger-600"><XCircle size={20} /></div>
          <div><p className="text-xl font-bold text-neutral-900">{rejectedCount}</p><p className="text-xs text-neutral-500">مرفوض</p></div>
        </div>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" placeholder="بحث عن منتج..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pr-10" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-neutral-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
            <option value="pending">بانتظار المراجعة</option>
            <option value="approved">تمت الموافقة</option>
            <option value="rejected">مرفوض</option>
            <option value="all">جميع المنتجات</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((product) => (
          <div key={product.id} className="card overflow-hidden hover:shadow-card-hover transition-shadow flex flex-col">
            <div className="h-48 bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name || 'صورة المنتج'} loading="lazy" className="w-full h-full object-contain" onError={(event) => { event.currentTarget.style.display = 'none' }} />
              ) : <div className="flex flex-col items-center gap-2 text-neutral-300"><ImagePlus size={42} /><span className="text-xs">لا توجد صورة للمنتج</span></div>}
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-neutral-400 truncate">{product.id}</span>
                {product.status === 'pending' && <span className="badge-warning">بانتظار المراجعة</span>}
                {product.status === 'approved' && <span className="badge-success">تمت الموافقة</span>}
                {product.status === 'rejected' && <span className="badge-danger">مرفوض</span>}
              </div>

              <h3 className="font-bold text-neutral-900 text-sm mb-2 line-clamp-2">{product.name}</h3>
              <div className="space-y-1.5 text-xs text-neutral-500 mb-3">
                <p className="flex items-center gap-1.5"><Store size={13} />{product.vendorName}</p>
                <p className="flex items-center gap-1.5"><Tag size={13} />{product.category}</p>
                <p className="flex items-center gap-1.5"><Calendar size={13} />{formatDate(product.submittedAt)}</p>
              </div>
              <p className="text-xs text-neutral-600 line-clamp-2 mb-4">{product.description}</p>
              <div className="flex items-center justify-between mt-auto"><p className="text-lg font-bold text-primary-600">{formatCurrency(product.price)}</p></div>

              {product.status === 'pending' && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button onClick={() => openEditor(product)} disabled={busyProductId === product.id} className="btn-secondary flex items-center justify-center gap-1 disabled:opacity-60" title="تعديل بيانات المنتج"><Pencil size={15} />تعديل</button>
                  <button onClick={() => handleApprove(product)} disabled={busyProductId === product.id} className="btn-success flex items-center justify-center gap-1 disabled:cursor-wait disabled:opacity-60"><Check size={15} />موافقة</button>
                  <button onClick={() => { setRejectModal(product); setRejectReason('') }} disabled={busyProductId === product.id} className="btn-danger flex items-center justify-center gap-1"><X size={15} />رفض</button>
                </div>
              )}
              {product.status === 'rejected' && product.rejectReason && (
                <div className="mt-4 p-3 rounded-xl bg-danger-50 text-xs text-danger-700 flex items-start gap-2"><FileText size={14} className="flex-shrink-0 mt-0.5" /><p>سبب الرفض: {product.rejectReason}</p></div>
              )}
              {product.status === 'approved' && (
                <div className="mt-4 p-3 rounded-xl bg-success-50 text-xs text-success-700 flex items-center gap-2"><CheckCircle2 size={14} /><p>تم نشر المنتج في متجر التاجر</p></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <div className="flex flex-col items-center justify-center py-16 text-neutral-400"><Package size={48} className="mb-3" /><p className="text-sm">لا توجد منتجات مطابقة</p></div>}

      <Modal open={!!editModal} onClose={() => { setEditModal(null); setEditForm(null) }} title="تعديل بيانات المنتج قبل الموافقة" maxWidth="max-w-4xl">
        {editModal && editForm && (
          <form onSubmit={handleSaveEdit} className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-full sm:w-44 h-36 rounded-xl bg-neutral-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {editForm.imageUrl ? <img src={editForm.imageUrl} alt="معاينة المنتج" className="w-full h-full object-contain" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <ImagePlus className="text-neutral-300" size={36} />}
              </div>
              <EditField label="رابط صورة المنتج (HTTP/HTTPS)" className="w-full">
                <input type="url" value={editForm.imageUrl} onChange={(event) => setField('imageUrl', event.target.value)} className={fieldClass} placeholder="https://example.com/product.jpg" dir="ltr" />
              </EditField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EditField label="اسم المنتج *"><input required maxLength={240} value={editForm.name} onChange={(e) => setField('name', e.target.value)} className={fieldClass} /></EditField>
              <EditField label="رمز المنتج (SKU)"><input required maxLength={120} value={editForm.sku} onChange={(e) => setField('sku', e.target.value)} className={fieldClass} dir="ltr" /></EditField>
              <EditField label="التصنيف"><input maxLength={500} value={editForm.category} onChange={(e) => setField('category', e.target.value)} className={fieldClass} /></EditField>
              <EditField label="العلامة التجارية"><input maxLength={500} value={editForm.brand} onChange={(e) => setField('brand', e.target.value)} className={fieldClass} /></EditField>
              <EditField label="السعر *"><input required type="number" min="0" step="0.01" value={editForm.price} onChange={(e) => setField('price', e.target.value)} className={fieldClass} /></EditField>
              <EditField label="العملة"><input maxLength={3} value={editForm.currency} onChange={(e) => setField('currency', e.target.value)} className={fieldClass} /></EditField>
              <EditField label="السعر قبل الخصم"><input type="number" min="0" step="0.01" value={editForm.compareAtPrice} onChange={(e) => setField('compareAtPrice', e.target.value)} className={fieldClass} /></EditField>
              <EditField label="سعر التكلفة"><input type="number" min="0" step="0.01" value={editForm.costPrice} onChange={(e) => setField('costPrice', e.target.value)} className={fieldClass} /></EditField>
              <EditField label="الكمية في المخزون"><input type="number" min="0" step="1" value={editForm.stockQuantity} onChange={(e) => setField('stockQuantity', e.target.value)} className={fieldClass} /></EditField>
              <EditField label="الوزن بالجرام"><input type="number" min="0" step="1" value={editForm.weightGrams} onChange={(e) => setField('weightGrams', e.target.value)} className={fieldClass} /></EditField>
              <EditField label="اسم البائع"><input maxLength={500} value={editForm.sellerName} onChange={(e) => setField('sellerName', e.target.value)} className={fieldClass} /></EditField>
              <EditField label="شارة المنتج"><input maxLength={500} value={editForm.badge} onChange={(e) => setField('badge', e.target.value)} className={fieldClass} /></EditField>
              <EditField label="وصف مختصر" className="sm:col-span-2"><textarea maxLength={500} rows={2} value={editForm.shortDescription} onChange={(e) => setField('shortDescription', e.target.value)} className={`${fieldClass} resize-y`} /></EditField>
              <EditField label="الوصف التفصيلي" className="sm:col-span-2"><textarea maxLength={10000} rows={4} value={editForm.description} onChange={(e) => setField('description', e.target.value)} className={`${fieldClass} resize-y`} /></EditField>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-700">
              {[["trustedSeller", "بائع موثوق"], ["freeShipping", "شحن مجاني"], ["isFeatured", "منتج مميز"], ["isFlashDeal", "عرض سريع"]].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={editForm[key]} onChange={(e) => setField(key, e.target.checked)} />{label}</label>
              ))}
            </div>
            <div className="flex gap-3 justify-end border-t border-neutral-100 pt-4">
              <button type="button" onClick={() => { setEditModal(null); setEditForm(null) }} className="btn-secondary">إلغاء</button>
              <button type="submit" disabled={busyProductId === editModal.id} className="btn-primary disabled:opacity-50">حفظ التعديلات</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="رفض المنتج">
        {rejectModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-neutral-50"><p className="font-semibold text-neutral-900 text-sm">{rejectModal.name}</p><p className="text-xs text-neutral-500 mt-1">{rejectModal.vendorName} · {rejectModal.id}</p></div>
            <div><label className="block text-sm font-medium text-neutral-700 mb-2">سبب الرفض</label><textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="اكتب سبب رفض المنتج هنا..." rows={4} maxLength={2000} className="input resize-none" autoFocus /><p className="text-xs text-neutral-400 mt-1">سيُحفظ السبب على المنتج ويظهر ضمن بياناته للتاجر.</p></div>
            <div className="flex gap-3 justify-end"><button onClick={() => setRejectModal(null)} className="btn-secondary">إلغاء</button><button onClick={handleReject} disabled={!rejectReason.trim() || busyProductId === rejectModal.id} className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"><X size={16} />تأكيد الرفض</button></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
