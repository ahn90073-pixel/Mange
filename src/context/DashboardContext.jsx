import { createContext, useContext, useState, useCallback } from 'react'
import {
  vendors as initialVendors,
  pendingProducts as initialProducts,
  settlements as initialSettlements,
} from '../data/mockData'

const DashboardContext = createContext(null)

export function DashboardProvider({ children }) {
  const [vendors, setVendors] = useState(initialVendors)
  const [products, setProducts] = useState(initialProducts)
  const [settlements, setSettlements] = useState(initialSettlements)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((type, message) => {
    setToast({ type, message })
  }, [])

  const hideToast = useCallback(() => setToast(null), [])

  // Approve a pending product
  const approveProduct = useCallback(
    (productId) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, status: 'approved' } : p
        )
      )
      // Increment vendor's total products
      const product = products.find((p) => p.id === productId)
      if (product) {
        setVendors((prev) =>
          prev.map((v) =>
            v.id === product.vendorId
              ? {
                  ...v,
                  pendingProducts: Math.max(0, v.pendingProducts - 1),
                  totalProducts: v.totalProducts + 1,
                }
              : v
          )
        )
      }
      showToast('success', 'تمت الموافقة على المنتج ونشره بنجاح')
    },
    [products, showToast]
  )

  // Reject a pending product with a reason
  const rejectProduct = useCallback(
    (productId, reason) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, status: 'rejected', rejectReason: reason }
            : p
        )
      )
      const product = products.find((p) => p.id === productId)
      if (product) {
        setVendors((prev) =>
          prev.map((v) =>
            v.id === product.vendorId
              ? { ...v, pendingProducts: Math.max(0, v.pendingProducts - 1) }
              : v
          )
        )
      }
      showToast('info', 'تم رفض المنتج')
    },
    [products, showToast]
  )

  // Update vendor commission
  const updateCommission = useCallback(
    (vendorId, commissionType, commissionValue) => {
      setVendors((prev) =>
        prev.map((v) =>
          v.id === vendorId
            ? { ...v, commissionType, commissionValue }
            : v
        )
      )
      showToast('success', 'تم تحديث نسبة العمولة بنجاح')
    },
    [showToast]
  )

  // Update vendor status
  const updateVendorStatus = useCallback(
    (vendorId, status) => {
      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, status } : v))
      )
      showToast('success', 'تم تحديث حالة التاجر')
    },
    [showToast]
  )

  // Create a new settlement
  const createSettlement = useCallback(
    (vendorId, amount, period, method) => {
      const vendor = vendors.find((v) => v.id === vendorId)
      if (!vendor) return

      const commission =
        vendor.commissionType === 'percentage'
          ? Math.round((amount * vendor.commissionValue) / 100)
          : vendor.commissionValue

      const netAmount = amount - commission
      const newSettlement = {
        id: `STL-2026-${String(settlements.length + 1).padStart(3, '0')}`,
        vendorId,
        vendorName: vendor.companyName,
        amount,
        commissionDeducted: commission,
        netAmount,
        period,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        method,
        reference: `TXN-${Math.floor(Math.random() * 1000000)}`,
      }

      setSettlements((prev) => [newSettlement, ...prev])
      setVendors((prev) =>
        prev.map((v) =>
          v.id === vendorId
            ? { ...v, settledAmount: v.settledAmount + netAmount }
            : v
        )
      )
      showToast('success', 'تم إنشاء سند السداد بنجاح')
      return newSettlement
    },
    [vendors, settlements.length, showToast]
  )

  const value = {
    vendors,
    products,
    settlements,
    toast,
    showToast,
    hideToast,
    approveProduct,
    rejectProduct,
    updateCommission,
    updateVendorStatus,
    createSettlement,
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error('useDashboard must be used within DashboardProvider')
  }
  return ctx
}
