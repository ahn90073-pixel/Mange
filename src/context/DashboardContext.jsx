import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { adminApi, clearAdminToken, getAdminToken, saveAdminToken } from '../api/client'

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
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [authInitializing, setAuthInitializing] = useState(true)
  const [authMessage, setAuthMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [dataReady, setDataReady] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [data, setData] = useState(emptyData)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((type, message) => setToast({ type, message }), [])
  const hideToast = useCallback(() => setToast(null), [])

  const logout = useCallback(() => {
    clearAdminToken()
    setToken(null)
    setUser(null)
    setAuthMessage('')
    setLoading(false)
    setDataReady(false)
    setLoadError('')
    setData(emptyData)
  }, [])

  useEffect(() => {
    let active = true
    const savedToken = getAdminToken()
    if (!savedToken) {
      setAuthInitializing(false)
      return () => { active = false }
    }

    adminApi.me(savedToken)
      .then((admin) => {
        if (!active) return
        setToken(savedToken)
        setUser(admin)
      })
      .catch((error) => {
        if (!active) return
        if (error.status === 401) clearAdminToken()
        else setAuthMessage(error.message)
      })
      .finally(() => {
        if (active) setAuthInitializing(false)
      })

    return () => { active = false }
  }, [])

  const login = useCallback(async (email, password) => {
    const result = await adminApi.login(email.trim(), password)
    if (!result?.token || !result?.user?.isPlatformAdmin) {
      throw new Error('لم يُرجع الخادم جلسة مدير صالحة.')
    }
    saveAdminToken(result.token)
    setToken(result.token)
    setUser(result.user)
    setAuthMessage('')
    setAuthInitializing(false)
    setData(emptyData)
    setDataReady(false)
    setLoadError('')
    return true
  }, [])

  const loadData = useCallback(async (currentToken, showSpinner = true) => {
    if (!currentToken) return false
    if (showSpinner) setLoading(true)
    setLoadError('')
    try {
      const [dashboard, vendors, products, activeProducts, settlements] = await Promise.all([
        adminApi.dashboard(currentToken),
        fetchAllPages((page, limit) => adminApi.vendors(currentToken, page, limit)),
        fetchAllPages((page, limit) => adminApi.products(currentToken, page, limit)),
        fetchAllPages((page, limit) => adminApi.activeProducts(currentToken, page, limit)),
        fetchAllPages((page, limit) => adminApi.settlements(currentToken, page, limit)),
      ])
      setData({ dashboard, vendors, products, activeProducts, settlements })
      setDataReady(true)
      return true
    } catch (error) {
      setLoadError(error.message || 'تعذر تحميل بيانات لوحة الإدارة.')
      if (error.status === 401) {
        logout()
        showToast('warning', 'انتهت الجلسة؛ سجّل الدخول مرة أخرى.')
      }
      return false
    } finally {
      if (showSpinner) setLoading(false)
    }
  }, [logout, showToast])

  useEffect(() => {
    if (token && user) void loadData(token, true)
  }, [token, user, loadData])

  const refresh = useCallback(() => loadData(token, true), [loadData, token])

  const runMutation = useCallback(async (operation, successMessage) => {
    if (!token) return null
    try {
      const result = await operation()
      showToast('success', successMessage)
      const refreshed = await loadData(token, false)
      if (!refreshed && getAdminToken()) {
        showToast('warning', 'تم تنفيذ العملية، لكن تعذر تحديث القوائم. أعد تحميل البيانات لاحقاً.')
      }
      return result
    } catch (error) {
      if (error.status === 401) {
        logout()
        showToast('warning', 'انتهت الجلسة؛ سجّل الدخول مرة أخرى.')
      } else {
        showToast('error', error.message || 'تعذر حفظ التغيير.')
      }
      return null
    }
  }, [loadData, logout, showToast, token])

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
      () => adminApi.reviewProduct(token, product.vendorId, product.id, 'approve'),
      'تمت الموافقة على المنتج ونشره بنجاح.'
    )
  }, [findProduct, runMutation, showToast, token])

  const rejectProduct = useCallback((productId, reason) => {
    const product = findProduct(productId)
    if (!product) {
      showToast('error', 'تعذر العثور على المنتج المطلوب.')
      return Promise.resolve(null)
    }
    return runMutation(
      () => adminApi.reviewProduct(token, product.vendorId, product.id, 'reject', reason),
      'تم رفض المنتج.'
    )
  }, [findProduct, runMutation, showToast, token])

  const updateCommission = useCallback((vendorId, commissionType, commissionValue) => (
    runMutation(
      () => adminApi.updateCommission(token, vendorId, commissionType, Number(commissionValue)),
      'تم تحديث نسبة العمولة بنجاح.'
    )
  ), [runMutation, token])

  const updateVendorStatus = useCallback((vendorId, status) => (
    runMutation(
      () => adminApi.updateVendorStatus(token, vendorId, status),
      'تم تحديث حالة التاجر.'
    )
  ), [runMutation, token])

  const createSettlement = useCallback((vendorId, amount, period, method) => (
    runMutation(
      () => adminApi.createSettlement(token, {
        vendorId,
        amount: Number(amount),
        period: period.trim(),
        method,
        currency: data.dashboard?.currency || import.meta.env.VITE_CURRENCY || 'EGP',
      }),
      'تم إنشاء سند السداد بنجاح.'
    )
  ), [data.dashboard?.currency, runMutation, token])

  const deleteActiveProduct = useCallback((productId) => {
    const product = findProduct(productId)
    if (!product) {
      showToast('error', 'تعذر العثور على المنتج المطلوب.')
      return Promise.resolve(null)
    }
    return runMutation(
      () => adminApi.archiveProduct(token, product.vendorId, product.id),
      'تمت أرشفة المنتج وإزالته من المتجر.'
    )
  }, [findProduct, runMutation, showToast, token])

  const keepActiveProduct = useCallback((productId) => {
    const product = findProduct(productId)
    if (!product) {
      showToast('error', 'تعذر العثور على المنتج المطلوب.')
      return Promise.resolve(null)
    }
    return runMutation(
      () => adminApi.keepProduct(token, product.vendorId, product.id),
      'تم الإبقاء على المنتج للعرض.'
    )
  }, [findProduct, runMutation, showToast, token])

  const value = {
    ...data,
    recentOrders: data.dashboard?.recentOrders || [],
    authInitializing,
    authMessage,
    user,
    login,
    logout,
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
