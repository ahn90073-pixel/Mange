import { useState } from 'react'
import { LoaderCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await onLogin({ email: email.trim(), password })
    } catch (loginError) {
      setError(loginError.message || 'تعذر تسجيل الدخول. تحقق من بياناتك.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#102b4a] via-[#183e66] to-[#0b1e34] px-4 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-gradient-to-l from-primary-700 to-primary-900 px-7 py-8 text-white">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"><ShieldCheck size={28} /></div>
          <h1 className="text-2xl font-bold">منصة التجار</h1>
          <p className="mt-2 text-sm text-white/75">سجّل الدخول إلى لوحة الإدارة الآمنة</p>
        </div>
        <form onSubmit={submit} className="space-y-5 p-7">
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error}</p>}
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-neutral-700">البريد الإلكتروني</span>
            <span className="relative block"><Mail size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input className="input pr-10" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" dir="ltr" /></span>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-neutral-700">كلمة المرور</span>
            <span className="relative block"><LockKeyhole size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input className="input pr-10" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••••••" dir="ltr" /></span>
          </label>
          <button type="submit" disabled={submitting} className="btn-primary w-full py-3 disabled:cursor-wait disabled:opacity-60">{submitting ? <LoaderCircle size={18} className="animate-spin" /> : <LockKeyhole size={18} />}{submitting ? 'جارٍ التحقق...' : 'تسجيل الدخول'}</button>
          <p className="text-center text-xs leading-5 text-neutral-500">يُسمح بالدخول للحسابات التي أنشأها الأدمن العام فقط.</p>
        </form>
      </section>
    </main>
  )
}
