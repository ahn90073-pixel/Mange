import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

const OTA_RELEASE_API =
  'https://api.github.com/repos/ahn90073-pixel/Mange/releases/tags/ota-latest'
const OTA_ASSET_NAME = 'dist.zip'
const SUCCESSFUL_CHECK_KEY = 'mange.android-ota.last-success'
const LAST_ATTEMPT_KEY = 'mange.android-ota.last-attempt'
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000
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

async function checkForAndroidUpdate() {
  if (Capacitor.getPlatform() !== 'android') return
  if (checkInFlight) return checkInFlight

  const now = Date.now()
  if (now - getStoredTime(SUCCESSFUL_CHECK_KEY) < CHECK_INTERVAL_MS) return
  if (now - getStoredTime(LAST_ATTEMPT_KEY) < RETRY_INTERVAL_MS) return

  setStoredTime(LAST_ATTEMPT_KEY, now)
  checkInFlight = (async () => {
    try {
      const response = await fetch(OTA_RELEASE_API, {
        headers: { Accept: 'application/vnd.github+json' },
        cache: 'no-store',
      })

      if (response.status === 404) {
        setStoredTime(SUCCESSFUL_CHECK_KEY, Date.now())
        return
      }
      if (!response.ok) throw new Error(`GitHub release check failed (${response.status})`)

      const release = await response.json()
      if (release.tag_name !== 'ota-latest' || release.draft || !release.prerelease) return

      const asset = release.assets?.find(
        (candidate) => candidate.name === OTA_ASSET_NAME && candidate.state === 'uploaded',
      )
      if (!asset?.browser_download_url || !asset.id) return

      const version = String(asset.id)
      const { bundle: current } = await CapacitorUpdater.current()
      const pending = await CapacitorUpdater.getNextBundle()
      if (current?.version === version || pending?.version === version) {
        setStoredTime(SUCCESSFUL_CHECK_KEY, Date.now())
        return
      }

      const digest = typeof asset.digest === 'string' ? asset.digest.replace(/^sha256:/, '') : undefined
      const downloaded = await CapacitorUpdater.download({
        url: asset.browser_download_url,
        version,
        ...(digest ? { checksum: digest } : {}),
      })
      await CapacitorUpdater.next({ id: downloaded.id })
      setStoredTime(SUCCESSFUL_CHECK_KEY, Date.now())
    } catch (error) {
      console.warn('[OTA] Could not check or download the GitHub update.', error)
    } finally {
      checkInFlight = undefined
    }
  })()

  return checkInFlight
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
