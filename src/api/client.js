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
    return window.sessionStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setSessionToken(token) {
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
      throw new ApiError(apiMessage(payload, response.status), response.status)
    }
    return payload?.data ?? payload
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error?.name === 'AbortError') {
      throw new ApiError('انتهت مهلة الاتصال بخادم الإدارة. حاول مرة أخرى.')
    }
    throw new ApiError('تعذر الاتصال بخادم الإدارة. تحقق من الإنترنت وإعدادات CORS.')
  } finally {
    window.clearTimeout(timeout)
  }
}

function pageQuery(page, limit = 100, extra = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit), ...extra })
  return `?${query.toString()}`
}

export const adminApi = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials, auth: false }),
  googleLogin: (idToken) => request('/auth/google', { method: 'POST', body: { idToken }, auth: false }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  employees: () => request('/employees'),
  createEmployee: (employee) => request('/employees', { method: 'POST', body: employee }),
  updateEmployeeStatus: (id, isActive) => request(`/employees/${encodeURIComponent(id)}/status`, {
    method: 'PATCH', body: { isActive },
  }),
  dashboard: () => request('/dashboard'),
  orders: (page = 1, limit = 100, status = 'all', q = '') => request(`/orders${pageQuery(page, limit, { status, q })}`),
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
