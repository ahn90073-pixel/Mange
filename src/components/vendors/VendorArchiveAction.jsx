import { useState } from 'react'
import { AlertTriangle, Archive, RotateCcw } from 'lucide-react'
import Modal from '../ui/Modal'

export default function VendorArchiveAction({ vendor, updateVendorStatus, variant = 'row' }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const isArchived = vendor?.status === 'suspended'

  if (!['active', 'suspended'].includes(vendor?.status)) return null

  const ActionIcon = isArchived ? RotateCcw : Archive
  const label = isArchived ? 'إعادة تفعيل المتجر' : 'أرشفة المتجر'
  const buttonClass = variant === 'header'
    ? isArchived
      ? 'btn bg-success-500/90 text-white hover:bg-success-600'
      : 'btn bg-danger-500/90 text-white hover:bg-danger-600'
    : isArchived
      ? 'inline-flex h-9 w-9 items-center justify-center rounded-lg text-success-700 hover:bg-success-50 transition-colors'
      : 'inline-flex h-9 w-9 items-center justify-center rounded-lg text-danger-700 hover:bg-danger-50 transition-colors'

  const confirmChange = async () => {
    setSaving(true)
    try {
      const result = await updateVendorStatus(vendor.id, isArchived ? 'active' : 'suspended')
      if (result) setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass}
        title={label}
        aria-label={`${label}: ${vendor.companyName}`}
      >
        <ActionIcon size={variant === 'header' ? 16 : 17} />
        {variant === 'header' && <span>{label}</span>}
      </button>

      <Modal
        open={open}
        onClose={() => { if (!saving) setOpen(false) }}
        title={isArchived ? 'تأكيد إعادة تفعيل المتجر' : 'تأكيد أرشفة المتجر'}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isArchived ? 'bg-success-50 text-success-600' : 'bg-warning-50 text-warning-600'}`}>
            {isArchived ? <RotateCcw size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div>
            <p className="text-sm leading-6 text-neutral-700">
              {isArchived
                ? 'سيُعاد السماح للتاجر باستخدام لوحة متجره، وسيعود المتجر للظهور في الكتالوج العام بعد تحديثه. قد يحتاج التاجر إلى تسجيل الدخول مجددًا بعد انتهاء رمز الدخول الحالي لأن جلسات التجديد السابقة أُلغيت عند الأرشفة.'
                : 'سيُمنع التاجر من استخدام لوحة متجره وسيُخفى المتجر عن الجمهور. لن نحذف schema أو المنتجات أو الطلبات أو بيانات العملاء والتسويات، ويمكن إعادة تفعيل المتجر لاحقًا.'}
            </p>
            <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-sm font-semibold text-neutral-900">{vendor.companyName}</p>
              <p className="mt-1 break-all text-xs text-neutral-500">{vendor.merchantName} · {vendor.id}</p>
            </div>
            <p className="mt-3 text-xs leading-5 text-neutral-500">
              تُحدّث نسخة كتالوج Cloudflare KV دوريًا؛ قد يستغرق اختفاء المنتجات أو عودتها حتى ساعة، لكن عمليات الشراء للمتجر الموقوف تُرفض فورًا.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} disabled={saving} className="btn-secondary">
            إلغاء
          </button>
          <button
            type="button"
            onClick={confirmChange}
            disabled={saving}
            className={isArchived ? 'btn bg-success-600 text-white hover:bg-success-700 disabled:opacity-60' : 'btn-danger disabled:opacity-60'}
          >
            <ActionIcon size={16} />
            {saving ? 'جارٍ الحفظ...' : label}
          </button>
        </div>
      </Modal>
    </>
  )
}
