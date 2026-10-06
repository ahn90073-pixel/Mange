import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Eye,
  Store,
  Phone,
  Mail,
  MapPin,
  Filter,
} from 'lucide-react'
import { useDashboard } from '../context/DashboardContext'
import {
  formatCurrency,
  formatNumber,
  calculateCommission,
  calculateNetBalance,
} from '../utils/format'
import { vendorStatusMap } from '../data/mockData'

export default function VendorsListPage() {
  const { vendors } = useDashboard()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = vendors.filter((v) => {
    const matchesSearch =
      v.companyName.includes(search) ||
      v.merchantName.includes(search) ||
      v.id.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="بحث باسم الشركة، التاجر، أو الرقم..."
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
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="suspended">موقوف</option>
            <option value="pending_approval">بانتظار الموافقة</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-neutral-600 text-xs">
                <th className="text-right font-semibold px-5 py-3.5">التاجر</th>
                <th className="text-right font-semibold px-5 py-3.5">معلومات الاتصال</th>
                <th className="text-right font-semibold px-5 py-3.5">الحالة</th>
                <th className="text-right font-semibold px-5 py-3.5">المبيعات</th>
                <th className="text-right font-semibold px-5 py-3.5">العمولة</th>
                <th className="text-right font-semibold px-5 py-3.5">الصافي المستحق</th>
                <th className="text-right font-semibold px-5 py-3.5">المنتجات</th>
                <th className="text-center font-semibold px-5 py-3.5">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((vendor) => {
                const status = vendorStatusMap[vendor.status]
                const commission = calculateCommission(
                  vendor.totalSales,
                  vendor.commissionType,
                  vendor.commissionValue
                )
                const netBalance = calculateNetBalance(vendor)
                return (
                  <tr key={vendor.id} className="table-row-hover transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {vendor.logo}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-neutral-900 text-sm truncate">
                            {vendor.companyName}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">
                            {vendor.merchantName} · {vendor.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1 text-xs text-neutral-600">
                        <p className="flex items-center gap-1.5">
                          <Mail size={13} className="text-neutral-400" />
                          {vendor.email}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone size={13} className="text-neutral-400" />
                          {vendor.phone}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-neutral-400" />
                          {vendor.city}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={status.class}>{status.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-neutral-900">
                        {formatCurrency(vendor.totalSales)}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {formatNumber(vendor.totalOrders)} طلب
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-warning-600">
                        {vendor.commissionType === 'percentage'
                          ? `${vendor.commissionValue}%`
                          : formatCurrency(vendor.commissionValue)}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {formatCurrency(commission)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p
                        className={`font-bold text-sm ${
                          netBalance > 0 ? 'text-success-600' : 'text-neutral-400'
                        }`}
                      >
                        {formatCurrency(netBalance)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-neutral-700">
                        {formatNumber(vendor.totalProducts)}
                      </p>
                      {vendor.pendingProducts > 0 && (
                        <p className="text-xs text-warning-600">
                          {vendor.pendingProducts} بانتظار المراجعة
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        to={`/vendors/${vendor.id}`}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <Store size={48} className="mb-3" />
            <p className="text-sm">لا يوجد تجار مطابقون للبحث</p>
          </div>
        )}
      </div>
    </div>
  )
}
