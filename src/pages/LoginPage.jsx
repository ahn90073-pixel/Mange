import { useState } from 'react'
import { LoaderCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'

export default function LoginPage({ onLogin, onGoogleLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

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

  const signInGoogle = async () => {
    setError('')
    setGoogleSubmitting(true)
    try {
      await onGoogleLogin()
    } catch (loginError) {
      setError(loginError.message || 'تعذر تسجيل الدخول باستخدام Google.')
    } finally {
      setGoogleSubmitting(false)
    }
  }

  const busy = submitting || googleSubmitting

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#102b4a] via-[#183e66] to-[#0b1e34] px-4 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-gradient-to-l from-primary-700 to-primary-900 px-7 py-8 text-white">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"><ShieldCheck size={28} /></div>
          <h1 className="text-2xl font-bold">منصة التجار</h1>
          <p className="mt-2 text-sm text-white/75">سجّل الدخول إلى لوحة الإدارة الآمنة</p>
        </div>
        <div className="space-y-5 p-7">
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error}</p>}
          <div>
            <button type="button" onClick={signInGoogle} disabled={busy} className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 disabled:cursor-wait disabled:opacity-60">
              {googleSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <GoogleMark />}
              {googleSubmitting ? 'جارٍ التحقق من حساب Google...' : 'تسجيل دخول الأدمن باستخدام Google'}
            </button>
            <p className="mt-2 text-center text-xs leading-5 text-neutral-500">متاح لعناوين Gmail المعتمدة للأدمن فقط (بحد أقصى 3 حسابات).</p>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-400"><span className="h-px flex-1 bg-neutral-200" /><span>دخول الموظفين</span><span className="h-px flex-1 bg-neutral-200" /></div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-neutral-700">البريد الإلكتروني</span>
              <span className="relative block"><Mail size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input className="input pr-10" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" dir="ltr" /></span>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-neutral-700">كلمة المرور</span>
              <span className="relative block"><LockKeyhole size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input className="input pr-10" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••••••" dir="ltr" /></span>
            </label>
            <button type="submit" disabled={busy} className="btn-primary w-full py-3 disabled:cursor-wait disabled:opacity-60">{submitting ? <LoaderCircle size={18} className="animate-spin" /> : <LockKeyhole size={18} />}{submitting ? 'جارٍ التحقق...' : 'دخول الموظف'}</button>
          </form>
        </div>
      </section>
    </main>
  )
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" className="h-[18px] w-[18px]"><path fill="#FFC107" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.7c3.9-3.6 6-8.8 6-14.9Z" /><path fill="#FF3D00" d="M24 44c5.5 0 10.1-1.8 13.5-4.7l-6.7-5c-1.8 1.2-4 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.2A20 20 0 0 0 24 44Z" /><path fill="#4CAF50" d="M12.8 28a12 12 0 0 1 0-7.9v-5.2H5.9a20 20 0 0 0 0 18.3l6.9-5.2Z" /><path fill="#1976D2" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.8 29.5 4 24 4A20 20 0 0 0 5.9 14.9l6.9 5.2C14.4 15.4 18.8 11.9 24 11.9Z" /></svg>
}
