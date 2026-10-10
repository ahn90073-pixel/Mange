import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { LoaderCircle, RefreshCw } from 'lucide-react'
import Layout from './components/layout/Layout'
import { DashboardProvider, useDashboard } from './context/DashboardContext'
import { adminApi, getSessionToken, setSessionToken } from './api/client'
import LoginPage from './pages/LoginPage'
import { sendFirebaseAdminPasswordReset, signInFirebaseAdmin, signOutFirebaseAdmin } from './firebase/auth'
import EmployeesPage from './pages/EmployeesPage'
import DashboardPage from './pages/DashboardPage'
import VendorsListPage from './pages/VendorsListPage'
import VendorDetailPage from './pages/VendorDetailPage'
import OrdersPage from './pages/OrdersPage'
import PendingProductsPage from './pages/PendingProductsPage'
import ActiveProductsPage from './pages/ActiveProductsPage'
import CommissionsPage from './pages/CommissionsPage'
import SettlementsPage from './pages/SettlementsPage'
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

function LoadFailure({ error, onRetry }) {
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <section className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-7 text-center shadow-card">
        <h1 className="text-lg font-bold text-neutral-900">تعذر تحميل بيانات الإدارة</h1>
        <p role="alert" className="mt-3 text-sm leading-6 text-neutral-600">{error}</p>
        <button type="button" onClick={onRetry} className="btn-primary mt-6">
          <RefreshCw size={16} /> إعادة المحاولة
        </button>
      </section>
    </main>
  )
}

function AppRoutes({ user, onLogout }) {
  const { toast, hideToast, loading, dataReady, loadError, refresh } = useDashboard()
  const location = useLocation()
  const navigate = useNavigate()
  const superAdminPage = (element) => user.role === 'super_admin' ? element : <Navigate to="/" replace />

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
    content = <LoadingScreen label="جارٍ تحميل بيانات لوحة الإدارة..." />
  } else if (!dataReady && loadError) {
    content = <LoadFailure error={loadError} onRetry={refresh} />
  } else if (!dataReady) {
    content = <LoadingScreen label="جارٍ تجهيز لوحة الإدارة..." />
  } else {
    content = (
      <Layout user={user} onLogout={onLogout}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/vendors" element={<VendorsListPage />} />
          <Route path="/vendors/:id" element={<VendorDetailPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/pending-products" element={superAdminPage(<PendingProductsPage />)} />
          <Route path="/active-products" element={superAdminPage(<ActiveProductsPage />)} />
          <Route path="/commissions" element={superAdminPage(<CommissionsPage />)} />
          <Route path="/settlements" element={superAdminPage(<SettlementsPage />)} />
          <Route path="/employees" element={superAdminPage(<EmployeesPage />)} />
          <Route path="*" element={<DashboardPage />} />
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

  useEffect(() => {
    let active = true
    const onExpired = () => {
      setSessionToken('')
      setUser(null)
      setCheckingSession(false)
    }
    window.addEventListener('mange:auth-expired', onExpired)

    const token = getSessionToken()
    if (!token) {
      setCheckingSession(false)
    } else {
      adminApi.me()
        .then((currentUser) => { if (active) setUser(currentUser) })
        .catch(() => { if (active) setSessionToken('') })
        .finally(() => { if (active) setCheckingSession(false) })
    }
    return () => {
      active = false
      window.removeEventListener('mange:auth-expired', onExpired)
    }
  }, [])

  const loginEmployee = useCallback(async (credentials) => {
    const session = await adminApi.login(credentials)
    setSessionToken(session.token)
    setUser(session.user)
  }, [])

  const loginAdmin = useCallback(async ({ email, password }) => {
    const idToken = await signInFirebaseAdmin(email, password)
    try {
      const session = await adminApi.firebaseLogin(idToken)
      setSessionToken(session.token)
      setUser(session.user)
    } catch (error) {
      await signOutFirebaseAdmin().catch(() => {})
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try { await adminApi.logout() } catch { /* Expired sessions are cleared locally as well. */ }
    await signOutFirebaseAdmin().catch(() => {})
    setSessionToken('')
    setUser(null)
  }, [])

  if (checkingSession) return <LoadingScreen label="جارٍ التحقق من جلسة الدخول..." />
  if (!user) return <LoginPage onAdminLogin={loginAdmin} onEmployeeLogin={loginEmployee} onAdminPasswordReset={sendFirebaseAdminPasswordReset} />
  return <DashboardProvider user={user}><AppRoutes user={user} onLogout={logout} /></DashboardProvider>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthenticatedApp />
    </BrowserRouter>
  )
}
