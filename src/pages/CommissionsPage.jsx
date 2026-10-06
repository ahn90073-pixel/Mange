import { useState } from 'react'
import {
  Percent,
  DollarSign,
  Save,
  Search,
  TrendingUp,
  Check,
} from 'lucide-react'
import { useDashboard } from '../context/DashboardContext'
import {
  formatCurrency,
  calculateCommission,
  calculateNetBalance,
} from '../utils/format'
import { vendorStatusMap } from '../data/mockData'
import Modal from '../components/ui/Modal'

export default function CommissionsPage() {
  const { vendors, updateCommission } = useDashboard()
  const [search, setSearch] = useState('')
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState({ type: 'percentage', value: 0 })

  const filtered = vendors.filter((v) =>
    v.companyName.includes(search) || v.merchantName.includes(search)
  )

  const openEdit = (vendor) => {
    setForm({ type: vendor.commissionType, value: vendor.commissionValue })
    setEditModal(vendor)
  }

  const handleSave = () => {
    if (editModal && form.value >= 0) {
      updateCommission(editModal.id, form.type, Number(form.value))
      setEditModal(null)
    }
  }

  const totalCommission = vendors.reduce(
    (sum, v) => sum + calculateCommission(v.totalSales, v.commissionType, v.commissionValue),
    0
  )

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center text-warning-600">
            <Percent size={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900">{formatCurrency(totalCommission)}</p>
            <p className="text-sm text-neutral-500">إجمالي العمولات</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900">
              {vendors.filter((v) => v.commissionType === 'percentage').length}
            </p>
            <p className="text-sm text-neutral-500">تجار بنسبة مئوية</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center text-success-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900">
              {vendors.filter((v) => v.commissionType === 'fixed').length}
            </p>
            <p className="text-sm text-neutral-500">تجار بمبلغ ثابت</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="بحث عن تاجر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pr-10"
          />
        </div>
      </div>

      {/* Commission table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-neutral-600 text-xs">
                <th className="text-right font-semibold px-5 py-3.5">التاجر</th>
                <th className="text-right font-semibold px-5 py-3.5">الحالة</th>
                <th className="text-right font-semibold px-5 py-3.5">إجمالي المبيعات</th>
                <th className="text-right font-semibold px-5 py-3.5">نوع العمولة</th>
                <th className="text-right font-semibold px-5 py-3.5">قيمة العمولة</th>
                <th className="text-right font-semibold px-5 py-3.5">مبلغ العمولة</th>
                <th className="text-right font-semibold px-5 py-3.5">الصافي للتاجر</th>
                <th className="text-center font-semibold px-5 py-3.5">تعديل</th>
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
                  <tr key={vendor.id} className="table-row-hover">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {vendor.logo}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-neutral-900 text-sm truncate">
                            {vendor.companyName}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">{vendor.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={status.class}>{status.label}</span>
                    </td>
                    <td className="px-5 py-4 font-medium text-neutral-900">
                      {formatCurrency(vendor.totalSales)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={vendor.commissionType === 'percentage' ? 'badge-primary' : 'badge-neutral'}>
                        {vendor.commissionType === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-warning-600">
                        {vendor.commissionType === 'percentage'
                          ? `${vendor.commissionValue}%`
                          : formatCurrency(vendor.commissionValue)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-warning-600">
                      {formatCurrency(commission)}
                    </td>
                    <td className="px-5 py-4 font-bold text-success-600">
                      {formatCurrency(netBalance)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => openEdit(vendor)}
                        className="btn-secondary py-1.5 px-3 text-xs"
                      >
                        <Percent size={14} />
                        تعديل
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit commission modal */}
      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title="تعديل نسبة العمولة"
      >
        {editModal && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-neutral-50">
              <p className="font-semibold text-neutral-900">{editModal.companyName}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {editModal.merchantName} · {editModal.id}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                نوع العمولة
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setForm({ ...form, type: 'percentage' })}
                  className={`p-4 rounded-xl border-2 transition-all text-right ${
                    form.type === 'percentage'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <Percent size={20} className="text-primary-600 mb-2" />
                  <p className="text-sm font-semibold text-neutral-900">نسبة مئوية</p>
                  <p className="text-xs text-neutral-500">% من إجمالي المبيعات</p>
                </button>
                <button
                  onClick={() => setForm({ ...form, type: 'fixed' })}
                  className={`p-4 rounded-xl border-2 transition-all text-right ${
                    form.type === 'fixed'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <DollarSign size={20} className="text-primary-600 mb-2" />
                  <p className="text-sm font-semibold text-neutral-900">مبلغ ثابت</p>
                  <p className="text-xs text-neutral-500">مبلغ مقطوع لكل طلب</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {form.type === 'percentage' ? 'النسبة المئوية (%)' : 'المبلغ الثابت (ريال)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="input pl-12"
                  min="0"
                  max={form.type === 'percentage' ? '100' : undefined}
                  autoFocus
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                  {form.type === 'percentage' ? '%' : 'ريال'}
                </span>
              </div>
              {form.type === 'percentage' && (
                <p className="text-xs text-neutral-400 mt-1.5">
                  القيمة المسموحة: 0% إلى 100%
                </p>
              )}
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-100">
              <p className="text-xs text-neutral-600 mb-2">معاينة التأثير:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">إجمالي المبيعات:</span>
                  <span className="font-medium text-neutral-900">{formatCurrency(editModal.totalSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">العمولة الجديدة:</span>
                  <span className="font-medium text-warning-600">
                    {formatCurrency(
                      calculateCommission(editModal.totalSales, form.type, Number(form.value) || 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-primary-100">
                  <span className="text-neutral-500">الصافي المستحق:</span>
                  <span className="font-bold text-success-600">
                    {formatCurrency(
                      editModal.totalSales -
                        calculateCommission(editModal.totalSales, form.type, Number(form.value) || 0) -
                        editModal.settledAmount
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditModal(null)} className="btn-secondary">
                إلغاء
              </button>
              <button onClick={handleSave} className="btn-primary">
                <Save size={16} />
                حفظ التغييرات
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
