import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const pageMeta = {
  '/': { title: 'لوحة التحكم', subtitle: 'نظرة عامة على أداء المنصة' },
  '/vendors': { title: 'إدارة التجار', subtitle: 'قائمة بجميع التجار المسجلين في النظام' },
  '/orders': { title: 'طلبات المتجر', subtitle: 'مراجعة الطلبات وتوجيهها للتاجر وتسجيل الشحن' },
  '/pending-products': {
    title: 'مراجعة المنتجات',
    subtitle: 'المنتجات الجديدة بانتظار موافقة الإدارة',
  },
  '/active-products': {
    title: 'منتجات قديمة',
    subtitle: 'المنتجات المنشورة التي مر عليها أكثر من شهر',
  },
  '/commissions': {
    title: 'إدارة العمولات',
    subtitle: 'التحكم في نسب عمولة المنصة لكل تاجر',
  },
  '/settlements': {
    title: 'السدادات المالية',
    subtitle: 'سندات القبض والصرف للتجار',
  },
  '/employees': { title: 'إدارة الموظفين', subtitle: 'حسابات الموظفين وصلاحيات المحافظات' },
}

export default function Layout({ children, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const meta =
    pageMeta[location.pathname] ||
    Object.entries(pageMeta).find(([key]) => location.pathname.startsWith(key + '/'))?.[1] ||
    { title: 'لوحة التحكم', subtitle: '' }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          title={meta.title}
          subtitle={meta.subtitle}
          user={user}
          onLogout={onLogout}
        />
        <main className="flex-1 p-4 lg:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  )
}
