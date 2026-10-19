import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  Edit3,
  Image as ImageIcon,
  LoaderCircle,
  Megaphone,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react'
import Modal from '../components/ui/Modal'
import { adminApi } from '../api/client'
import { useDashboard } from '../context/DashboardContext'

const themes = [
  { value: 'blue', label: 'أزرق', card: 'from-blue-600 to-blue-800', badge: 'bg-blue-50 text-blue-700 border-blue-100' },
  { value: 'orange', label: 'برتقالي', card: 'from-orange-500 to-orange-700', badge: 'bg-orange-50 text-orange-700 border-orange-100' },
  { value: 'slate', label: 'رمادي داكن', card: 'from-slate-600 to-slate-800', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'violet', label: 'بنفسجي', card: 'from-violet-600 to-violet-800', badge: 'bg-violet-50 text-violet-700 border-violet-100' },
]

const emptyPromotion = {
  title: '',
  subtitle: '',
  description: '',
  ctaLabel: '',
  targetUrl: '',
  mediaUrl: '',
  mediaKey: '',
  mediaType: '',
  theme: 'blue',
  isActive: true,
  sortOrder: 0,
  startsAt: '',
  endsAt: '',
}

const MAX_MEDIA_SIZE = 30 * 1024 * 1024
const MEDIA_ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/webm'
const ACCEPTED_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function themeMeta(value) {
  return themes.find((theme) => theme.value === value) || themes[0]
}

function dateInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function apiDateValue(value) {
  return value ? new Date(value).toISOString() : null
}

function isVideoMedia(mediaType, mediaUrl = '') {
  const normalizedType = String(mediaType || '')
  return normalizedType === 'video' || normalizedType.startsWith('video/') || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(mediaUrl)
}

function isCloudinaryPublicId(value) {
  return UUID_PATTERN.test(String(value || ''))
}

function mediaSource(promotion) {
  return promotion.mediaUrl || promotion.mediaKey || ''
}

function MediaPreview({ promotion, className = '' }) {
  const source = mediaSource(promotion)
  if (!source) {
    return <div className={`flex h-full min-h-32 items-center justify-center bg-gradient-to-br ${themeMeta(promotion.theme).card} text-white ${className}`}><Megaphone size={34} strokeWidth={1.5} /></div>
  }
  if (isVideoMedia(promotion.mediaType, source)) {
    return <video className={`h-full w-full object-cover ${className}`} src={source} muted controls preload="metadata" />
  }
  return <img className={`h-full w-full object-cover ${className}`} src={source} alt={promotion.title || 'وسائط البنر'} />
}

