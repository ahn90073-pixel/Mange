import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LoaderCircle, RefreshCw, LogOut } from 'lucide-react'
import Layout from './components/layout/Layout'
import { DashboardProvider, useDashboard } from './context/DashboardContext'
import DashboardPage from './pages/DashboardPage'
import VendorsListPage from './pages/VendorsListPage'
import VendorDetailPage from './pages/VendorDetailPage'
import PendingProductsPage from './pages/PendingProductsPage'
import ActiveProductsPage from './pages/ActiveProductsPage'
import CommissionsPage from './pages/CommissionsPage'
import SettlementsPage from './pages/SettlementsPage'
import LoginPage from './pages/LoginPage'
import Toast from './components/ui/Toast'

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

function LoadFailure({ error, onRetry, onLogout }) {
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <section className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-7 text-center shadow-card">
        <h1 className="text-lg font-bold text-neutral-900">تعذر تحميل بيانات الإدارة</h1>
        <p role="alert" className="mt-3 text-sm leading-6 text-neutral-600">{error}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onRetry} className="btn-primary">
            <RefreshCw size={16} /> إعادة المحاولة
          </button>
          <button type="button" onClick={onLogout} className="btn-secondary">
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </section>
    </main>
  )
}

function AppRoutes() {
  const {
    toast,
    hideToast,
    authInitializing,
    authMessage,
    user,
    login,
    logout,
    loading,
    dataReady,
    loadError,
    refresh,
  } = useDashboard()

  let content
  if (authInitializing) {
    content = <LoadingScreen label="جارٍ التحقق من جلسة الإدارة..." />
  } else if (!user) {
    content = <LoginPage key={authMessage} onLogin={login} message={authMessage} />
  } else if (!dataReady && loading) {
    content = <LoadingScreen label="جارٍ تحميل بيانات لوحة الإدارة..." />
  } else if (!dataReady && loadError) {
    content = <LoadFailure error={loadError} onRetry={refresh} onLogout={logout} />
  } else if (!dataReady) {
    content = <LoadingScreen label="جارٍ تجهيز لوحة الإدارة..." />
  } else {
    content = (
      <Layout user={user} onLogout={logout}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/vendors" element={<VendorsListPage />} />
          <Route path="/vendors/:id" element={<VendorDetailPage />} />
          <Route path="/pending-products" element={<PendingProductsPage />} />
          <Route path="/active-products" element={<ActiveProductsPage />} />
          <Route path="/commissions" element={<CommissionsPage />} />
          <Route path="/settlements" element={<SettlementsPage />} />
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

export default function App() {
  return (
    <BrowserRouter>
      <DashboardProvider>
        <AppRoutes />
      </DashboardProvider>
    </BrowserRouter>
  )
}
