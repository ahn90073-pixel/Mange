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
  const { vendors, products, settlements, dashboard, recentOrders } = useDashboard()
  const metrics = dashboard?.metrics || {}

  const totalSales = metrics.totalSales ?? vendors.reduce((sum, v) => sum + v.totalSales, 0)
  const totalCommission = metrics.totalCommission ?? vendors.reduce(
    (sum, v) => sum + calculateCommission(v.totalSales, v.commissionType, v.commissionValue),
    0
  )
  const totalSettled = metrics.totalSettled ?? settlements
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + s.netAmount, 0)
  const pendingCount = metrics.pendingProducts ?? products.filter((p) => p.status === 'pending').length
  const activeVendors = metrics.activeVendors ?? vendors.filter((v) => v.status === 'active').length

  const topVendors = dashboard?.topVendors || [...vendors]
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المبيعات"
          value={formatCurrency(totalSales)}
          icon={DollarSign}
          color="primary"
          trend={12}
          trendLabel="مقارنة بالشهر الماضي"
        />
        <StatCard
          title="عمولة المنصة"
          value={formatCurrency(totalCommission)}
          icon={TrendingUp}
          color="success"
          trend={8}
          trendLabel="إجمالي العمولات المقتطعة"
        />
        <StatCard
          title="التجار النشطون"
          value={`${activeVendors} / ${vendors.length}`}
          icon={Store}
          color="warning"
          trendLabel="تجار مسجلون"
        />
        <StatCard
          title="منتجات بانتظار المراجعة"
          value={formatNumber(pendingCount)}
          icon={PackageCheck}
          color="danger"
          trendLabel="تحتاج إجراء فوري"
        />
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
            <Store size={20} />
          </div>
          <div>
            <p className="text-xs text-neutral-500">إجمالي التجار</p>
            <p className="text-lg font-bold text-neutral-900">{vendors.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center text-success-600">
            <Receipt size={20} />
          </div>
          <div>
            <p className="text-xs text-neutral-500">السدادات المكتملة</p>
            <p className="text-lg font-bold text-neutral-900">{settlements.filter((s) => s.status === 'completed').length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center text-warning-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-neutral-500">إجمالي الطلبات</p>
            <p className="text-lg font-bold text-neutral-900">
              {formatNumber(vendors.reduce((sum, v) => sum + v.totalOrders, 0))}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-danger-50 flex items-center justify-center text-danger-600">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-xs text-neutral-500">المبلغ المصروف</p>
            <p className="text-lg font-bold text-neutral-900">{formatCurrency(totalSettled)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top vendors */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-neutral-900">أعلى التجار مبيعاً</h3>
            <Link
              to="/vendors"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft size={16} />
            </Link>
          </div>
          <div className="space-y-3">
            {topVendors.map((vendor, index) => (
              <Link
                key={vendor.id}
                to={`/vendors/${vendor.id}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                    index === 0
                      ? 'bg-warning-500'
                      : index === 1
                      ? 'bg-neutral-400'
                      : index === 2
                      ? 'bg-warning-700'
                      : 'bg-primary-500'
                  }`}
                >
                  {vendor.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-800 truncate">
                    {vendor.companyName}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">{vendor.merchantName}</p>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className="text-sm font-bold text-neutral-900">
                    {formatCurrency(vendor.totalSales)}
                  </p>
                  <p className="text-xs text-neutral-400">{vendor.totalOrders} طلب</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="card p-6">
          <h3 className="text-base font-bold text-neutral-900 mb-5">أحدث الطلبات</h3>
          <div className="space-y-2">
            {recentOrders.map((order) => {
              const status = orderStatusMap[order.status] || { label: order.status || '—', class: 'badge-neutral' }
              return (
                <div
                  key={order.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-800 truncate">
                      {order.id}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {order.customer} · {order.vendorName}
                    </p>
                  </div>
                  <span className={status.class}>{status.label}</span>
                  <p className="text-sm font-bold text-neutral-900 flex-shrink-0">
                    {formatCurrency(order.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Pending products alert */}
      {pendingCount > 0 && (
        <Link
          to="/pending-products"
          className="block card p-5 bg-warning-50/50 border-warning-100 hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning-500 flex items-center justify-center text-white">
              <PackageCheck size={24} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-neutral-900">
                {pendingCount} منتج بانتظار المراجعة
              </p>
              <p className="text-sm text-neutral-600">
                يرجى مراجعة المنتجات الجديدة المرفوعة من التجار
              </p>
            </div>
            <ArrowLeft className="text-warning-600" size={20} />
          </div>
        </Link>
      )}
    </div>
  )
}