function PromotionForm({ promotion, editing, mediaFile, existingMedia, onChange, onMediaChange, onSubmit, onCancel, saving }) {
  const mediaPreviewUrl = useMemo(() => (mediaFile ? URL.createObjectURL(mediaFile) : ''), [mediaFile])
  useEffect(() => () => {
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl)
  }, [mediaPreviewUrl])
  const previewPromotion = mediaFile
    ? { ...promotion, mediaUrl: mediaPreviewUrl, mediaKey: '', mediaType: mediaFile.type }
    : { ...promotion, ...existingMedia }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2"><span className="text-sm font-semibold text-neutral-700">العنوان</span><input className="input" required maxLength={160} value={promotion.title} onChange={(event) => onChange('title', event.target.value)} placeholder="مثال: عروض الصيف وصلت" /></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold text-neutral-700">العنوان الفرعي</span><input className="input" maxLength={220} value={promotion.subtitle} onChange={(event) => onChange('subtitle', event.target.value)} placeholder="رسالة قصيرة للواجهة" /></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold text-neutral-700">نص الزر</span><input className="input" maxLength={80} value={promotion.ctaLabel} onChange={(event) => onChange('ctaLabel', event.target.value)} placeholder="تسوّق الآن" /></label>
        <label className="space-y-1.5 md:col-span-2"><span className="text-sm font-semibold text-neutral-700">الوصف</span><textarea className="input min-h-24 resize-y" maxLength={500} value={promotion.description} onChange={(event) => onChange('description', event.target.value)} placeholder="اكتب وصفًا مختصرًا للعرض أو الحملة." /></label>
        <label className="space-y-1.5 md:col-span-2"><span className="text-sm font-semibold text-neutral-700">رابط الزر <span className="font-normal text-neutral-400">(اختياري)</span></span><input className="input" type="text" dir="ltr" maxLength={1000} value={promotion.targetUrl} onChange={(event) => onChange('targetUrl', event.target.value)} placeholder="/products أو https://example.com/offer" /></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold text-neutral-700">لون البنر</span><select className="input" value={promotion.theme} onChange={(event) => onChange('theme', event.target.value)}>{themes.map((theme) => <option key={theme.value} value={theme.value}>{theme.label}</option>)}</select></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold text-neutral-700">الترتيب</span><input className="input" type="number" min="0" max="9999" value={promotion.sortOrder} onChange={(event) => onChange('sortOrder', event.target.value)} /></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold text-neutral-700">تاريخ البداية <span className="font-normal text-neutral-400">(اختياري)</span></span><input className="input" type="datetime-local" value={promotion.startsAt} onChange={(event) => onChange('startsAt', event.target.value)} /></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold text-neutral-700">تاريخ النهاية <span className="font-normal text-neutral-400">(اختياري)</span></span><input className="input" type="datetime-local" value={promotion.endsAt} onChange={(event) => onChange('endsAt', event.target.value)} /></label>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-neutral-800">صورة أو فيديو البنر</p><p className="mt-1 text-xs text-neutral-500">يمكنك رفع صورة أو فيديو، وسيبقى الملف الحالي محفوظًا عند التعديل دون رفع ملف جديد.</p></div><Upload size={19} className="text-primary-600" /></div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white px-4 py-5 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/30"><input className="sr-only" type="file" accept={MEDIA_ACCEPT} onChange={onMediaChange} /><Upload size={22} className="mb-2 text-primary-600" /><span className="text-sm font-semibold text-neutral-700">اختر صورة أو فيديو</span><span className="mt-1 text-xs text-neutral-500">{mediaFile ? mediaFile.name : existingMedia.mediaUrl ? 'الملف الحالي محفوظ' : 'لم يتم اختيار ملف'}</span><span className="mt-1 text-[11px] text-neutral-400">JPEG أو PNG أو WEBP أو MP4 أو WEBM — حتى 30MB</span></label>
          <div className="h-28 overflow-hidden rounded-xl border border-neutral-200 bg-white"><MediaPreview promotion={previewPromotion} className="min-h-28" /></div>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3"><input className="h-4 w-4 accent-primary-600" type="checkbox" checked={Boolean(promotion.isActive)} onChange={(event) => onChange('isActive', event.target.checked)} /><span><span className="block text-sm font-semibold text-neutral-800">تفعيل البنر</span><span className="text-xs text-neutral-500">سيظهر البنر للعملاء عندما يكون نشطًا وضمن فترة العرض.</span></span></label>

      <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-100 pt-4"><button type="button" onClick={onCancel} className="btn-secondary" disabled={saving}><X size={16} />إلغاء</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? <LoaderCircle size={16} className="animate-spin" /> : editing ? <Check size={16} /> : <Plus size={16} />}{saving ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إنشاء البنر'}</button></div>
    </form>
  )
}

