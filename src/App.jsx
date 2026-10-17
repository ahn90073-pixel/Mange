import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react'
import Layout from './components/layout/Layout'
import { DashboardProvider, useDashboard } from './context/DashboardContext'
import { adminApi, getSessionToken, setSessionToken } from './api/client'
import { initializeAdminCache, readCachedAdminUser, saveCachedAdminUser, setAdminCacheScope } from './lib/adminLocalCache'
import { signInWithGoogle, signOutGoogle } from './lib/firebase'
import LoginPage from './pages/LoginPage'
import EmployeesPage from './pages/EmployeesPage'
import StoreRequestsPage from './pages/StoreRequestsPage'
import DashboardPage from './pages/DashboardPage'
import VendorsListPage from './pages/VendorsListPage'
import VendorDetailPage from './pages/VendorDetailPage'
import OrdersPage from './pages/OrdersPage'
import PendingProductsPage from './pages/PendingProductsPage'
import ActiveProductsPage from './pages/ActiveProductsPage'
import EmployeeProductsDashboard from './pages/EmployeeProductsDashboard'
import CommissionsPage from './pages/CommissionsPage'
import SettlementsPage from './pages/SettlementsPage'
import NotificationsPage from './pages/NotificationsPage'
import Toast from './components/ui/Toast'
import { exitAndroidApp, registerAndroidBackButton } from './utils/androidBackButton'

function LoadingScreen({ label }) {
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 text-neutral-700 shadow-card">
        <LoaderCircle size={21} className="animate-spin text-primary-600" />
        <span>{label}</span>
      </div>
    </main>
  )
}

function StartupSplash() {
  return (
    <main className="app-splash" dir="rtl" aria-label="Mange">
      <div className="app-splash-brand">
        <div className="app-splash-mark"><ShieldCheck size={30} strokeWidth={1.8} /></div>
        <span className="app-splash-name">Mange</span>
      </div>
    </main>
  )
}

function LoadFailure({ error, onRetry }) {
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <section className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-7 text-center shadow-card">
        <h1 className="text-lg font-bold text-neutral-900">تعذر تحميل بيانات الإدارة</h1>
        <p role="alert" className="mt-3 text-sm leading-6 text-neutral-600">{error}</p>
        <button type="button" onClick={onRetry} className="btn-primary mt-6"><RefreshCw size={16} />إعادة المحاولة</button>
      </section>
    </main>
  )
}

function SessionFailure({ error, onRetry }) {
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <section className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-7 text-center shadow-card">
        <h1 className="text-lg font-bold text-neutral-900">تعذر استعادة جلسة الإدارة</h1>
        <p role="alert" className="mt-3 text-sm leading-6 text-neutral-600">{error}</p>
        <button type="button" onClick={onRetry} className="btn-primary mt-6"><RefreshCw size={16} />إعادة المحاولة</button>
      </section>
    </main>
  )
}

function AppRoutes({ user, onLogout }) {
  const { toast, hideToast, loading, dataReady, loadError, refresh } = useDashboard()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    let removeListener = () => {}
    registerAndroidBackButton(() => {
      if (location.pathname !== '/') return navigate(-1)
      return exitAndroidApp()
    }).then((remove) => {
      if (active) removeListener = remove
      else remove()
    })
    return () => { active = false; removeListener() }
  }, [location.pathname, navigate])

  let content
  if (!dataReady && loading) {
    content = Capacitor.getPlatform() === 'android' ? <StartupSplash /> : <LoadingScreen label="جارٍ تحميل بيانات لوحة الإدارة..." />
  } else if (!dataReady && loadError) {
    content = <LoadFailure error={loadError} onRetry={refresh} />
  } else if (!dataReady) {
    content = Capacitor.getPlatform() === 'android' ? <StartupSplash /> : <LoadingScreen label="جارٍ تجهيز لوحة الإدارة..." />
  } else {
    content = (
      <Layout user={user} onLogout={onLogout}>
        <Routes>
          <Route path="/" element={user.role === 'super_admin' ? <DashboardPage /> : <Navigate to="/product-dashboard" replace />} />
          <Route path="/product-dashboard" element={user.role === 'employee' ? <EmployeeProductsDashboard /> : <Navigate to="/" replace />} />
          <Route path="/vendors" element={user.role === 'super_admin' ? <VendorsListPage /> : <Navigate to="/orders" replace />} />
          <Route path="/vendors/:id" element={user.role === 'super_admin' ? <VendorDetailPage /> : <Navigate to="/orders" replace />} />
          <Route path="/store-requests" element={user.role === 'super_admin' ? <StoreRequestsPage /> : <Navigate to="/orders" replace />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/pending-products" element={<PendingProductsPage />} />
          <Route path="/active-products" element={<ActiveProductsPage />} />
          <Route path="/commissions" element={user.role === 'super_admin' ? <CommissionsPage /> : <Navigate to="/orders" replace />} />
          <Route path="/settlements" element={user.role === 'super_admin' ? <SettlementsPage /> : <Navigate to="/orders" replace />} />
          <Route path="/notifications" element={user.role === 'super_admin' ? <NotificationsPage /> : <Navigate to="/orders" replace />} />
          <Route path="/employees" element={user.role === 'super_admin' ? <EmployeesPage /> : <Navigate to="/orders" replace />} />
          <Route path="*" element={<Navigate to={user.role === 'super_admin' ? '/' : '/product-dashboard'} replace />} />
        </Routes>
      </Layout>
    )
  }

  return (
    <>
      {content}
      <Toast type={toast?.type} message={toast?.message} onClose={hideToast} />
    </>
  )
}

