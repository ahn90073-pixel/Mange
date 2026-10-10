import { Link } from 'react-router-dom'
import {
  Store,
  PackageCheck,
  DollarSign,
  Receipt,
  ArrowLeft,
  Users,
  TrendingUp,
} from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import { useDashboard } from '../context/DashboardContext'
import { formatCurrency, formatNumber, calculateCommission } from '../utils/format'
import { orderStatusMap } from '../data/mockData'

export default function DashboardPage() {
  const { vendors, products, settlements, dashboard, recentOrders, user } = useDashboard()
  const isSuperAdmin = user?.role === 'super_admin'
  const metrics = dashboard?.metrics || {}
  const totalSales = isSuperAdmin ? (metrics.totalSales ?? vendors.reduce((sum, vendor) => sum + (vendor.totalSales || 0), 0)) : 0
  const totalCommission = isSuperAdmin ? (metrics.totalCommission ?? vendors.reduce(
    (sum, vendor) => sum + calculateCommission(vendor.totalSales, vendor.commissionType, vendor.commissionValue), 0,
  )) : 0
  const totalSettled = metrics.totalSettled ?? settlements
    .filter((settlement) => settlement.status === 'completed')
    .reduce((sum, settlement) => sum + settlement.netAmount, 0)
  const pendingCount = metrics.pendingProducts ?? products.filter((product) => product.status === 'pending').length
  const activeVendors = metrics.activeVendors ?? vendors.filter((vendor) => vendor.status === 'active').length
  const totalOrders = metrics.totalOrders ?? vendors.reduce((sum, vendor) => sum + (vendor.totalOrders || 0), 0)
  const topVendors = dashboard?.topVendors || [...vendors]
    .sort((a, b) => isSuperAdmin ? (b.totalSales || 0) - (a.totalSales || 0) : (b.totalOrders || 0) - (a.totalOrders || 0))
    .slice(0, 4)

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        {isSuperAdmin && <>
          <StatCard title="إجمالي المبيعات" value={formatCurrency(totalSales)} icon={DollarSign} color="primary" trend={12} trendLabel="مقارنة بالشهر الماضي" />
          <StatCard title="عمولة المنصة" value={formatCurrency(totalCommission)} icon={TrendingUp} color="success" trend={8} trendLabel="إجمالي العمولات المقتطعة" />
        </>}
        <StatCard title="التجار النشطون" value={`${activeVendors} / ${vendors.length}`} icon={Store} color="warning" trendLabel="تجار ضمن نطاق الصلاحية" />
        {isSuperAdmin
          ? <StatCard title="منتجات بانتظار المراجعة" value={formatNumber(pendingCount)} icon={PackageCheck} color="danger" trendLabel="تحتاج إجراء فوري" />
          : <StatCard title="إجمالي الطلبات" value={formatNumber(totalOrders)} icon={Users} color="primary" trendLabel="ضمن المحافظات المعيّنة" />}
      </div>

      <div className={`grid grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4`}>
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600"><Store size={20} /></div>
          <div><p className="text-xs text-neutral-500">إجمالي التجار</p><p className="text-lg font-bold text-neutral-900">{vendors.length}</p></div>
        </div>
        {isSuperAdmin && <div className="card flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-600"><Receipt size={20} /></div>
          <div><p className="text-xs text-neutral-500">السدادات المكتملة</p><p className="text-lg font-bold text-neutral-900">{settlements.filter((settlement) => settlement.status === 'completed').length}</p></div>
        </div>}
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-50 text-warning-600"><Users size={20} /></div>
          <div><p className="text-xs text-neutral-500">إجمالي الطلبات</p><p className="text-lg font-bold text-neutral-900">{formatNumber(totalOrders)}</p></div>
        </div>
        {isSuperAdmin && <div className="card flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-50 text-danger-600"><DollarSign size={20} /></div>
          <div><p className="text-xs text-neutral-500">المبلغ المصروف</p><p className="text-lg font-bold text-neutral-900">{formatCurrency(totalSettled)}</p></div>
        </div>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-900">{isSuperAdmin ? 'أعلى التجار مبيعًا' : 'التجار ضمن نطاقك'}</h3>
            <Link to="/vendors" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">عرض الكل<ArrowLeft size={16} /></Link>
          </div>
          <div className="space-y-3">
            {topVendors.map((vendor, index) => (
              <Link key={vendor.id} to={`/vendors/${vendor.id}`} className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-neutral-50">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${index === 0 ? 'bg-warning-500' : index === 1 ? 'bg-neutral-400' : index === 2 ? 'bg-warning-700' : 'bg-primary-500'}`}>{vendor.logo}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-neutral-800">{vendor.companyName}</p><p className="truncate text-xs text-neutral-500">{vendor.governorate || vendor.merchantName || 'المحافظة غير محددة'}</p></div>
                <div className="flex-shrink-0 text-left">
                  {isSuperAdmin && <p className="text-sm font-bold text-neutral-900">{formatCurrency(vendor.totalSales)}</p>}
                  <p className="text-xs text-neutral-500">{formatNumber(vendor.totalOrders)} طلب</p>
                </div>
              </Link>
            ))}
            {topVendors.length === 0 && <p className="py-8 text-center text-sm text-neutral-500">لا يوجد تجار ضمن نطاق المحافظات المعيّنة.</p>}
          </div>
        </section>

        <section className="card p-6">
          <h3 className="mb-5 text-base font-bold text-neutral-900">أحدث الطلبات ضمن النطاق</h3>
          <div className="space-y-2">
            {recentOrders.map((order) => {
              const status = orderStatusMap[order.status] || { label: order.status || '—', class: 'badge-neutral' }
              return <div key={order.orderId || order.id} className="flex items-center gap-3 rounded-xl p-3 hover:bg-neutral-50">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-neutral-800">{order.id}</p><p className="truncate text-xs text-neutral-500">{order.customer} · {order.vendorName}</p></div>
                <span className={status.class}>{status.label}</span>
                <p className="flex-shrink-0 text-sm font-bold text-neutral-900">{formatCurrency(order.amount)}</p>
              </div>
            })}
            {recentOrders.length === 0 && <p className="py-8 text-center text-sm text-neutral-500">لا توجد طلبات متاحة ضمن النطاق المعيّن.</p>}
          </div>
        </section>
      </div>

      {isSuperAdmin && pendingCount > 0 && <Link to="/pending-products" className="block rounded-2xl border border-warning-100 bg-warning-50/50 p-5 transition-shadow hover:shadow-card-hover">
        <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-500 text-white"><PackageCheck size={24} /></div><div className="flex-1"><p className="font-bold text-neutral-900">{pendingCount} منتج بانتظار المراجعة</p><p className="text-sm text-neutral-600">يرجى مراجعة المنتجات الجديدة المرفوعة من التجار</p></div><ArrowLeft className="text-warning-600" size={20} /></div>
      </Link>}
    </div>
  )
}
