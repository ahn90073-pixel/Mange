import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  PackageCheck,
  PackageX,
  Percent,
  Receipt,
  LogOut,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'لوحة المعلومات', icon: LayoutDashboard, end: true },
  { to: '/vendors', label: 'إدارة التجار', icon: Store },
  { to: '/pending-products', label: 'مراجعة المنتجات', icon: PackageCheck },
  { to: '/active-products', label: 'منتجات قديمة', icon: PackageX },
  { to: '/commissions', label: 'إدارة العمولات', icon: Percent },
  { to: '/settlements', label: 'السدادات المالية', icon: Receipt },
]

export default function Sidebar({ open, onClose, user, onLogout }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-neutral-900/50 z-30 lg:hidden modal-overlay"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 right-0 z-40
          w-72 h-screen flex-shrink-0
          bg-neutral-900 text-neutral-300
          flex flex-col
          transition-transform duration-300
          ${open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
              م
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">
                منصة التجار
              </h1>
              <p className="text-neutral-400 text-xs">لوحة تحكم الإدارة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-neutral-400 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`
                }
              >
                <Icon size={20} className="flex-shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Admin info */}
        <div className="px-3 py-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-neutral-800/50">
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
              م
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.fullName || user?.email || 'مدير المنصة'}
              </p>
              <p className="text-neutral-400 text-xs truncate">
                مدير المنصة
              </p>
            </div>
            <button onClick={onLogout} aria-label="تسجيل الخروج" title="تسجيل الخروج" className="text-neutral-400 hover:text-danger-500 transition-colors p-1">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