function AuthenticatedApp() {
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const [restoreAttempt, setRestoreAttempt] = useState(0)
  const isAndroid = Capacitor.getPlatform() === 'android'
  const [splashElapsed, setSplashElapsed] = useState(!isAndroid)

  useEffect(() => {
    if (!isAndroid) return undefined
    const timer = window.setTimeout(() => setSplashElapsed(true), 1600)
    return () => window.clearTimeout(timer)
  }, [isAndroid])

  useEffect(() => {
    let active = true
    const onExpired = () => {
      setSessionToken('')
      setAdminCacheScope('')
      setUser(null)
      setSessionError('')
      setCheckingSession(false)
    }
    window.addEventListener('mange:auth-expired', onExpired)

    const restoreSession = async () => {
      setCheckingSession(true)
      setSessionError('')
      try {
        await initializeAdminCache()
        if (!getSessionToken()) return

        const cachedUser = await readCachedAdminUser()
        if (cachedUser) {
          setAdminCacheScope(cachedUser.id ?? cachedUser.uid ?? cachedUser.email)
          if (active) setUser(cachedUser)
          if (active) setCheckingSession(false)
          void adminApi.me()
            .then(async (currentUser) => {
              await saveCachedAdminUser(currentUser)
              if (active) setUser(currentUser)
            })
            .catch(() => {})
          return
        }

        const currentUser = await adminApi.me()
        await saveCachedAdminUser(currentUser)
        if (active) setUser(currentUser)
      } catch (error) {
        if (active && getSessionToken()) setSessionError(error.message || 'تعذر الاتصال بخادم الإدارة.')
      } finally {
        if (active) setCheckingSession(false)
      }
    }
    void restoreSession()

    return () => {
      active = false
      window.removeEventListener('mange:auth-expired', onExpired)
    }
  }, [restoreAttempt])

  const login = useCallback(async (credentials) => {
    const session = await adminApi.login(credentials)
    setSessionToken(session.token)
    await saveCachedAdminUser(session.user)
    setUser(session.user)
    setSessionError('')
  }, [])

  const loginGoogle = useCallback(async () => {
    const idToken = await signInWithGoogle()
    try {
      const session = await adminApi.googleLogin(idToken)
      setSessionToken(session.token)
      await saveCachedAdminUser(session.user)
      setUser(session.user)
      setSessionError('')
    } catch (error) {
      await signOutGoogle().catch(() => {})
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try { await adminApi.logout() } catch { /* Expired sessions are cleared locally as well. */ }
    await signOutGoogle().catch(() => {})
    setSessionToken('')
    setAdminCacheScope('')
    setUser(null)
    setSessionError('')
  }, [])

  if (checkingSession || !splashElapsed) return isAndroid ? <StartupSplash /> : <LoadingScreen label="جارٍ التحقق من جلسة الدخول..." />
  if (!user && sessionError) return <SessionFailure error={sessionError} onRetry={() => setRestoreAttempt((value) => value + 1)} />
  if (!user) return <LoginPage onLogin={login} onGoogleLogin={loginGoogle} />
  return <DashboardProvider user={user}><AppRoutes user={user} onLogout={logout} /></DashboardProvider>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthenticatedApp />
    </BrowserRouter>
  )
}