export default function PromotionsPage() {
  const { showToast } = useDashboard()
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [warningMessage, setWarningMessage] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(emptyPromotion)
  const [existingMedia, setExistingMedia] = useState({ mediaUrl: '', mediaKey: '', mediaType: '' })
  const [mediaFile, setMediaFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')

  const loadPromotions = useCallback(async () => {
    const cached = await adminApi.cache.promotions()
    if (cached !== undefined) {
      setPromotions(Array.isArray(cached?.items) ? cached.items : [])
      setLoading(false)
    } else {
      setLoading(true)
    }
    setErrorMessage('')
    try {
      const result = await adminApi.promotions()
      setPromotions(Array.isArray(result?.items) ? result.items : [])
    } catch (error) {
      if (cached === undefined) setErrorMessage(error.message || 'تعذر تحميل البنرات.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadPromotions() }, [loadPromotions])

  const sortedPromotions = useMemo(() => [...promotions].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)), [promotions])

  const openCreate = () => {
    setEditingId('')
    setForm(emptyPromotion)
    setExistingMedia({ mediaUrl: '', mediaKey: '', mediaType: '' })
    setMediaFile(null)
    setSuccessMessage('')
    setWarningMessage('')
    setEditorOpen(true)
  }

  const openEdit = (promotion) => {
    setEditingId(promotion.id)
    setForm({ ...emptyPromotion, ...promotion, sortOrder: Number(promotion.sortOrder || 0), startsAt: dateInputValue(promotion.startsAt), endsAt: dateInputValue(promotion.endsAt) })
    setExistingMedia({ mediaUrl: promotion.mediaUrl || '', mediaKey: promotion.mediaKey || '', mediaType: promotion.mediaType || '' })
    setMediaFile(null)
    setSuccessMessage('')
    setWarningMessage('')
    setEditorOpen(true)
  }

  const closeEditor = () => {
    if (saving) return
    setEditorOpen(false)
    setMediaFile(null)
  }

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const handleMediaChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!ACCEPTED_MEDIA_TYPES.has(file.type)) {
      showToast('error', 'اختر JPEG أو PNG أو WEBP أو MP4 أو WEBM فقط.')
      event.target.value = ''
      return
    }
    if (file.size > MAX_MEDIA_SIZE) {
      showToast('error', 'حجم الملف يتجاوز الحد المسموح وهو 30MB.')
      event.target.value = ''
      return
    }
    setMediaFile(file)
    event.target.value = ''
  }

  const submit = async (event) => {
    event.preventDefault()
    if (form.endsAt && form.startsAt && new Date(form.endsAt) < new Date(form.startsAt)) {
      showToast('error', 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية.')
      return
    }
    setSaving(true)
    setSuccessMessage('')
    setWarningMessage('')
    try {
      const oldMedia = { ...existingMedia }
      const uploadedMedia = mediaFile ? await adminApi.uploadPromotionMedia(mediaFile) : null
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        ctaLabel: form.ctaLabel.trim(),
        targetUrl: form.targetUrl.trim(),
        mediaUrl: uploadedMedia?.mediaUrl || oldMedia.mediaUrl || form.mediaUrl || '',
        mediaKey: uploadedMedia?.mediaKey || oldMedia.mediaKey || form.mediaKey || '',
        mediaType: uploadedMedia?.mediaType || oldMedia.mediaType || form.mediaType || '',
        theme: form.theme,
        isActive: Boolean(form.isActive),
        sortOrder: Number(form.sortOrder || 0),
        startsAt: apiDateValue(form.startsAt),
        endsAt: apiDateValue(form.endsAt),
      }
      if (editingId) await adminApi.updatePromotion(editingId, payload)
      else await adminApi.createPromotion(payload)

      let cleanupWarning = ''
      if (editingId && mediaFile && isCloudinaryPublicId(oldMedia.mediaKey)) {
        try {
          await adminApi.deletePromotionMedia(oldMedia.mediaKey, oldMedia.mediaType)
        } catch {
          cleanupWarning = 'تم حفظ التعديلات، لكن تعذر حذف الوسيط القديم من Cloudinary.'
        }
      }
      const message = editingId ? 'تم حفظ تعديلات البنر بنجاح.' : 'تم إنشاء البنر بنجاح.'
      setSuccessMessage(message)
      showToast('success', message)
      if (cleanupWarning) {
        setWarningMessage(cleanupWarning)
        showToast('warning', cleanupWarning)
      }
      setEditorOpen(false)
      setMediaFile(null)
      await loadPromotions()
    } catch (error) {
      showToast('error', error.message || 'تعذر حفظ البنر.')
    } finally {
      setSaving(false)
    }
  }

  const removePromotion = async (promotion) => {
    if (!window.confirm(`هل تريد حذف البنر «${promotion.title || 'بدون عنوان'}»؟`)) return
    setDeletingId(promotion.id)
    setWarningMessage('')
    try {
      await adminApi.deletePromotion(promotion.id)
      const message = 'تم حذف البنر بنجاح.'
      setSuccessMessage(message)
      showToast('success', message)
      setPromotions((current) => current.filter((item) => item.id !== promotion.id))
      if (isCloudinaryPublicId(promotion.mediaKey)) {
        try {
          await adminApi.deletePromotionMedia(promotion.mediaKey, promotion.mediaType)
        } catch {
          const cleanupWarning = 'تم حذف البنر، لكن تعذر حذف الوسيط القديم من Cloudinary.'
          setWarningMessage(cleanupWarning)
          showToast('warning', cleanupWarning)
        }
      }
    } catch (error) {
      showToast('error', error.message || 'تعذر حذف البنر.')
    } finally {
      setDeletingId('')
    }
  }

  return (
      <div dir="rtl" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold text-neutral-900">إدارة البنرات الترويجية</h2><p className="mt-1 text-sm text-neutral-500">أنشئ العروض والحملات التي تظهر في واجهة المنصة ورتّبها بسهولة.</p></div><div className="flex gap-2"><button type="button" onClick={() => void loadPromotions()} className="btn-secondary" disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />تحديث</button><button type="button" onClick={openCreate} className="btn-primary"><Plus size={17} />بنر جديد</button></div></div>
      {successMessage && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><Check size={17} />{successMessage}</div>}
      {warningMessage && <div role="alert" className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"><span>{warningMessage}</span></div>}
      {errorMessage && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{errorMessage}</span><button type="button" onClick={() => void loadPromotions()} className="font-semibold underline">إعادة المحاولة</button></div>}

      {loading ? <div className="card flex items-center justify-center gap-3 py-16 text-sm text-neutral-500"><LoaderCircle size={22} className="animate-spin text-primary-600" />جارٍ تحميل البنرات...</div> : sortedPromotions.length === 0 ? <section className="card flex flex-col items-center justify-center px-6 py-16 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600"><Megaphone size={27} /></div><h3 className="font-bold text-neutral-900">لا توجد بنرات حتى الآن</h3><p className="mt-2 max-w-md text-sm text-neutral-500">أنشئ أول بنر ترويجي لإبرازه في واجهة المنصة.</p><button type="button" onClick={openCreate} className="btn-primary mt-5"><Plus size={16} />إنشاء أول بنر</button></section> : <section className="grid gap-5 xl:grid-cols-2">{sortedPromotions.map((promotion) => { const theme = themeMeta(promotion.theme); const video = isVideoMedia(promotion.mediaType, mediaSource(promotion)); return <article key={promotion.id} className="card overflow-hidden"><div className="relative h-44 bg-neutral-100"><MediaPreview promotion={promotion} className="min-h-44" /><div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/45 to-transparent p-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${promotion.isActive ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-neutral-200 bg-white/90 text-neutral-600'}`}>{promotion.isActive ? 'نشط' : 'متوقف'}</span><span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-neutral-700">ترتيب {promotion.sortOrder ?? 0}</span></div></div><div className="space-y-4 p-5"><div><div className="flex items-start justify-between gap-3"><h3 className="line-clamp-2 font-bold text-neutral-900">{promotion.title || 'بدون عنوان'}</h3><span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${theme.badge}`}>{theme.label}</span></div>{promotion.subtitle && <p className="mt-1 text-sm font-medium text-neutral-600">{promotion.subtitle}</p>}{promotion.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">{promotion.description}</p>}</div><div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500"><span className="inline-flex items-center gap-1 rounded-lg bg-neutral-50 px-2.5 py-1.5">{video ? <Video size={14} /> : <ImageIcon size={14} />}{video ? 'فيديو' : mediaSource(promotion) ? 'صورة' : 'بدون وسائط'}</span>{promotion.startsAt && <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-50 px-2.5 py-1.5"><CalendarDays size={14} />من {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'short' }).format(new Date(promotion.startsAt))}</span>}{promotion.endsAt && <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-50 px-2.5 py-1.5"><CalendarDays size={14} />إلى {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'short' }).format(new Date(promotion.endsAt))}</span>}</div><div className="flex flex-wrap justify-end gap-2 border-t border-neutral-100 pt-4"><button type="button" onClick={() => openEdit(promotion)} className="btn-secondary"><Edit3 size={15} />تعديل</button><button type="button" onClick={() => void removePromotion(promotion)} disabled={deletingId === promotion.id} className="btn-secondary text-rose-700 hover:bg-rose-50">{deletingId === promotion.id ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}حذف</button></div></div></article> })}</section>}

      <Modal open={editorOpen} onClose={closeEditor} title={editingId ? 'تعديل البنر الترويجي' : 'إنشاء بنر ترويجي جديد'} maxWidth="max-w-3xl"><PromotionForm promotion={form} editing={Boolean(editingId)} mediaFile={mediaFile} existingMedia={existingMedia} onChange={updateField} onMediaChange={handleMediaChange} onSubmit={submit} onCancel={closeEditor} saving={saving} /></Modal>
    </div>
  )
}
