import { useState } from 'react'
import { LoaderCircle, LockKeyhole, Mail, ShieldCheck, UserRound, KeyRound } from 'lucide-react'
import { firebaseAuthErrorMessage } from '../firebase/auth'

export default function LoginPage({ onAdminLogin, onEmployeeLogin, onAdminPasswordReset }) {
  const [mode, setMode] = useState('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      if (mode === 'admin') await onAdminLogin({ email: email.trim(), password })
      else await onEmployeeLogin({ email: email.trim(), password })
    } catch (loginError) {
      setError(mode === 'admin' ? firebaseAuthErrorMessage(loginError) : (loginError.message || 'تعذر تسجيل الدخول. تحقق من بياناتك.'))
    } finally {
      setSubmitting(false)
    }
  }

  const resetPassword = async () => {
    setError('')
    setNotice('')
    if (!email.trim()) {
      setError('أدخل بريدك الإلكتروني أولًا لإرسال رابط الاستعادة.')
      return
    }
    setSubmitting(true)
    try {
      await onAdminPasswordReset(email.trim())
      setNotice('إذا كان البريد مسجلًا في Firebase، فسيصلك رابط إعادة تعيين كلمة المرور.')
    } catch (resetError) {
      setError(firebaseAuthErrorMessage(resetError))
    } finally {
      setSubmitting(false)
    }
  }

  const selectMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setNotice('')
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#102b4a] via-[#183e66] to-[#0b1e34] px-4 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-gradient-to-l from-primary-700 to-primary-900 px-7 py-8 text-white">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"><ShieldCheck size={28} /></div>
          <h1 className="text-2xl font-bold">منصة التجار</h1>
          <p className="mt-2 text-sm text-white/75">دخول آمن للوحة إدارة المتاجر</p>
        </div>

        <div className="grid grid-cols-2 gap-2 px-7 pt-6" role="tablist" aria-label="نوع الحساب">
          <button type="button" role="tab" aria-selected={mode === 'admin'} onClick={() => selectMode('admin')} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${mode === 'admin' ? 'bg-primary-50 text-primary-800 ring-1 ring-primary-200' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <ShieldCheck size={17} /> الأدمن العام
          </button>
          <button type="button" role="tab" aria-selected={mode === 'employee'} onClick={() => selectMode('employee')} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${mode === 'employee' ? 'bg-primary-50 text-primary-800 ring-1 ring-primary-200' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            <UserRound size={17} /> الموظف
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-7 pt-5">
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error}</p>}
          {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">{notice}</p>}
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-neutral-700">البريد الإلكتروني</span>
            <span className="relative block"><Mail size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input className="input pr-10" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" dir="ltr" /></span>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-neutral-700">كلمة المرور</span>
            <span className="relative block"><LockKeyhole size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input className="input pr-10" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••••••" dir="ltr" /></span>
          </label>
          <button type="submit" disabled={submitting} className="btn-primary w-full py-3 disabled:cursor-wait disabled:opacity-60">{submitting ? <LoaderCircle size={18} className="animate-spin" /> : mode === 'admin' ? <ShieldCheck size={18} /> : <KeyRound size={18} />}{submitting ? 'جارٍ التحقق...' : mode === 'admin' ? 'دخول الأدمن عبر Firebase' : 'تسجيل دخول الموظف'}</button>
          {mode === 'admin' ? (
            <button type="button" disabled={submitting} onClick={resetPassword} className="w-full text-center text-sm font-semibold text-primary-700 hover:text-primary-900 disabled:opacity-50">نسيت كلمة المرور؟ أرسل رابط استعادة</button>
          ) : null}
          <p className="text-center text-xs leading-5 text-neutral-500">{mode === 'admin' ? 'يجب أن يكون البريد موثقًا ومصرحًا به للأدمن في النظام.' : 'يُسمح بدخول الموظفين النشطين الذين أنشأهم الأدمن العام فقط.'}</p>
        </form>
      </section>
    </main>
  )
}
