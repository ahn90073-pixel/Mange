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
} from 'lucide-react'
import { useDashboard } from '../context/DashboardContext'
import { formatCurrency, formatDate } from '../utils/format'
import Modal from '../components/ui/Modal'

export default function PendingProductsPage() {
  const { products, approveProduct, rejectProduct } = useDashboard()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
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

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center text-warning-600">
            <Package size={20} />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900">{pendingCount}</p>
            <p className="text-xs text-neutral-500">بانتظار المراجعة</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center text-success-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900">{approvedCount}</p>
            <p className="text-xs text-neutral-500">تمت الموافقة</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center text-danger-600">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900">{rejectedCount}</p>
            <p className="text-xs text-neutral-500">مرفوض</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="بحث عن منتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pr-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="pending">بانتظار المراجعة</option>
            <option value="approved">تمت الموافقة</option>
            <option value="rejected">مرفوض</option>
            <option value="all">جميع المنتجات</option>
          </select>
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((product) => (
          <div
            key={product.id}
            className="card overflow-hidden hover:shadow-card-hover transition-shadow flex flex-col"
          >
            {/* Product image placeholder */}
            <div className="h-40 bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
              <Package size={48} className="text-neutral-300" />
            </div>

            <div className="p-5 flex-1 flex flex-col">
              {/* Status badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-neutral-400">{product.id}</span>
                {product.status === 'pending' && (
                  <span className="badge-warning">بانتظار المراجعة</span>
                )}
                {product.status === 'approved' && (
                  <span className="badge-success">تمت الموافقة</span>
                )}
                {product.status === 'rejected' && (
                  <span className="badge-danger">مرفوض</span>
                )}
              </div>

              <h3 className="font-bold text-neutral-900 text-sm mb-2 line-clamp-2">
                {product.name}
              </h3>

              <div className="space-y-1.5 text-xs text-neutral-500 mb-3">
                <p className="flex items-center gap-1.5">
                  <Store size={13} />
                  {product.vendorName}
                </p>
                <p className="flex items-center gap-1.5">
                  <Tag size={13} />
                  {product.category}
                </p>
                <p className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {formatDate(product.submittedAt)}
                </p>
              </div>

              <p className="text-xs text-neutral-600 line-clamp-2 mb-4">
                {product.description}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <p className="text-lg font-bold text-primary-600">
                  {formatCurrency(product.price)}
                </p>
              </div>

              {/* Action buttons */}
              {product.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleApprove(product)}
                    disabled={busyProductId === product.id}
                    className="btn-success flex-1 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Check size={16} />
                    موافقة
                  </button>
                  <button
                    onClick={() => {
                      setRejectModal(product)
                      setRejectReason('')
                    }}
                    disabled={busyProductId === product.id}
                    className="btn-danger flex-1"
                  >
                    <X size={16} />
                    رفض
                  </button>
                </div>
              )}

              {product.status === 'rejected' && product.rejectReason && (
                <div className="mt-4 p-3 rounded-xl bg-danger-50 text-xs text-danger-700 flex items-start gap-2">
                  <FileText size={14} className="flex-shrink-0 mt-0.5" />
                  <p>سبب الرفض: {product.rejectReason}</p>
                </div>
              )}

              {product.status === 'approved' && (
                <div className="mt-4 p-3 rounded-xl bg-success-50 text-xs text-success-700 flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  <p>تم نشر المنتج في متجر التاجر</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
          <Package size={48} className="mb-3" />
          <p className="text-sm">لا توجد منتجات مطابقة</p>
        </div>
      )}

      {/* Reject modal */}
      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="رفض المنتج"
      >
        {rejectModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-neutral-50">
              <p className="font-semibold text-neutral-900 text-sm">{rejectModal.name}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {rejectModal.vendorName} · {rejectModal.id}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                سبب الرفض
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="اكتب سبب رفض المنتج هنا..."
                rows={4}
                className="input resize-none"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectModal(null)} className="btn-secondary">
                إلغاء
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={16} />
                تأكيد الرفض
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
