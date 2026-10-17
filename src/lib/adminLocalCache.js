import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'

const DATABASE_NAME = 'mange_admin_data'
const TABLE_NAME = 'admin_api_cache'
const CACHE_PREFIX = 'mange:admin:api-cache:'
const SCOPE_KEY = 'mange:admin:cache-scope'
let databasePromise
let memoryScope = ''
let scopeWasSet = false

function isAndroidApp() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

function readStorage(key) {
  try {
    return typeof localStorage === 'undefined' ? '' : localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

export function getAdminCacheScope() {
  if (scopeWasSet) return memoryScope
  return memoryScope || readStorage(SCOPE_KEY)
}

export function setAdminCacheScope(value) {
  memoryScope = String(value || '').trim()
  scopeWasSet = true
  try {
    if (typeof localStorage !== 'undefined') {
      if (memoryScope) localStorage.setItem(SCOPE_KEY, memoryScope)
      else localStorage.removeItem(SCOPE_KEY)
    }
  } catch {
    // The current app instance can still use its in-memory scope.
  }
  return memoryScope
}

async function getDatabase() {
  if (!isAndroidApp()) return null
  if (!databasePromise) {
    databasePromise = (async () => {
      const sqlite = new SQLiteConnection(CapacitorSQLite)
      const existing = await sqlite.isConnection(DATABASE_NAME, false)
      const db = existing.result
        ? await sqlite.retrieveConnection(DATABASE_NAME, false)
        : await sqlite.createConnection(DATABASE_NAME, false, 'no-encryption', 1, false)
      const open = await db.isDBOpen()
      if (!open.result) await db.open()
      await db.execute(`CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        cache_key TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`)
      return db
    })().catch((error) => {
      databasePromise = undefined
      throw error
    })
  }
  return databasePromise
}

function cacheKey(path, scope) {
  return `${encodeURIComponent(String(scope))}:${String(path)}`
}

function webStorageRead(path, scope) {
  try {
    if (typeof localStorage === 'undefined') return undefined
    const value = localStorage.getItem(`${CACHE_PREFIX}${cacheKey(path, scope)}`)
    return value === null ? undefined : JSON.parse(value)
  } catch {
    return undefined
  }
}

function webStorageWrite(path, scope, value) {
  try {
    if (typeof localStorage === 'undefined') return false
    localStorage.setItem(`${CACHE_PREFIX}${cacheKey(path, scope)}`, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export async function initializeAdminCache() {
  try {
    return Boolean(await getDatabase())
  } catch (error) {
    console.warn('[AdminCache] SQLite initialization failed; fallback storage will be used.', error)
    return false
  }
}

export async function readAdminApiCache(path, scope = getAdminCacheScope()) {
  if (!scope) return undefined
  try {
    const db = await getDatabase()
    if (db) {
      const result = await db.query(`SELECT payload FROM ${TABLE_NAME} WHERE cache_key = ? LIMIT 1`, [cacheKey(path, scope)])
      if (result.values?.length) return JSON.parse(result.values[0].payload)
    }
  } catch (error) {
    console.warn('[AdminCache] SQLite read failed; trying fallback storage.', error)
  }
  return webStorageRead(path, scope)
}

export async function writeAdminApiCache(path, value, scope = getAdminCacheScope()) {
  if (!scope) return false
  let payload
  try {
    payload = JSON.stringify(value)
  } catch {
    return false
  }
  if (payload === undefined) return false
  try {
    const db = await getDatabase()
    if (db) {
      await db.run(
        `INSERT OR REPLACE INTO ${TABLE_NAME} (cache_key, payload, updated_at) VALUES (?, ?, ?)`,
        [cacheKey(path, scope), payload, new Date().toISOString()],
        false,
      )
      return true
    }
  } catch (error) {
    console.warn('[AdminCache] SQLite write failed; using fallback storage.', error)
  }
  return webStorageWrite(path, scope, value)
}

export async function saveCachedAdminUser(user) {
  const scope = user?.id ?? user?.uid ?? user?.email
  if (scope === undefined || scope === null || String(scope).trim() === '') return false
  setAdminCacheScope(scope)
  return writeAdminApiCache('/auth/me', user, scope)
}

export async function readCachedAdminUser() {
  const scope = getAdminCacheScope()
  if (!scope) return null
  const user = await readAdminApiCache('/auth/me', scope)
  return user && typeof user === 'object' ? user : null
}
