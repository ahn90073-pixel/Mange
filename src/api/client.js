import { Capacitor } from '@capacitor/core'
import { getAdminCacheScope, readAdminApiCache, writeAdminApiCache } from '../lib/adminLocalCache'
import { cacheAdminDocument, readCachedAdminDocument } from '../lib/adminDocumentCache'

const DEFAULT_API_BASE = 'https://mangerbackend.ahn90073.workers.dev/api/admin'
const API_BASE = (import.meta.env.VITE_ADMIN_API_BASE_URL || DEFAULT_API_BASE).replace(/\/+$/, '')
const TOKEN_KEY = 'mange-admin-session-token'

const localizedErrors = {
  'Internal server error': 'حدث خطأ داخلي في الخادم. حاول مرة أخرى.',
  'Internal server error.': 'حدث خطأ داخلي في الخادم. حاول مرة أخرى.',
}

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getSessionToken() {
  try {
    if (Capacitor.getPlatform() === 'android') {
      let persistentToken = ''
      try {
        persistentToken = window.localStorage.getItem(TOKEN_KEY) || ''
      } catch {
        return window.sessionStorage.getItem(TOKEN_KEY) || ''
      }
      if (persistentToken) return persistentToken

      // Migrate an existing token from the old tab-scoped store on first launch.
      const legacyToken = window.sessionStorage.getItem(TOKEN_KEY) || ''
      if (legacyToken) {
        window.localStorage.setItem(TOKEN_KEY, legacyToken)
        window.sessionStorage.removeItem(TOKEN_KEY)
      }
      return legacyToken
    }
    return window.sessionStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setSessionToken(token) {
  if (Capacitor.getPlatform() === 'android') {
    try {
      if (token) window.localStorage.setItem(TOKEN_KEY, token)
      else window.localStorage.removeItem(TOKEN_KEY)
      window.sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      // Fall back to the current WebView session if persistent storage is blocked.
      try {
        if (token) window.sessionStorage.setItem(TOKEN_KEY, token)
        else window.sessionStorage.removeItem(TOKEN_KEY)
      } catch {
        // In-memory UI state still works until WebView reloads.
      }
    }
    return
  }

  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token)
    else window.sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // Private browsing modes may reject storage; the current in-memory login still works until reload.
  }
}

function apiMessage(payload, status) {
  const message = payload?.message || payload?.error || ''
  if (localizedErrors[message]) return localizedErrors[message]
  if (status === 401) return message || 'انتهت جلسة الدخول. سجّل الدخول مجددًا.'
  if (status === 403) return message || 'ليس لديك صلاحية لتنفيذ هذه العملية.'
  if (status === 404) return 'العنصر المطلوب غير موجود.'
  if (status >= 500) return message || 'تعذر إكمال الطلب بسبب مشكلة في الخادم.'
  return message || 'تعذر إكمال الطلب.'
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const cacheable = method === 'GET' && auth
  const cached = cacheable ? await readAdminApiCache(path) : undefined
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 25000)
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = auth ? getSessionToken() : ''
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || payload?.success === false) {
      if (response.status === 401 && token) {
        setSessionToken('')
        window.dispatchEvent(new Event('mange:auth-expired'))
      }
      if (cacheable && cached !== undefined && response.status >= 500) return cached
      throw new ApiError(apiMessage(payload, response.status), response.status)
    }
    const data = payload?.data ?? payload
    if (cacheable) await writeAdminApiCache(path, data)
    return data
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (cacheable && cached !== undefined) return cached
    if (error?.name === 'AbortError') throw new ApiError('انتهت مهلة الاتصال بخادم الإدارة. حاول مرة أخرى.')
    throw new ApiError('تعذر الاتصال بخادم الإدارة. تحقق من الإنترنت وإعدادات CORS.')
  } finally {
    window.clearTimeout(timeout)
  }
}

function pageQuery(page, limit = 100, extra = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit), ...extra })
  return `?${query.toString()}`
}

