// Formatting and helper utilities for the dashboard.

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num) {
  if (num === null || num === undefined) return '—'
  return new Intl.NumberFormat('ar-SA').format(num)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('ar-SA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

// Calculate commission amount for a vendor based on type and value
export function calculateCommission(totalSales, commissionType, commissionValue) {
  if (!totalSales || totalSales === 0) return 0
  if (commissionType === 'percentage') {
    return Math.round((totalSales * commissionValue) / 100)
  }
  // For fixed commission, it's per-order — we approximate with a flat amount
  return commissionValue
}

// Calculate net balance for a vendor (totalSales - commission - settledAmount)
export function calculateNetBalance(vendor) {
  const commission = calculateCommission(vendor.totalSales, vendor.commissionType, vendor.commissionValue)
  return vendor.totalSales - commission - vendor.settledAmount
}

export function getVendorById(id, vendorList) {
  return vendorList.find((v) => v.id === id)
}
