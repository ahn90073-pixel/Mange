import { Menu, Bell, Search } from 'lucide-react'
import { adminInfo } from '../../data/mockData'

export default function TopBar({ onMenuClick, title, subtitle }) {
  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-neutral-200">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4 gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
        >
          <Menu size={22} />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-neutral-900 truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-neutral-500 truncate">{subtitle}</p>
          )}
        </div>

        {/* Search */}
        <div className="hidden md:flex items-center relative">
          <Search
            size={18}
            className="absolute right-3 text-neutral-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="بحث..."
            className="input pr-10 w-64"
          />
        </div>

        {/* Notifications + Admin */}
        <div className="flex items-center gap-3">
          <button className="relative p-2.5 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 left-2 w-2 h-2 bg-danger-500 rounded-full"></span>
          </button>

          <div className="hidden sm:flex items-center gap-2.5 pr-3 border-r border-neutral-200">
            <div className="text-left">
              <p className="text-sm font-semibold text-neutral-800">
                {adminInfo.adminName}
              </p>
              <p className="text-xs text-neutral-500">{adminInfo.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
              م
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
