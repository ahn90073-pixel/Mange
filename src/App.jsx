import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { DashboardProvider, useDashboard } from './context/DashboardContext'
import DashboardPage from './pages/DashboardPage'
import VendorsListPage from './pages/VendorsListPage'
import VendorDetailPage from './pages/VendorDetailPage'
import PendingProductsPage from './pages/PendingProductsPage'
import CommissionsPage from './pages/CommissionsPage'
import SettlementsPage from './pages/SettlementsPage'
import Toast from './components/ui/Toast'

function AppRoutes() {
  const { toast, hideToast } = useDashboard()

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/vendors" element={<VendorsListPage />} />
          <Route path="/vendors/:id" element={<VendorDetailPage />} />
          <Route path="/pending-products" element={<PendingProductsPage />} />
          <Route path="/commissions" element={<CommissionsPage />} />
          <Route path="/settlements" element={<SettlementsPage />} />
        </Routes>
      </Layout>
      <Toast
        type={toast?.type}
        message={toast?.message}
        onClose={hideToast}
      />
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
