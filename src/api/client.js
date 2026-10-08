const DEFAULT_API_BASE = 'https://mangerbackend.ahn90073.workers.dev/api/admin'
const API_BASE = (import.meta.env.VITE_ADMIN_API_BASE_URL || DEFAULT_API_BASE).replace(/\/+$/, '')

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

function apiMessage(payload, status) {
  const message = payload?.message || payload?.error || ''
  if (localizedErrors[message]) return localizedErrors[message]
  if (status === 404) return 'العنصر المطلوب غير موجود.'
  if (status >= 500) return 'تعذر إكمال الطلب بسبب مشكلة في الخادم.'
  return message || 'تعذر إكمال الطلب.'
}

async function request(path, { method = 'GET', body } = {}) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 25000)
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

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
  dashboard: () => request('/dashboard'),
  vendors: (page = 1, limit = 100) => request(`/vendors${pageQuery(page, limit)}`),
  vendor: (id) => request(`/vendors/${encodeURIComponent(id)}`),
  products: (page = 1, limit = 100) => request(`/products${pageQuery(page, limit, { status: 'all' })}`),
  activeProducts: (page = 1, limit = 100) => request(`/products/active${pageQuery(page, limit, { olderThanDays: '30' })}`),
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
  createSettlement: (settlement) => request('/settlements', {
    method: 'POST',
    body: settlement,
  }),
  keepProduct: (vendorId, productId) => request(
    `/products/${encodeURIComponent(vendorId)}/${encodeURIComponent(productId)}/keep`,
    { method: 'PATCH', body: {} },
  ),
  archiveProduct: (vendorId, productId) => request(
    `/products/${encodeURIComponent(vendorId)}/${encodeURIComponent(productId)}`,
    { method: 'DELETE' },
  ),
}
