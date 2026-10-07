import { Menu, Bell, Search } from 'lucide-react'
import { adminInfo } from '../../data/mockData'

export default function TopBar({ onMenuClick, title, subtitle }) {
  return (
    <header className="sticky top-0 z-20 overflow-hidden border-b border-amber-300/40 bg-gradient-to-l from-[#102b4a] via-[#183e66] to-[#102b4a] text-white shadow-lg">
      <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-8">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          aria-label="فتح القائمة"
          className="rounded-lg p-2 text-white/85 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
        >
          <Menu size={22} />
        </button>

        {/* Title */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.8)]" />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-white drop-shadow-sm">
              {title}
            </h2>
            {subtitle && (
              <p className="truncate text-sm text-slate-200/80">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative hidden items-center md:flex">
          <Search
            size={18}
            className="pointer-events-none absolute right-3 text-white/60"
          />
          <input
            type="text"
            placeholder="بحث..."
            aria-label="بحث"
            className="w-64 rounded-xl border border-white/20 bg-white/10 py-2.5 pr-10 pl-3.5 text-sm text-white placeholder:text-white/60 transition-colors focus:border-amber-300 focus:ring-2 focus:ring-amber-200/20"
          />
        </div>

        {/* Notifications + Admin */}
        <div className="flex items-center gap-3">
          <button
            aria-label="الإشعارات"
            className="relative rounded-xl p-2.5 text-white/85 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Bell size={20} />
            <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-rose-400 ring-2 ring-[#15375c]" />
          </button>

          <div className="hidden items-center gap-2.5 border-r border-white/20 pr-3 sm:flex">
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{adminInfo.adminName}</p>
              <p className="text-xs text-slate-200/70">{adminInfo.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-300 text-sm font-bold text-[#102b4a] ring-2 ring-white/20">
              م
            </div>
          </div>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
    </header>
  )
}
