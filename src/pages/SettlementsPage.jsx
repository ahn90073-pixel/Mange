import { useState } from 'react'
import {
  Receipt,
  Download,
  Plus,
  Search,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  CreditCard,
} from 'lucide-react'
import { useDashboard } from '../context/DashboardContext'
import { formatCurrency, formatDate } from '../utils/format'
import { settlementStatusMap } from '../data/mockData'
import { generatePaymentVoucherPDF } from '../utils/pdfGenerator'
import Modal from '../components/ui/Modal'

export default function SettlementsPage() {
  const { settlements, vendors, createSettlement } = useDashboard()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [newModal, setNewModal] = useState(false)
  const [form, setForm] = useState({
    vendorId: '',
    amount: '',
    period: '',
    method: 'تحويل بنكي',
  })

  const filtered = settlements.filter((s) => {
    const matchesSearch =
      s.vendorName.includes(search) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.reference?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const completedSettlements = settlements.filter((s) => s.status === 'completed')
  const totalSettled = completedSettlements.reduce((sum, s) => sum + s.netAmount, 0)
  const totalCommission = completedSettlements.reduce((sum, s) => sum + s.commissionDeducted, 0)
  const pendingSettlements = settlements.filter((s) => s.status === 'pending')

  const handleDownload = (settlement) => {
    const vendor = vendors.find((v) => v.id === settlement.vendorId)
    generatePaymentVoucherPDF(settlement, vendor)
  }

  const handleCreate = () => {
    if (form.vendorId && form.amount && form.period) {
      createSettlement(form.vendorId, Number(form.amount), form.period, form.method)
      setNewModal(false)
      setForm({ vendorId: '', amount: '', period: '', method: 'تحويل بنكي' })
    }
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center text-success-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900">{formatCurrency(totalSettled)}</p>
            <p className="text-sm text-neutral-500">إجمالي المبالغ المصروفة</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center text-warning-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900">{formatCurrency(totalCommission)}</p>
            <p className="text-sm text-neutral-500">إجمالي العمولات المقتطعة</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900">{pendingSettlements.length}</p>
            <p className="text-sm text-neutral-500">سندات قيد المعالجة</p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="بحث برقم السند، التاجر، أو المرجع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pr-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="all">جميع الحالات</option>
          <option value="completed">مكتمل</option>
          <option value="pending">قيد المعالجة</option>
        </select>
        <button onClick={() => setNewModal(true)} className="btn-primary">
          <Plus size={18} />
          إنشاء سند سداد جديد
        </button>
      </div>

      {/* Settlements table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-neutral-600 text-xs">
                <th className="text-right font-semibold px-5 py-3.5">رقم السند</th>
                <th className="text-right font-semibold px-5 py-3.5">التاجر</th>
                <th className="text-right font-semibold px-5 py-3.5">التاريخ</th>
                <th className="text-right font-semibold px-5 py-3.5">الفترة</th>
                <th className="text-right font-semibold px-5 py-3.5">المبلغ الإجمالي</th>
                <th className="text-right font-semibold px-5 py-3.5">العمولة</th>
                <th className="text-right font-semibold px-5 py-3.5">الصافي المدفوع</th>
                <th className="text-right font-semibold px-5 py-3.5">طريقة الدفع</th>
                <th className="text-right font-semibold px-5 py-3.5">الحالة</th>
                <th className="text-center font-semibold px-5 py-3.5">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((s) => {
                const status = settlementStatusMap[s.status]
                return (
                  <tr key={s.id} className="table-row-hover">
                    <td className="px-5 py-4">
                      <p className="font-medium text-neutral-800">{s.id}</p>
                      <p className="text-xs text-neutral-400">{s.reference || '—'}</p>
                    </td>
                    <td className="px-5 py-4 text-neutral-700">{s.vendorName}</td>
                    <td className="px-5 py-4 text-neutral-600">{formatDate(s.date)}</td>
                    <td className="px-5 py-4 text-neutral-600">{s.period}</td>
                    <td className="px-5 py-4 font-medium text-neutral-900">
                      {formatCurrency(s.amount)}
                    </td>
                    <td className="px-5 py-4 text-warning-600">
                      {formatCurrency(s.commissionDeducted)}
                    </td>
                    <td className="px-5 py-4 font-bold text-success-600">
                      {formatCurrency(s.netAmount)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="badge-neutral">{s.method}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={status.class}>{status.label}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleDownload(s)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                        title="تحميل سند السداد PDF"
                      >
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <Receipt size={48} className="mb-3" />
            <p className="text-sm">لا توجد سندات مطابقة</p>
          </div>
        )}
      </div>

      {/* Create settlement modal */}
      <Modal
        open={newModal}
        onClose={() => setNewModal(false)}
        title="إنشاء سند سداد جديد"
        maxWidth="max-w-xl"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              التاجر
            </label>
            <select
              value={form.vendorId}
              onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
              className="input"
            >
              <option value="">اختر التاجر...</option>
              {vendors
                .filter((v) => v.status === 'active')
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.companyName} — {v.id}
                  </option>
                ))}
            </select>
          </div>

          {form.vendorId && (
            <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-100">
              {(() => {
                const v = vendors.find((v) => v.id === form.vendorId)
                if (!v) return null
                const commission =
                  v.commissionType === 'percentage'
                    ? Math.round((Number(form.amount || 0) * v.commissionValue) / 100)
                    : v.commissionValue
                const net = Number(form.amount || 0) - commission
                return (
                  <div className="space-y-1.5 text-sm">
                    <p className="text-xs text-neutral-600 mb-2">معاينة الحساب:</p>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">إجمالي المبيعات:</span>
                      <span className="font-medium text-neutral-900">{formatCurrency(v.totalSales)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">المبلغ المسدد سابقاً:</span>
                      <span className="font-medium text-neutral-700">{formatCurrency(v.settledAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-primary-100">
                      <span className="text-neutral-500">الصافي المستحق:</span>
                      <span className="font-bold text-success-600">
                        {formatCurrency(v.totalSales - (v.commissionType === 'percentage' ? Math.round((v.totalSales * v.commissionValue) / 100) : v.commissionValue) - v.settledAmount)}
                      </span>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                المبلغ الإجمالي (ريال)
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="input"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                الفترة المالية
              </label>
              <input
                type="text"
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="input"
                placeholder="مثال: أكتوبر 2026"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              طريقة الدفع
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['تحويل بنكي', 'شيك', 'إيداع نقدي'].map((method) => (
                <button
                  key={method}
                  onClick={() => setForm({ ...form, method })}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.method === method
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  <CreditCard size={16} className="mx-auto mb-1" />
                  {method}
                </button>
              ))}
            </div>
          </div>

          {form.amount && form.vendorId && (
            <div className="p-4 rounded-xl bg-neutral-50">
              <p className="text-xs text-neutral-600 mb-2">تفاصيل السند:</p>
              {(() => {
                const v = vendors.find((v) => v.id === form.vendorId)
                if (!v) return null
                const commission =
                  v.commissionType === 'percentage'
                    ? Math.round((Number(form.amount) * v.commissionValue) / 100)
                    : v.commissionValue
                const net = Number(form.amount) - commission
                return (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">المبلغ الإجمالي:</span>
                      <span className="font-medium">{formatCurrency(Number(form.amount))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">
                        العمولة المقتطعة ({v.commissionType === 'percentage' ? v.commissionValue + '%' : 'ثابت'}):
                      </span>
                      <span className="font-medium text-warning-600">- {formatCurrency(commission)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-neutral-200">
                      <span className="text-neutral-500">الصافي المدفوع:</span>
                      <span className="font-bold text-success-600">{formatCurrency(net)}</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button onClick={() => setNewModal(false)} className="btn-secondary">
              إلغاء
            </button>
            <button
              onClick={handleCreate}
              disabled={!form.vendorId || !form.amount || !form.period}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={16} />
              إنشاء السند
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
