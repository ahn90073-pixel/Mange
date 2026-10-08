import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  Percent,
  FileText,
  Ban,
  CheckCircle,
  Receipt,
} from 'lucide-react'
import { useDashboard } from '../context/DashboardContext'
import {
  formatCurrency,
  formatNumber,
  formatDate,
  calculateCommission,
  calculateNetBalance,
} from '../utils/format'
import { vendorStatusMap } from '../data/mockData'
import { generateVendorReportPDF } from '../utils/pdfGenerator'

export default function VendorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { vendors, settlements, updateVendorStatus, user } = useDashboard()

  const vendor = vendors.find((v) => v.id === id)

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <Store size={48} className="mb-3" />
        <p className="text-sm mb-4">التاجر غير موجود</p>
        <button onClick={() => navigate('/vendors')} className="btn-secondary">
          العودة لقائمة التجار
        </button>
      </div>
    )
  }

  const commission = Number.isFinite(Number(vendor.commissionAmount))
    ? Number(vendor.commissionAmount)
    : calculateCommission(vendor.totalSales, vendor.commissionType, vendor.commissionValue)
  const netBalance = calculateNetBalance(vendor)
  const status = vendorStatusMap[vendor.status] || { label: vendor.status || 'غير محدد', class: 'badge-neutral' }
  const vendorSettlements = settlements.filter((s) => s.vendorId === vendor.id)

  const financialCards = [
    {
      title: 'إجمالي المبيعات',
      value: formatCurrency(vendor.totalSales),
      icon: DollarSign,
      color: 'primary',
    },
    {
      title: 'عمولة المنصة',
      value: formatCurrency(commission),
      sub:
        vendor.commissionType === 'percentage'
          ? `نسبة ${vendor.commissionValue}%`
          : 'مبلغ ثابت',
      icon: Percent,
      color: 'warning',
    },
    {
      title: 'المبلغ المسدد',
      value: formatCurrency(vendor.settledAmount),
      icon: Receipt,
      color: 'neutral',
    },
    {
      title: 'الصافي المستحق',
      value: formatCurrency(netBalance),
      icon: CheckCircle,
      color: netBalance > 0 ? 'success' : 'neutral',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/vendors"
        className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-600 transition-colors"
      >
        <ArrowRight size={16} />
        العودة لقائمة التجار
      </Link>

      {/* Vendor header */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-l from-primary-600 to-primary-800 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {vendor.logo}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-white">{vendor.companyName}</h2>
                <span className={`badge ${status.class === 'badge-success' ? 'bg-white/20 text-white' : status.class}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-primary-100 text-sm">{vendor.merchantName} · {vendor.id}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => generateVendorReportPDF(vendor, user)}
                className="btn bg-white/15 text-white hover:bg-white/25 backdrop-blur"
              >
                <FileText size={16} />
                تحميل التقرير PDF
              </button>
              {vendor.status === 'active' ? (
                <button
                  onClick={() => updateVendorStatus(vendor.id, 'suspended')}
                  className="btn bg-danger-500/90 text-white hover:bg-danger-600"
                >
                  <Ban size={16} />
                  إيقاف الحساب
                </button>
              ) : (
                <button
                  onClick={() => updateVendorStatus(vendor.id, 'active')}
                  className="btn bg-success-500/90 text-white hover:bg-success-600"
                >
                  <CheckCircle size={16} />
                  تفعيل الحساب
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-100">
          <div className="bg-white p-4 flex items-center gap-3">
            <Mail size={18} className="text-neutral-400" />
            <div className="min-w-0">
              <p className="text-xs text-neutral-500">البريد الإلكتروني</p>
              <p className="text-sm font-medium text-neutral-800 truncate">{vendor.email}</p>
            </div>
          </div>
          <div className="bg-white p-4 flex items-center gap-3">
            <Phone size={18} className="text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-500">الهاتف</p>
              <p className="text-sm font-medium text-neutral-800">{vendor.phone}</p>
            </div>
          </div>
          <div className="bg-white p-4 flex items-center gap-3">
            <MapPin size={18} className="text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-500">المدينة</p>
              <p className="text-sm font-medium text-neutral-800">{vendor.city}</p>
            </div>
          </div>
          <div className="bg-white p-4 flex items-center gap-3">
            <Calendar size={18} className="text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-500">تاريخ التسجيل</p>
              <p className="text-sm font-medium text-neutral-800">{formatDate(vendor.registeredAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial overview */}
      <div>
        <h3 className="text-base font-bold text-neutral-900 mb-4">الحساب المالي</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {financialCards.map((card, i) => {
            const Icon = card.icon
            const colorMap = {
              primary: 'text-primary-600 bg-primary-50',
              warning: 'text-warning-600 bg-warning-50',
              success: 'text-success-600 bg-success-50',
              neutral: 'text-neutral-600 bg-neutral-100',
            }
            return (
              <div key={i} className="card p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[card.color]}`}>
                  <Icon size={20} />
                </div>
                <p className="text-xs text-neutral-500 mb-1">{card.title}</p>
                <p className="text-xl font-bold text-neutral-900">{card.value}</p>
                {card.sub && <p className="text-xs text-neutral-400 mt-1">{card.sub}</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{formatNumber(vendor.totalProducts)}</p>
            <p className="text-sm text-neutral-500">إجمالي المنتجات</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center text-warning-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{formatNumber(vendor.pendingProducts)}</p>
            <p className="text-sm text-neutral-500">منتجات بانتظار المراجعة</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center text-success-600">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{formatNumber(vendor.totalOrders)}</p>
            <p className="text-sm text-neutral-500">إجمالي الطلبات</p>
          </div>
        </div>
      </div>

      {/* Settlements history */}
      <div className="card p-6">
        <h3 className="text-base font-bold text-neutral-900 mb-4">سجل السدادات المالية</h3>
        {vendorSettlements.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <Receipt size={36} className="mx-auto mb-2" />
            <p className="text-sm">لا يوجد سدادات مالية لهذا التاجر</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 text-neutral-600 text-xs">
                  <th className="text-right font-semibold px-4 py-3">رقم السند</th>
                  <th className="text-right font-semibold px-4 py-3">التاريخ</th>
                  <th className="text-right font-semibold px-4 py-3">الفترة</th>
                  <th className="text-right font-semibold px-4 py-3">المبلغ الإجمالي</th>
                  <th className="text-right font-semibold px-4 py-3">العمولة</th>
                  <th className="text-right font-semibold px-4 py-3">الصافي</th>
                  <th className="text-right font-semibold px-4 py-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {vendorSettlements.map((s) => (
                  <tr key={s.id} className="table-row-hover">
                    <td className="px-4 py-3 font-medium text-neutral-800">{s.id}</td>
                    <td className="px-4 py-3 text-neutral-600">{formatDate(s.date)}</td>
                    <td className="px-4 py-3 text-neutral-600">{s.period}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{formatCurrency(s.amount)}</td>
                    <td className="px-4 py-3 text-warning-600">{formatCurrency(s.commissionDeducted)}</td>
                    <td className="px-4 py-3 font-bold text-success-600">{formatCurrency(s.netAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={s.status === 'completed' ? 'badge-success' : 'badge-warning'}>
                        {s.status === 'completed' ? 'مكتمل' : 'قيد المعالجة'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
