import { useCallback, useEffect, useState } from 'react'
import { Copy, LoaderCircle, RefreshCw, Search, ShoppingBag, Truck, X } from 'lucide-react'
import { adminApi } from '../api/client'
import { orderStatusMap } from '../data/mockData'
import { useDashboard } from '../context/DashboardContext'
import { formatCurrency, formatDate } from '../utils/format'

const statusOptions = [
  ['pending', 'بانتظار التأكيد'],
  ['confirmed', 'مؤكد'],
  ['processing', 'قيد التنفيذ'],
  ['shipped', 'تم الشحن'],
  ['delivered', 'تم التوصيل'],
  ['cancelled', 'ملغي'],
  ['returned', 'مرتجع'],
  ['refunded', 'مسترد'],
]
const statusTransitions = {
  pending: ['pending', 'confirmed', 'processing', 'cancelled'],
  confirmed: ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
  processing: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
  shipped: ['shipped', 'delivered', 'returned'],
  delivered: ['delivered', 'returned', 'refunded'],
  cancelled: ['cancelled'],
  returned: ['returned', 'refunded'],
  refunded: ['refunded'],
}

function Field({ label, children }) {
  return <label className="block space-y-1.5"><span className="text-xs font-semibold text-neutral-600">{label}</span>{children}</label>
}

