import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Menu, Bell, Search, RefreshCw, X } from 'lucide-react'
import { checkAndroidOtaNow } from '../../utils/androidOta'

export default function TopBar({ onMenuClick, title, subtitle }) {
  const [otaResult, setOtaResult] = useState(null)
  const [checkingOta, setCheckingOta] = useState(false)
  const isAndroid = Capacitor.getPlatform() === 'android'
  const isDashboardTitle = title === 'لوحة التحكم'

  const handleOtaCheck = async () => {
    setCheckingOta(true)
    setOtaResult({ status: 'checking', message: 'جارٍ فحص GitHub والتحديث...' })
    try {
      setOtaResult(await checkAndroidOtaNow())
    } catch (error) {
      setOtaResult({
        status: 'error',
        message: 'تعذر تشغيل فحص التحديث.',
        details: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setCheckingOta(false)
    }
  }

  const panelTone = ['downloaded', 'pending', 'up-to-date'].includes(otaResult?.status)
    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
    : ['checking'].includes(otaResult?.status)
      ? 'border-sky-200 bg-sky-50 text-sky-950'
      : ['release-missing', 'asset-missing', 'recent-check', 'retry-wait'].includes(otaResult?.status)
        ? 'border-amber-200 bg-amber-50 text-amber-950'
        : 'border-rose-200 bg-rose-50 text-rose-950'

  return (
    <header className="sticky top-0 z-20 border-b border-amber-300/40 bg-gradient-to-l from-[#102b4a] via-[#183e66] to-[#102b4a] text-white shadow-lg">
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
            <h2
              className={`inline-block max-w-full truncate rounded-md px-2 py-0.5 text-lg font-bold drop-shadow-sm ${isDashboardTitle ? 'bg-sky-400/20 text-sky-200 ring-1 ring-sky-300/35' : 'text-white'}`}
            >
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

        {/* OTA diagnostics + notifications + admin */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isAndroid && (
            <div className="relative">
              <button
                type="button"
                onClick={handleOtaCheck}
                disabled={checkingOta}
                title="فحص وتشخيص تحديث التطبيق"
                aria-label="فحص وتشخيص تحديث OTA"
                className="flex items-center gap-1.5 rounded-lg border border-amber-200/40 bg-white/10 px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 disabled:cursor-wait disabled:opacity-75 sm:px-3 sm:text-sm"
              >
                <RefreshCw size={15} className={checkingOta ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">فحص التحديث</span>
              </button>

              {otaResult && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`absolute left-0 top-full z-50 mt-3 w-[min(88vw,22rem)] rounded-xl border p-4 shadow-2xl ${panelTone}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold">تشخيص تحديث OTA</p>
                    <button
                      type="button"
                      onClick={() => setOtaResult(null)}
                      aria-label="إغلاق التشخيص"
                      className="rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-sm leading-6">{otaResult.message}</p>
                  {otaResult.details && (
                    <p dir="rtl" className="mt-2 break-words rounded-lg bg-white/70 p-2 text-xs leading-5 opacity-85">
                      {otaResult.details}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleOtaCheck}
                    disabled={checkingOta}
                    className="mt-3 rounded-lg bg-[#102b4a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#183e66] disabled:opacity-60"
                  >
                    إعادة الفحص الآن
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            aria-label="الإشعارات"
            className="relative rounded-xl p-2.5 text-white/85 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Bell size={20} />
            <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-rose-400 ring-2 ring-[#15375c]" />
          </button>

          <div className="hidden items-center gap-2.5 border-r border-white/20 pr-3 sm:flex">
            <div className="text-left">
              <p className="text-sm font-semibold text-white">إدارة المنصة</p>
              <p className="text-xs text-slate-200/70">وصول عام بلا تسجيل دخول</p>
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