const apiPaths = {
  me: () => '/auth/me',
  dashboard: () => '/dashboard',
  vendors: (page = 1, limit = 100) => `/vendors${pageQuery(page, limit)}`,
  vendor: (id) => `/vendors/${encodeURIComponent(id)}`,
  products: (page = 1, limit = 100) => `/products${pageQuery(page, limit, { status: 'all' })}`,
  activeProducts: (page = 1, limit = 100) => `/products/active${pageQuery(page, limit, { olderThanDays: '30' })}`,
  settlements: (page = 1, limit = 100) => `/settlements${pageQuery(page, limit, { status: 'all' })}`,
  orders: (page = 1, limit = 100, status = 'all', q = '', shipmentStatus = 'all') => `/orders${pageQuery(page, limit, { status, q, shipmentStatus })}`,
  order: (vendorId, orderId) => `/orders/${encodeURIComponent(vendorId)}/${encodeURIComponent(orderId)}`,
  employees: () => '/employees',
  storeRequests: (status = 'pending', page = 1, limit = 100) => `/store-requests${pageQuery(page, limit, { status })}`,
  notificationStatus: () => '/notifications/status',
  notificationContacts: (audience = '', page = 1, limit = 50) => `/notifications/contacts${pageQuery(page, limit, audience ? { audience } : {})}`,
  shipmentActivationRequests: (status = 'all', limit = 50) => `/notifications/shipment-requests${pageQuery(1, limit, { status })}`,
}

const cached = (path) => readAdminApiCache(path)

