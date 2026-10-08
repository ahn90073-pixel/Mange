import { useState } from 'react'
import { KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Store } from 'lucide-react'

export default function LoginPage({ onLogin, message = '' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(message)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await onLogin(email, password)
    } catch (loginError) {
      setError(loginError.message || 'تعذر تسجيل الدخول. حاول مرة أخرى.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50 px-4 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl">
        <div className="bg-gradient-to-l from-[#102b4a] via-[#183e66] to-[#102b4a] px-8 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300 text-[#102b4a]">
            <Store size={27} />
          </div>
          <h1 className="text-2xl font-bold">منصة التجار</h1>
          <p className="mt-2 text-sm text-slate-200">تسجيل دخول إدارة المنصة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-7 sm:p-8">
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-900">
            <ShieldCheck size={19} className="mt-0.5 shrink-0" />
            <p>الدخول متاح للحسابات المعيّنة كمدير للمنصة فقط.</p>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold text-neutral-700">البريد الإلكتروني</label>
            <div className="relative">
              <Mail size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="input pr-10"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-neutral-700">كلمة المرور</label>
            <div className="relative">
              <LockKeyhole size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={256}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="أدخل كلمة المرور"
                className="input pr-10"
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base disabled:cursor-wait disabled:opacity-70">
            {submitting ? <LoaderCircle size={19} className="animate-spin" /> : <KeyRound size={19} />}
            {submitting ? 'جارٍ التحقق...' : 'دخول إلى لوحة الإدارة'}
          </button>
          <p className="text-center text-xs leading-5 text-neutral-400">تتم المصادقة والتحقق من صلاحية الإدارة عبر الخادم.</p>
        </form>
      </section>
    </main>
  )
}
