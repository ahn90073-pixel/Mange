import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'

function isAndroidApp() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

function documentPath(scope, requestId, documentType) {
  const safeScope = encodeURIComponent(String(scope || 'unknown'))
  const safeId = encodeURIComponent(String(requestId || ''))
  const safeType = encodeURIComponent(String(documentType || 'document'))
  return `admin-documents/${safeScope}/${safeId}-${safeType}`
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result || '')
      resolve(value.includes(',') ? value.slice(value.indexOf(',') + 1) : value)
    }
    reader.onerror = () => reject(reader.error || new Error('تعذر قراءة الملف محليًا.'))
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(value, contentType) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type: contentType || 'application/octet-stream' })
}

export async function cacheAdminDocument(scope, requestId, documentType, blob) {
  if (!isAndroidApp() || !scope || !(blob instanceof Blob)) return false
  try {
    const data = await blobToBase64(blob)
    await Filesystem.writeFile({
      path: documentPath(scope, requestId, documentType),
      data,
      directory: Directory.Data,
      recursive: true,
    })
    return true
  } catch (error) {
    console.warn('[AdminDocumentCache] Could not cache document.', error)
    return false
  }
}

export async function readCachedAdminDocument(scope, requestId, documentType, contentType) {
  if (!isAndroidApp() || !scope) return null
  try {
    const result = await Filesystem.readFile({
      path: documentPath(scope, requestId, documentType),
      directory: Directory.Data,
    })
    if (typeof result.data !== 'string' || !result.data) return null
    return base64ToBlob(result.data, contentType)
  } catch {
    return null
  }
}