export const adminApi = {
  cache: {
    me: () => cached(apiPaths.me()),
    dashboard: () => cached(apiPaths.dashboard()),
    vendors: (page = 1, limit = 100) => cached(apiPaths.vendors(page, limit)),
    vendor: (id) => cached(apiPaths.vendor(id)),
    products: (page = 1, limit = 100) => cached(apiPaths.products(page, limit)),
    activeProducts: (page = 1, limit = 100) => cached(apiPaths.activeProducts(page, limit)),
    settlements: (page = 1, limit = 100) => cached(apiPaths.settlements(page, limit)),
    orders: (page = 1, limit = 100, status = 'all', q = '', shipmentStatus = 'all') => cached(apiPaths.orders(page, limit, status, q, shipmentStatus)),
    order: (vendorId, orderId) => cached(apiPaths.order(vendorId, orderId)),
    employees: () => cached(apiPaths.employees()),
    storeRequests: (status = 'pending', page = 1, limit = 100) => cached(apiPaths.storeRequests(status, page, limit)),
    notificationStatus: () => cached(apiPaths.notificationStatus()),
    notificationContacts: (audience = '', page = 1, limit = 50) => cached(apiPaths.notificationContacts(audience, page, limit)),
    shipmentActivationRequests: (status = 'all', limit = 50) => cached(apiPaths.shipmentActivationRequests(status, limit)),
  },
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials, auth: false }),
  googleLogin: (idToken) => request('/auth/google', { method: 'POST', body: { idToken }, auth: false }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  notificationStatus: () => request('/notifications/status'),
  notificationContacts: (audience = '', page = 1, limit = 50) => request(`/notifications/contacts${pageQuery(page, limit, audience ? { audience } : {})}`),
  shipmentActivationRequests: (status = 'all', limit = 50) => request(`/notifications/shipment-requests${pageQuery(1, limit, { status })}`),
  sendNotification: (campaign) => request('/notifications/send', { method: 'POST', body: campaign }),
  employees: () => request('/employees'),
  storeRequests: (status = 'pending', page = 1, limit = 100) => request(`/store-requests${pageQuery(page, limit, { status })}`),
  storeRequestDocument: async (id, documentType) => {
    const scope = getAdminCacheScope()
    try {
      const response = await fetch(`${API_BASE}/store-requests/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentType)}`, {
        headers: { Accept: 'application/octet-stream', Authorization: `Bearer ${getSessionToken()}` },
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new ApiError(apiMessage(payload, response.status), response.status)
      }
      const blob = await response.blob()
      await cacheAdminDocument(scope, id, documentType, blob)
      return blob
    } catch (error) {
      if (error instanceof ApiError) throw error
      const offlineCopy = await readCachedAdminDocument(scope, id, documentType)
      if (offlineCopy) return offlineCopy
      throw new ApiError('تعذر الاتصال بخادم الإدارة أو تحميل المستند المحفوظ.')
    }
  },
  approveStoreRequest: (id) => request(`/store-requests/${encodeURIComponent(id)}/approve`, { method: 'POST', body: {} }),
  rejectStoreRequest: (id, adminNote = '') => request(`/store-requests/${encodeURIComponent(id)}/reject`, { method: 'POST', body: { adminNote } }),
  createEmployee: (employee) => request('/employees', { method: 'POST', body: employee }),
  updateEmployeeStatus: (id, isActive) => request(`/employees/${encodeURIComponent(id)}/status`, {
    method: 'PATCH', body: { isActive },
  }),
  dashboard: () => request('/dashboard'),
  orders: (page = 1, limit = 100, status = 'all', q = '', shipmentStatus = 'all') => request(`/orders${pageQuery(page, limit, { status, q, shipmentStatus })}`),
  order: (vendorId, orderId) => request(`/orders/${encodeURIComponent(vendorId)}/${encodeURIComponent(orderId)}`),
  updateOrder: (vendorId, orderId, update) => request(
    `/orders/${encodeURIComponent(vendorId)}/${encodeURIComponent(orderId)}`,
    { method: 'PATCH', body: update },
  ),
  vendors: (page = 1, limit = 100) => request(`/vendors${pageQuery(page, limit)}`),
  vendor: (id) => request(`/vendors/${encodeURIComponent(id)}`),
  updateVendorGovernorate: (vendorId, governorate) => request(
    `/vendors/${encodeURIComponent(vendorId)}/governorate`,
    { method: 'PATCH', body: { governorate } },
  ),
  products: (page = 1, limit = 100) => request(`/products${pageQuery(page, limit, { status: 'all' })}`),
  activeProducts: (page = 1, limit = 100) => request(`/products/active${pageQuery(page, limit, { olderThanDays: '30' })}`),
  updateProduct: (vendorId, productId, updates) => request(
    `/products/${encodeURIComponent(vendorId)}/${encodeURIComponent(productId)}`,
    { method: 'PATCH', body: updates },
  ),
  settlements: (page = 1, limit = 100) => request(`/settlements${pageQuery(page, limit, { status: 'all' })}`),
  reviewProduct: (vendorId, productId, decision, reason) => request(
    `/products/${encodeURIComponent(vendorId)}/${encodeURIComponent(productId)}/review`,
    { method: 'PATCH', body: { decision, ...(reason ? { reason } : {}) } },
  ),
  resubmitProduct: (vendorId, productId) => request(
    `/products/${encodeURIComponent(vendorId)}/${encodeURIComponent(productId)}/resubmit`,
    { method: 'PATCH', body: {} },
  ),
  updateVendorStatus: (vendorId, status) => request(
    `/vendors/${encodeURIComponent(vendorId)}/status`,
    { method: 'PATCH', body: { status } },
  ),
  updateCommission: (vendorId, type, value) => request(
    `/vendors/${encodeURIComponent(vendorId)}/commission`,
    { method: 'PATCH', body: { type, value } },
  ),
  createSettlement: (settlement) => request('/settlements', { method: 'POST', body: settlement }),
  keepProduct: (vendorId, productId) => request(
    `/products/${encodeURIComponent(vendorId)}/${encodeURIComponent(productId)}/keep`,
    { method: 'PATCH', body: {} },
  ),
  archiveProduct: (vendorId, productId) => request(
    `/products/${encodeURIComponent(vendorId)}/${encodeURIComponent(productId)}`,
    { method: 'DELETE' },
  ),
}
