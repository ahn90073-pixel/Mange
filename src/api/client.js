const DEFAULT_API_BASE = 'https://mangerbackend.ahn90073.workers.dev/api/admin'
const API_BASE = (import.meta.env.VITE_ADMIN_API_BASE_URL || DEFAULT_API_BASE).replace(/\/+$/, '')
const TOKEN_KEY = 'mange.admin.token'

const localizedErrors = {
  'Invalid email or password.': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'This account is not a platform administrator.': 'هذا الحساب غير مخوّل لإدارة المنصة.',
  'Authentication service is not configured.': 'خدمة تسجيل الدخول غير مهيأة حالياً، يرجى التواصل مع مسؤول النظام.',
  'Invalid or expired token.': 'انتهت صلاحية الجلسة؛ سجّل الدخول مجدداً.',
  'Invalid or expired token': 'انتهت صلاحية الجلسة؛ سجّل الدخول مجدداً.',
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

export function getAdminToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveAdminToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearAdminToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

function apiMessage(payload, status) {
  const message = payload?.message || payload?.error || ''
  if (localizedErrors[message]) return localizedErrors[message]
  if (status === 401) return 'انتهت صلاحية الجلسة أو بيانات الدخول غير صحيحة.'
  if (status === 403) return 'هذا الحساب غير مخوّل لتنفيذ هذا الإجراء.'
  if (status === 404) return 'العنصر المطلوب غير موجود.'
  if (status >= 500) return 'تعذر إكمال الطلب بسبب مشكلة في الخادم.'
  return message || 'تعذر إكمال الطلب.'
}

async function request(path, { token = getAdminToken(), method = 'GET', body } = {}) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 25000)
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
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
  login: (email, password) => request('/auth/login', {
    token: null,
    method: 'POST',
    body: { email, password },
  }),
  me: (token) => request('/auth/me', { token }),
  dashboard: (token) => request('/dashboard', { token }),
  vendors: (token, page = 1, limit = 100) => request(`/vendors${pageQuery(page, limit)}`, { token }),
  vendor: (token, id) => request(`/vendors/${encodeURIComponent(id)}`, { token }),
  products: (token, page = 1, limit = 100) => request(`/products${pageQuery(page, limit, { status: 'all' })}`, { token }),
  activeProducts: (token, page = 1, limit = 100) => request(`/products/active${pageQuery(page, limit, { olderThanDays: '30' })}`, { token }),
  settlements: (token, page = 1, limit = 100) => request(`/settlements${pageQuery(page, limit, { status: 'all' })}`, { token }),
  reviewProduct: (token, vendorId, productId, decision, reason) => request(
    `/products/${encodeURIComponent(vendorId)}/${encodeURIComponent(productId)}/review`,
    { token, method: 'PATCH', body: { decision, ...(reason ? { reason } : {}) } },
  ),
  updateVendorStatus: (token, vendorId, status) => request(
    `/vendors/${encodeURIComponent(vendorId)}/status`,
    { token, method: 'PATCH', body: { status } },
  ),
  updateCommission: (token, vendorId, type, value) => request(
    `/vendors/${encodeURIComponent(vendorId)}/commission`,
    { token, method: 'PATCH', body: { type, value } },
  ),
  createSettlement: (token, settlement) => request('/settlements', {
    token,
    method: 'POST',
    body: settlement,
  }),
  keepProduct: (token, vendorId, productId) => request(
    `/products/${encodeURIComponent(vendorId)}/${encodeURIComponent(productId)}/keep`,
    { token, method: 'PATCH', body: {} },
  ),
  archiveProduct: (token, vendorId, productId) => request(
    `/products/${encodeURIComponent(vendorId)}/${encodeURIComponent(productId)}`,
    { token, method: 'DELETE' },
  ),
}
