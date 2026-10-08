// Formatting helpers for values supplied by the administration API.
const locale = import.meta.env.VITE_LOCALE || 'ar-EG'
const defaultCurrency = import.meta.env.VITE_CURRENCY || 'EGP'

export function formatCurrency(amount, currency = defaultCurrency) {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return '—'
  const safeCurrency = /^[A-Z]{3}$/.test(currency || '') ? currency : defaultCurrency
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: safeCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

export function formatNumber(num) {
  if (num === null || num === undefined || !Number.isFinite(Number(num))) return '—'
  return new Intl.NumberFormat(locale).format(Number(num))
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function calculateCommission(totalSales, commissionType, commissionValue) {
  const sales = Math.max(0, Number(totalSales) || 0)
  const value = Math.max(0, Number(commissionValue) || 0)
  if (commissionType === 'percentage') return Math.round(sales * value) / 100
  return Math.min(sales, value)
}

export function calculateNetBalance(vendor) {
  if (vendor?.netBalance !== null && vendor?.netBalance !== undefined && Number.isFinite(Number(vendor.netBalance))) {
    return Number(vendor.netBalance)
  }
  const commission = Number.isFinite(Number(vendor?.commissionAmount))
    ? Number(vendor.commissionAmount)
    : calculateCommission(vendor?.totalSales, vendor?.commissionType, vendor?.commissionValue)
  return Number(vendor?.totalSales || 0) - commission - Number(vendor?.settledAmount || 0)
}

export function getVendorById(id, vendorList) {
  return vendorList.find((vendor) => vendor.id === id)
}
