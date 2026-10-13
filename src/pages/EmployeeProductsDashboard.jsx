import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock3, Package, PackageCheck, PackageX, Search, XCircle } from 'lucide-react'
import { useDashboard } from '../context/DashboardContext'
import { formatCurrency, formatDate, formatNumber } from '../utils/format'

function isOlderThanOneMonth(dateValue) {
  if (!dateValue) return false
  const published = new Date(dateValue)
  if (Number.isNaN(published.getTime())) return false
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 1)
  return published < cutoff
}

const statusDetails = {
  pending: { label: 'بانتظار المراجعة', className: 'badge-warning' },
  approved: { label: 'منشور', className: 'badge-success' },
  active: { label: 'منشور', className: 'badge-success' },
  rejected: { label: 'مرفوض', className: 'badge-danger' },
}

function MetricCard({ title, value, icon: Icon, tone, to, description }) {
  const card = (
    <div className={`card flex h-full items-center gap-4 p-5 ${to ? 'transition-shadow hover:shadow-card-hover' : ''}`}>
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={23} /></div>
      <div className="min-w-0"><p className="text-2xl font-bold text-neutral-900">{formatNumber(value)}</p><p className="text-sm font-semibold text-neutral-700">{title}</p>{description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}</div>
    </div>
  )
  return to ? <Link to={to} className="block">{card}</Link> : card
}

export default function EmployeeProductsDashboard() {
  const { products, activeProducts } = useDashboard()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const pendingCount = products.filter((product) => product.status === 'pending').length
  const publishedCount = products.filter((product) => ['approved', 'active'].includes(product.status)).length
  const rejectedCount = products.filter((product) => product.status === 'rejected').length
  const olderCount = activeProducts.filter((product) => isOlderThanOneMonth(product.publishedAt)).length
  const lowStockCount = products.filter((product) => ['approved', 'active'].includes(product.status) && Number(product.stockQuantity) <= 5).length

  const recentProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return [...products]
      .filter((product) => statusFilter === 'all' || product.status === statusFilter)
      .filter((product) => !normalizedQuery || [product.name, product.vendorName, product.category, product.sku, product.id]
        .some((value) => String(value || '').toLocaleLowerCase().includes(normalizedQuery)))
      .sort((a, b) => new Date(b.submittedAt || b.publishedAt || 0) - new Date(a.submittedAt || a.publishedAt || 0))
      .slice(0, 12)
  }, [products, query, statusFilter])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-primary-100 bg-gradient-to-l from-primary-50 to-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary-700"><PackageCheck size={19} /><span className="text-xs font-bold">مساحة عمل المنتجات</span></div>
            <h2 className="text-lg font-bold text-neutral-900">لوحة المنتجات</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-600">متابعة المنتجات ومراجعتها ضمن المحافظات المسندة لحسابك. لا تتضمن هذه اللوحة بيانات مالية أو إدارة حسابات التجار.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/pending-products" className="btn-primary"><PackageCheck size={16} />مراجعة المنتجات</Link>
            <Link to="/active-products" className="btn-secondary"><PackageX size={16} />المنتجات القديمة</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="إجمالي المنتجات" value={products.length} icon={Package} tone="bg-primary-50 text-primary-600" />
        <MetricCard title="بانتظار المراجعة" value={pendingCount} icon={Clock3} tone="bg-warning-50 text-warning-600" to="/pending-products" description="منتجات تحتاج قرارًا" />
        <MetricCard title="منتجات منشورة" value={publishedCount} icon={CheckCircle2} tone="bg-success-50 text-success-600" />
        <MetricCard title="منتجات مرفوضة" value={rejectedCount} icon={XCircle} tone="bg-danger-50 text-danger-600" to="/pending-products" />
        <MetricCard title="مخزون منخفض" value={lowStockCount} icon={AlertTriangle} tone="bg-orange-50 text-orange-600" description="5 وحدات أو أقل" />
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div><h3 className="font-bold text-neutral-900">أحدث المنتجات</h3><p className="mt-1 text-xs text-neutral-500">يعرض أحدث 12 منتجًا ضمن نطاق صلاحيتك</p></div>
          <Link to="/active-products" className="text-sm font-semibold text-primary-600 hover:text-primary-700">مراجعة المنتجات القديمة</Link>
        </div>
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">البحث في المنتجات</span>
            <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="input pr-10" placeholder="ابحث بالمنتج أو التاجر أو التصنيف أو SKU..." />
          </label>
          <label>
            <span className="sr-only">تصفية حالة المنتج</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input w-full sm:w-auto">
              <option value="all">جميع الحالات</option><option value="pending">بانتظار المراجعة</option><option value="approved">منشور</option><option value="rejected">مرفوض</option>
            </select>
          </label>
        </div>
        {recentProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-14 text-center text-neutral-400"><Package size={38} className="mb-3" /><p className="text-sm">لا توجد منتجات مطابقة ضمن نطاقك</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-neutral-50 text-xs text-neutral-600"><th className="px-4 py-3 text-right">المنتج</th><th className="px-4 py-3 text-right">المتجر</th><th className="px-4 py-3 text-right">التصنيف</th><th className="px-4 py-3 text-right">السعر</th><th className="px-4 py-3 text-right">المخزون</th><th className="px-4 py-3 text-right">الحالة</th><th className="px-4 py-3 text-right">تاريخ الإضافة</th></tr></thead>
              <tbody className="divide-y divide-neutral-100">{recentProducts.map((product) => {
                const status = statusDetails[product.status] || { label: product.status || 'غير محددة', className: 'badge-neutral' }
                return <tr key={`${product.vendorId}-${product.id}`} className="table-row-hover">
                  <td className="min-w-52 px-4 py-3"><div className="flex items-center gap-3">{product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" className="h-10 w-10 rounded-lg border border-neutral-100 object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400"><Package size={17} /></div>}<div className="min-w-0"><p className="max-w-56 truncate font-semibold text-neutral-800">{product.name || 'منتج بلا اسم'}</p><p className="text-xs text-neutral-400">{product.sku || product.id}</p></div></div></td>
                  <td className="max-w-40 truncate px-4 py-3 text-neutral-600">{product.vendorName || '—'}</td><td className="px-4 py-3 text-neutral-600">{product.category || '—'}</td><td className="whitespace-nowrap px-4 py-3 font-semibold text-neutral-800">{formatCurrency(product.price, product.currency)}</td><td className="px-4 py-3 text-neutral-600">{formatNumber(product.stockQuantity)}</td><td className="px-4 py-3"><span className={status.className}>{status.label}</span></td><td className="whitespace-nowrap px-4 py-3 text-neutral-500">{formatDate(product.submittedAt || product.publishedAt)}</td>
                </tr>
              })}</tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 px-4 py-3 text-xs text-neutral-500"><span>{formatNumber(recentProducts.length)} من أحدث المنتجات المعروضة</span><span>{formatNumber(olderCount)} منتج منشور مرّ عليه أكثر من شهر</span></div>
      </section>
    </div>
  )
}
