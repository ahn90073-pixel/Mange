import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

const OTA_RELEASE_API =
  'https://api.github.com/repos/ahn90073-pixel/Mange/releases/tags/ota-latest'
const OTA_ASSET_NAME = 'dist.zip'
const SUCCESSFUL_CHECK_KEY = 'mange.android-ota.last-success'
const LAST_ATTEMPT_KEY = 'mange.android-ota.last-attempt'
const CHECK_INTERVAL_MS = 60 * 60 * 1000
const RETRY_INTERVAL_MS = 2 * 60 * 1000

let checkInFlight

function getStoredTime(key) {
  try {
    return Number(window.localStorage.getItem(key)) || 0
  } catch {
    return 0
  }
}

function setStoredTime(key, value) {
  try {
    window.localStorage.setItem(key, String(value))
  } catch {
    // OTA remains best-effort if storage is unavailable.
  }
}

function diagnostic(status, message, details = '') {
  return { status, message, details }
}

async function checkForAndroidUpdate({ force = false } = {}) {
  if (Capacitor.getPlatform() !== 'android') {
    return diagnostic('unsupported', 'فحص OTA متاح داخل تطبيق Android فقط.')
  }
  if (!Capacitor.isPluginAvailable('CapacitorUpdater')) {
    return diagnostic(
      'plugin-missing',
      'إضافة التحديث غير موجودة في هذه النسخة.',
      'ثبّت أحدث APK يتضمن إضافة OTA ثم أعد الفحص.',
    )
  }
  if (checkInFlight) return checkInFlight

  const now = Date.now()
  if (!force && now - getStoredTime(SUCCESSFUL_CHECK_KEY) < CHECK_INTERVAL_MS) {
    return diagnostic('recent-check', 'تم فحص التحديث مؤخرًا.', 'استخدم زر الفحص اليدوي لتجاوز المهلة.')
  }
  if (!force && now - getStoredTime(LAST_ATTEMPT_KEY) < RETRY_INTERVAL_MS) {
    return diagnostic('retry-wait', 'تعذّر الفحص منذ وقت قصير.', 'انتظر دقيقتين ثم أعد المحاولة.')
  }

  setStoredTime(LAST_ATTEMPT_KEY, now)
  checkInFlight = (async () => {
    try {
      const response = await fetch(OTA_RELEASE_API, {
        headers: { Accept: 'application/vnd.github+json' },
        cache: 'no-store',
      })

      if (response.status === 404) {
        setStoredTime(SUCCESSFUL_CHECK_KEY, Date.now())
        return diagnostic(
          'release-missing',
          'لم أجد إصدار OTA على GitHub.',
          'لم يتم العثور على الوسم ota-latest (HTTP 404).',
        )
      }
      if (!response.ok) {
        const remaining = response.headers.get('x-ratelimit-remaining')
        const detail = response.status === 403
          ? `GitHub رفض الطلب (HTTP 403). المتبقي من طلبات API: ${remaining ?? 'غير معروف'}.`
          : `استجابة GitHub: HTTP ${response.status}.`
        return diagnostic('github-error', 'تعذر قراءة إصدار OTA من GitHub.', detail)
      }

      const release = await response.json()
      if (release.tag_name !== 'ota-latest' || release.draft || !release.prerelease) {
        return diagnostic(
          'release-invalid',
          'وصلت إلى GitHub لكن الإصدار ليس إصدار OTA صالحًا.',
          `الوسم المستلم: ${release.tag_name ?? 'غير معروف'}؛ تجريبي: ${Boolean(release.prerelease)}.`,
        )
      }

      const asset = release.assets?.find(
        (candidate) => candidate.name === OTA_ASSET_NAME && candidate.state === 'uploaded',
      )
      if (!asset?.browser_download_url || !asset.id) {
        const names = release.assets?.map((candidate) => candidate.name).join(', ') || 'لا توجد ملفات'
        return diagnostic(
          'asset-missing',
          'إصدار OTA موجود، لكن ملف التحديث dist.zip غير موجود أو لم يكتمل رفعه.',
          `الملفات المتاحة: ${names}.`,
        )
      }

      const version = String(asset.id)
      const { bundle: current } = await CapacitorUpdater.current()
      const pending = await CapacitorUpdater.getNextBundle()
      const currentVersion = current?.version ?? 'غير معروف'

      if (currentVersion === version) {
        setStoredTime(SUCCESSFUL_CHECK_KEY, Date.now())
        return diagnostic(
          'up-to-date',
          'التطبيق يستخدم أحدث حزمة OTA.',
          `الحزمة الحالية وآخر حزمة على GitHub: ${version}.`,
        )
      }
      if (pending?.version === version) {
        setStoredTime(SUCCESSFUL_CHECK_KEY, Date.now())
        return diagnostic(
          'pending',
          'التحديث منزّل ومجدول بالفعل.',
          `أغلق التطبيق وافتحه مجددًا لتطبيق الحزمة ${version}.`,
        )
      }

      const digest = typeof asset.digest === 'string' ? asset.digest.replace(/^sha256:/, '') : undefined
      const downloaded = await CapacitorUpdater.download({
        url: asset.browser_download_url,
        version,
        ...(digest ? { checksum: digest } : {}),
      })
      await CapacitorUpdater.next({ id: downloaded.id })
      setStoredTime(SUCCESSFUL_CHECK_KEY, Date.now())
      const size = `${(asset.size / (1024 * 1024)).toFixed(2)} MB`
      return diagnostic(
        'downloaded',
        'تم تنزيل تحديث الواجهة وجدولته بنجاح.',
        `رقم الحزمة: ${version}؛ حجمها: ${size}. أغلق التطبيق وافتحه مجددًا لتطبيقها.`,
      )
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error)
      console.warn('[OTA] Diagnostic check failed.', error)
      return diagnostic('error', 'فشل فحص أو تنزيل تحديث OTA.', details || 'خطأ غير معروف.')
    } finally {
      checkInFlight = undefined
    }
  })()

  return checkInFlight
}

export function checkAndroidOtaNow() {
  return checkForAndroidUpdate({ force: true })
}

export function initializeAndroidOta() {
  if (Capacitor.getPlatform() !== 'android') return

  // Acknowledge each launch so a bad bundle can be rolled back by the native updater.
  void CapacitorUpdater.notifyAppReady()
    .catch((error) => console.warn('[OTA] Could not confirm the current bundle.', error))
    .finally(() => void checkForAndroidUpdate())

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void checkForAndroidUpdate()
  })
}