function OrderDetails({ order, onClose, onUpdated }) {
  const { showToast } = useDashboard()
  const [status, setStatus] = useState(order.status)
  const [carrier, setCarrier] = useState(order.shipment.carrier)
  const [trackingNumber, setTrackingNumber] = useState(order.shipment.trackingNumber)
  const [shipmentStatus, setShipmentStatus] = useState(order.shipment.status || 'pending')
  const [shippingFee, setShippingFee] = useState(String(order.totals.shipping || 0))
  const [saving, setSaving] = useState(false)

  const changeOrderStatus = (nextStatus) => {
    setStatus(nextStatus)
    if (nextStatus === 'shipped') setShipmentStatus('in_transit')
    if (nextStatus === 'delivered') setShipmentStatus('delivered')
    if (nextStatus === 'returned') setShipmentStatus('returned')
  }

  useEffect(() => {
    setStatus(order.status)
    setCarrier(order.shipment.carrier)
    setTrackingNumber(order.shipment.trackingNumber)
    setShipmentStatus(order.shipment.status || 'pending')
    setShippingFee(String(order.totals.shipping || 0))
  }, [order])

  const save = async () => {
    setSaving(true)
    try {
      const updated = await adminApi.updateOrder(order.vendorId, order.orderId, {
        status,
        carrier,
        trackingNumber,
        shipmentStatus,
        shippingFee: Number(shippingFee),
      })
      showToast('success', 'تم حفظ حالة الطلب وبيانات الشحن.')
      onUpdated(updated)
    } catch (error) {
      showToast('error', error.message || 'تعذر تحديث الطلب.')
    } finally {
      setSaving(false)
    }
  }

  const copyMerchantSummary = async () => {
    const address = order.address
    const text = [
      `طلب جديد ${order.id}`,
      `التاجر: ${order.vendor.name}`,
      `العميل: ${order.customer.name}`,
      `هاتف العميل: ${order.customer.phone}`,
      `البريد: ${order.customer.email || 'غير متوفر'}`,
      `العنوان: ${[address.governorate, address.city, address.district, address.street, address.building, address.apartment].filter(Boolean).join('، ')}`,
      'المنتجات:',
      ...order.items.map((item) => `- ${item.name} × ${item.quantity} — ${formatCurrency(item.totalPrice, order.totals.currency)}`),
      `الإجمالي: ${formatCurrency(order.totals.grandTotal, order.totals.currency)}`,
      `الدفع: ${order.paymentMethod === 'cash_on_delivery' ? 'الدفع عند الاستلام' : order.paymentMethod}`,
      `ملاحظات العميل: ${order.customerNote || 'لا توجد'}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      showToast('success', 'نُسخت تفاصيل الطلب؛ أرسلها للتاجر من قناة التواصل المناسبة.')
    } catch {
      showToast('error', 'تعذر النسخ تلقائيًا من هذا الجهاز.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/55 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="order-detail-title" dir="rtl">
      <section className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-semibold text-primary-600">تفاصيل طلب من المتجر</p>
            <h2 id="order-detail-title" className="mt-1 text-lg font-bold text-neutral-900">{order.id}</h2>
            <p className="mt-1 text-sm text-neutral-500">{order.vendor.name} · {formatDate(order.date)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100" aria-label="إغلاق"><X size={20} /></button>
        </header>

        <div className="overflow-y-auto p-5 sm:p-7">
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            هذه لوحة عامة بلا تسجيل دخول؛ بيانات العملاء والطلبات مرئية لكل من يصل إليها. توجيه الطلب للتاجر يتم يدويًا بعد نسخ الملخص.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="card p-4">
              <h3 className="mb-3 font-bold text-neutral-900">العميل والتوصيل</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-neutral-500">الاسم</dt><dd className="text-left font-semibold text-neutral-800">{order.customer.name}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-neutral-500">الهاتف</dt><dd dir="ltr" className="text-left font-semibold text-neutral-800">{order.customer.phone || '—'}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-neutral-500">البريد</dt><dd className="break-all text-left text-neutral-800">{order.customer.email || '—'}</dd></div>
                <div className="border-t border-neutral-100 pt-2 text-neutral-700">{[order.address.country, order.address.governorate, order.address.city, order.address.district, order.address.street, order.address.building, order.address.apartment, order.address.postalCode].filter(Boolean).join('، ') || 'لا يوجد عنوان محفوظ'}</div>
                {order.address.notes && <p className="text-xs text-neutral-500">ملاحظة العنوان: {order.address.notes}</p>}
              </dl>
            </section>
            <section className="card p-4">
              <h3 className="mb-3 font-bold text-neutral-900">التاجر المستهدف</h3>
              <p className="font-semibold text-neutral-800">{order.vendor.name}</p>
              <p className="mt-1 text-sm text-neutral-600">{order.vendor.merchantName || '—'}</p>
              <p className="mt-2 text-sm text-neutral-600">الهاتف: <bdi dir="ltr">{order.vendor.phone || 'غير مسجل'}</bdi></p>
              <p className="mt-1 break-all text-sm text-neutral-600">البريد: {order.vendor.email || 'غير مسجل'}</p>
              <button type="button" onClick={copyMerchantSummary} className="btn-secondary mt-4 w-full"><Copy size={16} />نسخ تفاصيل الطلب لإرسالها للتاجر</button>
            </section>
          </div>

          <section className="card mt-5 overflow-hidden">
            <div className="border-b border-neutral-100 px-4 py-3"><h3 className="font-bold text-neutral-900">عناصر الطلب</h3></div>
            <div className="divide-y divide-neutral-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0"><p className="truncate font-semibold text-neutral-800">{item.name}</p><p className="mt-1 text-xs text-neutral-500">{item.sku ? `SKU: ${item.sku} · ` : ''}{item.quantity} قطعة × {formatCurrency(item.unitPrice, order.totals.currency)}</p></div>
                  <p className="shrink-0 font-bold text-neutral-900">{formatCurrency(item.totalPrice, order.totals.currency)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-neutral-100 bg-neutral-50 px-4 py-3 text-sm">
              <p className="flex justify-between"><span>قيمة المنتجات</span><span>{formatCurrency(order.totals.subtotal, order.totals.currency)}</span></p>
              <p className="flex justify-between"><span>الشحن</span><span>{formatCurrency(order.totals.shipping, order.totals.currency)}</span></p>
              <p className="flex justify-between pt-1 font-bold text-neutral-900"><span>الإجمالي</span><span>{formatCurrency(order.totals.grandTotal, order.totals.currency)}</span></p>
              <p className="pt-1 text-xs text-neutral-500">طريقة الدفع: {order.paymentMethod === 'cash_on_delivery' ? 'الدفع عند الاستلام' : order.paymentMethod} · حالة الدفع: {order.paymentStatus}</p>
              {order.customerNote && <p className="pt-1 text-xs text-neutral-600">ملاحظات العميل: {order.customerNote}</p>}
            </div>
          </section>

          <section className="card mt-5 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2"><Truck size={18} className="text-primary-600" /><h3 className="font-bold text-neutral-900">توجيه الطلب وتسجيل الشحن</h3></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="حالة الطلب"><select className="input" value={status} onChange={(event) => changeOrderStatus(event.target.value)}>{statusOptions.filter(([value]) => (statusTransitions[order.status] || [order.status]).includes(value)).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="شركة الشحن"><input className="input" value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder="تُسجل يدويًا" maxLength={120} /></Field>
              <Field label="رقم التتبع"><input className="input" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="إن توفر" maxLength={160} /></Field>
              <Field label="حالة الشحنة"><select className="input" value={shipmentStatus} onChange={(event) => setShipmentStatus(event.target.value)}>{[['pending','بانتظار التجهيز'],['label_created','تم إنشاء بوليصة'],['picked_up','استلمتها شركة الشحن'],['in_transit','في الطريق'],['delivered','تم التسليم'],['failed','تعذر التسليم'],['returned','مرتجع']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label={`رسوم الشحن (${order.totals.currency})`}><input className="input" type="number" min="0" step="0.01" value={shippingFee} onChange={(event) => setShippingFee(event.target.value)} /></Field>
            </div>
            <p className="mt-3 text-xs leading-5 text-neutral-500">لا يوجد اتصال آلي بشركة شحن في الوقت الحالي؛ تُدخل بياناتها ورقم التتبع بعد التواصل معها خارج النظام.</p>
            <button type="button" onClick={save} disabled={saving} className="btn-primary mt-4 w-full sm:w-auto disabled:cursor-wait disabled:opacity-60">{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Truck size={16} />}{saving ? 'جارٍ الحفظ...' : 'حفظ التوجيه والتحديث'}</button>
          </section>
        </div>
      </section>
    </div>
  )
}

export default function OrdersPage() {
  const { showToast, refresh } = useDashboard()
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminApi.orders(page, 50, status, query.trim())
      setOrders(result?.items || [])
      setPagination(result?.pagination || null)
    } catch (error) {
      showToast('error', error.message || 'تعذر تحميل الطلبات.')
    } finally {
      setLoading(false)
    }
  }, [page, query, showToast, status])

  useEffect(() => { void loadOrders() }, [loadOrders])

  const openOrder = async (row) => {
    setDetailLoading(true)
    try {
      const detail = await adminApi.order(row.vendorId, row.orderId)
      setSelected(detail)
    } catch (error) {
      showToast('error', error.message || 'تعذر تحميل تفاصيل الطلب.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleUpdated = async (updated) => {
    setSelected(updated)
    await loadOrders()
    await refresh()
  }

  return (
    <div dir="rtl" className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <strong>تنبيه الخصوصية:</strong> لوحة الإدارة وواجهتها عامة بلا تسجيل دخول، ولذلك يمكن لأي زائر الوصول إلى الطلبات وبيانات العملاء. الطلبات الجديدة تُنشأ «بانتظار التأكيد»، وتُخصم كمياتها من مخزون التاجر عند تأكيد checkout.
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-bold text-neutral-900">طلبات المتجر</h2><p className="mt-1 text-sm text-neutral-500">افتح أي طلب لمراجعة تفاصيل العميل والتاجر وتسجيل شركة الشحن.</p></div>
        <button type="button" onClick={loadOrders} className="btn-secondary" disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />تحديث القائمة</button>
      </div>

      <div className="card flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1"><Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input className="input pr-10" value={query} onChange={(event) => { setPage(1); setQuery(event.target.value) }} placeholder="ابحث برقم الطلب أو اسم العميل أو التاجر" /></div>
        <select className="input sm:max-w-56" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value) }}><option value="all">جميع الحالات</option>{statusOptions.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
      </div>

      <section className="card overflow-hidden">
        {loading ? <div className="flex items-center justify-center gap-3 p-12 text-sm text-neutral-500"><LoaderCircle size={18} className="animate-spin text-primary-600" />جارٍ تحميل الطلبات...</div> : orders.length === 0 ? <div className="p-12 text-center"><ShoppingBag size={34} className="mx-auto text-neutral-300" /><p className="mt-3 font-semibold text-neutral-700">لا توجد طلبات مطابقة</p><p className="mt-1 text-sm text-neutral-500">ستظهر طلبات المتجر الجديدة هنا بعد إتمام الشراء.</p></div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-right">
            <thead className="bg-neutral-50 text-xs text-neutral-500"><tr><th className="px-4 py-3 font-semibold">رقم الطلب</th><th className="px-4 py-3 font-semibold">العميل</th><th className="px-4 py-3 font-semibold">التاجر</th><th className="px-4 py-3 font-semibold">الحالة</th><th className="px-4 py-3 font-semibold">الإجمالي</th><th className="px-4 py-3 font-semibold">التاريخ</th><th className="px-4 py-3 font-semibold">التفاصيل</th></tr></thead>
            <tbody className="divide-y divide-neutral-100">{orders.map((order) => {
              const orderStatus = orderStatusMap[order.status] || { label: order.status || '—', class: 'badge-neutral' }
              return <tr key={`${order.vendorId}-${order.orderId}`} className="table-row-hover">
                <td className="px-4 py-3 font-semibold text-neutral-800">{order.id}</td><td className="px-4 py-3 text-sm text-neutral-700">{order.customer || '—'}</td><td className="px-4 py-3 text-sm text-neutral-700">{order.vendorName || '—'}</td><td className="px-4 py-3"><span className={orderStatus.class}>{orderStatus.label}</span></td><td className="px-4 py-3 text-sm font-bold text-neutral-800">{formatCurrency(order.amount, order.currency)}</td><td className="px-4 py-3 text-xs text-neutral-500">{formatDate(order.date)}</td><td className="px-4 py-3"><button type="button" onClick={() => openOrder(order)} className="btn-ghost px-3 py-2 text-xs">{detailLoading ? 'تحميل...' : 'فتح الطلب'}</button></td>
              </tr>
            })}</tbody>
          </table></div>
        )}
        {pagination?.total !== undefined && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3 text-xs text-neutral-500"><span>إجمالي الطلبات المطابقة: {pagination.total}</span>{pagination.totalPages > 1 && <div className="flex items-center gap-2"><button type="button" className="btn-secondary px-3 py-2 text-xs" disabled={loading || page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>السابق</button><span>صفحة {pagination.page} من {pagination.totalPages}</span><button type="button" className="btn-secondary px-3 py-2 text-xs" disabled={loading || page >= pagination.totalPages} onClick={() => setPage((value) => Math.min(pagination.totalPages, value + 1))}>التالي</button></div>}</div>}
      </section>

      {selected && <OrderDetails order={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />}
      {detailLoading && <div className="fixed bottom-5 left-5 z-40 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg"><LoaderCircle size={15} className="ml-2 inline animate-spin" />جارٍ فتح تفاصيل الطلب</div>}
    </div>
  )
}
