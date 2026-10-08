import { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Trash2,
  Eye,
  Store,
  Tag,
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
} from 'lucide-react'
import { useDashboard } from '../context/DashboardContext'
import { formatCurrency, formatDate, formatNumber } from '../utils/format'
import Modal from '../components/ui/Modal'

// Helper: check if a product's publishedAt date is older than one month from today
function isOlderThanOneMonth(dateStr) {
  if (!dateStr) return false
  const published = new Date(dateStr)
  const now = new Date()
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  return published < oneMonthAgo
}

// Helper: calculate days since publication
function daysSince(dateStr) {
  if (!dateStr) return 0
  const published = new Date(dateStr)
  const now = new Date()
  return Math.floor((now - published) / (1000 * 60 * 60 * 24))
}

export default function ActiveProductsPage() {
  const { activeProducts, vendors, deleteActiveProduct, keepActiveProduct } = useDashboard()
  const [search, setSearch] = useState('')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [deleteModal, setDeleteModal] = useState(null)
  const [busyProductId, setBusyProductId] = useState(null)

  // Only show products older than one month
  const oldProducts = useMemo(
    () => activeProducts.filter((p) => isOlderThanOneMonth(p.publishedAt)),
    [activeProducts]
  )

  const filtered = oldProducts.filter((p) => {
    const query = search.trim().toLocaleLowerCase()
    const matchesSearch =
      String(p.name || '').toLocaleLowerCase().includes(query) ||
      String(p.category || '').toLocaleLowerCase().includes(query) ||
      String(p.id || '').toLocaleLowerCase().includes(query)
    const matchesVendor = vendorFilter === 'all' || p.vendorId === vendorFilter
    return matchesSearch && matchesVendor
  })

  // Group by vendor
  const groupedByVendor = filtered.reduce((acc, product) => {
    if (!acc[product.vendorId]) {
      acc[product.vendorId] = {
        vendorName: product.vendorName,
        vendorId: product.vendorId,
        products: [],
      }
    }
    acc[product.vendorId].products.push(product)
    return acc
  }, {})

  const vendorGroups = Object.values(groupedByVendor).sort(
    (a, b) => b.products.length - a.products.length
  )

  const confirmDelete = async () => {
    if (deleteModal) {
      setBusyProductId(deleteModal.id)
      try {
        const result = await deleteActiveProduct(deleteModal.id)
        if (result) setDeleteModal(null)
      } finally {
        setBusyProductId(null)
      }
    }
  }

  const handleKeep = async (product) => {
    setBusyProductId(product.id)
    try {
      await keepActiveProduct(product.id)
    } finally {
      setBusyProductId(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Summary banner */}
      <div className="card p-5 bg-warning-50/50 border-warning-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning-500 flex items-center justify-center text-white flex-shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 mb-1">
              منتجات مر عليها أكثر من شهر
            </h3>
            <p className="text-sm text-neutral-600">
              هذه قائمة بالمنتجات المنشورة لكل تاجر والتي مر على نشرها أكثر من 30 يوم.
              يمكنك مراجعتها واتخاذ قرار إما بالإبقاء عليها للعرض أو حذفها من المتجر.
            </p>
          </div>
          <div className="flex-shrink-0 text-left">
            <p className="text-2xl font-bold text-warning-600">{oldProducts.length}</p>
            <p className="text-xs text-neutral-500">منتج</p>
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
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">جميع التجار</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.companyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product groups by vendor */}
      {vendorGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
          <Package size={48} className="mb-3" />
          <p className="text-sm">لا توجد منتجات مر عليها أكثر من شهر</p>
        </div>
      ) : (
        <div className="space-y-6">
          {vendorGroups.map((group) => {
            const vendor = vendors.find((v) => v.id === group.vendorId)
            return (
              <div key={group.vendorId} className="card overflow-hidden">
                {/* Vendor header */}
                <div className="flex items-center gap-3 px-5 py-4 bg-neutral-50 border-b border-neutral-100">
                  <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {vendor?.logo || group.vendorId.slice(-2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-neutral-900 text-sm truncate">
                      {group.vendorName}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      {group.vendorId} · {group.products.length} منتج
                    </p>
                  </div>
                  <Store size={18} className="text-neutral-300" />
                </div>

                {/* Products table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white text-neutral-500 text-xs border-b border-neutral-100">
                        <th className="text-right font-semibold px-5 py-3">المنتج</th>
                        <th className="text-right font-semibold px-5 py-3">التصنيف</th>
                        <th className="text-right font-semibold px-5 py-3">السعر</th>
                        <th className="text-right font-semibold px-5 py-3">المبيعات</th>
                        <th className="text-right font-semibold px-5 py-3">تاريخ النشر</th>
                        <th className="text-right font-semibold px-5 py-3">عمر المنتج</th>
                        <th className="text-center font-semibold px-5 py-3">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {group.products.map((product) => {
                        const age = daysSince(product.publishedAt)
                        return (
                          <tr
                            key={product.id}
                            className={`table-row-hover transition-colors ${
                              product.kept ? 'bg-success-50/30' : ''
                            }`}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 flex-shrink-0 overflow-hidden">
                                  {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name || 'صورة المنتج'} loading="lazy" className="w-full h-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} />
                                  ) : <Package size={18} />}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-neutral-900 text-sm truncate">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-neutral-400">{product.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="badge-neutral">
                                <Tag size={12} />
                                {product.category}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-medium text-neutral-900">
                              {formatCurrency(product.price)}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-sm font-medium ${
                                product.salesCount < 20 ? 'text-danger-600' : 'text-neutral-700'
                              }`}>
                                {formatNumber(product.salesCount)}
                              </span>
                              {product.salesCount < 20 && (
                                <p className="text-xs text-danger-400">مبيعات ضعيفة</p>
                              )}
                            </td>
                            <td className="px-5 py-4 text-neutral-600">
                              <span className="flex items-center gap-1.5 text-xs">
                                <Calendar size={13} className="text-neutral-400" />
                                {formatDate(product.publishedAt)}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`badge ${
                                age > 90 ? 'badge-danger' : age > 60 ? 'badge-warning' : 'badge-neutral'
                              }`}>
                                {age} يوم
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-center gap-2">
                                {product.kept ? (
                                  <span className="badge-success">
                                    <CheckCircle2 size={14} />
                                    تم الإبقاء
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleKeep(product)}
                                      disabled={busyProductId === product.id}
                                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-success-600 hover:bg-success-50 transition-colors disabled:opacity-50"
                                      title="إبقاء للعرض"
                                    >
                                      <Eye size={18} />
                                    </button>
                                    <button
                                      onClick={() => setDeleteModal(product)}
                                      disabled={busyProductId === product.id}
                                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-danger-600 hover:bg-danger-50 transition-colors"
                                      title="حذف المنتج"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="تأكيد حذف المنتج"
      >
        {deleteModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-danger-50 flex items-start gap-3">
              <AlertTriangle size={20} className="text-danger-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-danger-700">
                  هل أنت متأكد من حذف هذا المنتج؟
                </p>
                <p className="text-xs text-danger-600 mt-1">
                  سيتم إزالة المنتج نهائياً من متجر التاجر ولن يظهر للتاجر أو للمستخدمين.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 flex-shrink-0">
                  <Package size={20} />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-sm">{deleteModal.name}</p>
                  <p className="text-xs text-neutral-500">{deleteModal.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <Tag size={12} />
                  {deleteModal.category}
                </div>
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <ShoppingCart size={12} />
                  {formatNumber(deleteModal.salesCount)} مبيعة
                </div>
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <Store size={12} />
                  {deleteModal.vendorName}
                </div>
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <Calendar size={12} />
                  {formatDate(deleteModal.publishedAt)}
                </div>
              </div>
              <div className="pt-2 border-t border-neutral-200 flex justify-between text-sm">
                <span className="text-neutral-500">السعر:</span>
                <span className="font-bold text-primary-600">{formatCurrency(deleteModal.price)}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteModal(null)} className="btn-secondary">
                إلغاء
              </button>
              <button onClick={confirmDelete} className="btn-danger">
                <Trash2 size={16} />
                نعم، احذف المنتج
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
