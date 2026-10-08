import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { adminApi } from '../api/client'

const DashboardContext = createContext(null)

async function fetchAllPages(fetchPage) {
  const first = await fetchPage(1, 100)
  const items = first?.items || []
  const totalPages = Math.max(1, Number(first?.pagination?.totalPages) || 1)
  if (totalPages === 1) return items

  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchPage(index + 2, 100))
  )
  return items.concat(...remaining.map((page) => page?.items || []))
}

const emptyData = {
  dashboard: null,
  vendors: [],
  products: [],
  activeProducts: [],
  settlements: [],
}

export function DashboardProvider({ children }) {
  const [loading, setLoading] = useState(false)
  const [dataReady, setDataReady] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [data, setData] = useState(emptyData)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((type, message) => setToast({ type, message }), [])
  const hideToast = useCallback(() => setToast(null), [])

  const loadData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    setLoadError('')
    try {
      const [dashboard, vendors, products, activeProducts, settlements] = await Promise.all([
        adminApi.dashboard(),
        fetchAllPages((page, limit) => adminApi.vendors(page, limit)),
        fetchAllPages((page, limit) => adminApi.products(page, limit)),
        fetchAllPages((page, limit) => adminApi.activeProducts(page, limit)),
        fetchAllPages((page, limit) => adminApi.settlements(page, limit)),
      ])
      setData({ dashboard, vendors, products, activeProducts, settlements })
      setDataReady(true)
      return true
    } catch (error) {
      setLoadError(error.message || 'تعذر تحميل بيانات لوحة الإدارة.')
      return false
    } finally {
      if (showSpinner) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData(true)
  }, [loadData])

  const refresh = useCallback(() => loadData(true), [loadData])

  const runMutation = useCallback(async (operation, successMessage) => {
    try {
      const result = await operation()
      showToast('success', successMessage)
      const refreshed = await loadData(false)
      if (!refreshed) {
        showToast('warning', 'تم تنفيذ العملية، لكن تعذر تحديث القوائم. أعد تحميل البيانات لاحقاً.')
      }
      return result
    } catch (error) {
      showToast('error', error.message || 'تعذر حفظ التغيير.')
      return null
    }
  }, [loadData, showToast])

  const findProduct = useCallback((productId) => (
    [...data.products, ...data.activeProducts].find((product) => product.id === productId)
  ), [data.activeProducts, data.products])

  const approveProduct = useCallback((productId) => {
    const product = findProduct(productId)
    if (!product) {
      showToast('error', 'تعذر العثور على المنتج المطلوب.')
      return Promise.resolve(null)
    }
    return runMutation(
      () => adminApi.reviewProduct(product.vendorId, product.id, 'approve'),
      'تمت الموافقة على المنتج ونشره بنجاح.'
    )
  }, [findProduct, runMutation, showToast])

  const rejectProduct = useCallback((productId, reason) => {
    const product = findProduct(productId)
    if (!product) {
      showToast('error', 'تعذر العثور على المنتج المطلوب.')
      return Promise.resolve(null)
    }
    return runMutation(
      () => adminApi.reviewProduct(product.vendorId, product.id, 'reject', reason),
      'تم رفض المنتج.'
    )
  }, [findProduct, runMutation, showToast])

  const updateCommission = useCallback((vendorId, commissionType, commissionValue) => (
    runMutation(
      () => adminApi.updateCommission(vendorId, commissionType, Number(commissionValue)),
      'تم تحديث نسبة العمولة بنجاح.'
    )
  ), [runMutation])

  const updateVendorStatus = useCallback((vendorId, status) => (
    runMutation(
      () => adminApi.updateVendorStatus(vendorId, status),
      'تم تحديث حالة التاجر.'
    )
  ), [runMutation])

  const createSettlement = useCallback((vendorId, amount, period, method) => (
    runMutation(
      () => adminApi.createSettlement({
        vendorId,
        amount: Number(amount),
        period: period.trim(),
        method,
        currency: data.dashboard?.currency || import.meta.env.VITE_CURRENCY || 'EGP',
      }),
      'تم إنشاء سند السداد بنجاح.'
    )
  ), [data.dashboard?.currency, runMutation])

  const deleteActiveProduct = useCallback((productId) => {
    const product = findProduct(productId)
    if (!product) {
      showToast('error', 'تعذر العثور على المنتج المطلوب.')
      return Promise.resolve(null)
    }
    return runMutation(
      () => adminApi.archiveProduct(product.vendorId, product.id),
      'تمت أرشفة المنتج وإزالته من المتجر.'
    )
  }, [findProduct, runMutation, showToast])

  const keepActiveProduct = useCallback((productId) => {
    const product = findProduct(productId)
    if (!product) {
      showToast('error', 'تعذر العثور على المنتج المطلوب.')
      return Promise.resolve(null)
    }
    return runMutation(
      () => adminApi.keepProduct(product.vendorId, product.id),
      'تم الإبقاء على المنتج للعرض.'
    )
  }, [findProduct, runMutation, showToast])

  const value = {
    ...data,
    recentOrders: data.dashboard?.recentOrders || [],
    loading,
    dataReady,
    loadError,
    refresh,
    toast,
    showToast,
    hideToast,
    approveProduct,
    rejectProduct,
    updateCommission,
    updateVendorStatus,
    createSettlement,
    deleteActiveProduct,
    keepActiveProduct,
  }

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) throw new Error('useDashboard must be used within DashboardProvider')
  return context
}
