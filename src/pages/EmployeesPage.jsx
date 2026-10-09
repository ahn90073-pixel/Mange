import { useCallback, useEffect, useState } from 'react'
import { Check, LoaderCircle, UserPlus, Users, X } from 'lucide-react'
import { adminApi } from '../api/client'
import { EGYPT_GOVERNORATES } from '../data/egyptGovernorates'
import { useDashboard } from '../context/DashboardContext'

const emptyForm = { fullName: '', email: '', password: '', assignedGovernorates: [] }

export default function EmployeesPage() {
  const { showToast } = useDashboard()
  const [form, setForm] = useState(emptyForm)
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminApi.employees()
      setEmployees(result?.items || [])
    } catch (error) {
      showToast('error', error.message || 'تعذر تحميل الموظفين.')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { void loadEmployees() }, [loadEmployees])

  const toggleGovernorate = (governorate) => {
    setForm((current) => ({
      ...current,
      assignedGovernorates: current.assignedGovernorates.includes(governorate)
        ? current.assignedGovernorates.filter((value) => value !== governorate)
        : [...current.assignedGovernorates, governorate],
    }))
  }

  const createEmployee = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await adminApi.createEmployee(form)
      showToast('success', 'تم إنشاء حساب الموظف بنجاح.')
      setForm(emptyForm)
      await loadEmployees()
    } catch (error) {
      showToast('error', error.message || 'تعذر إنشاء حساب الموظف.')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (employee) => {
    try {
      await adminApi.updateEmployeeStatus(employee.id, !employee.is_active)
      showToast('success', employee.is_active ? 'تم إيقاف حساب الموظف.' : 'تم تفعيل حساب الموظف.')
      await loadEmployees()
    } catch (error) {
      showToast('error', error.message || 'تعذر تغيير حالة الحساب.')
    }
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div><h2 className="text-xl font-bold text-neutral-900">إدارة الموظفين</h2><p className="mt-1 text-sm text-neutral-500">أنشئ حسابًا وحدد المحافظات التي يسمح للموظف بالوصول إليها.</p></div>

      <form onSubmit={createEmployee} className="card space-y-5 p-5 sm:p-7">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><UserPlus size={21} /></div><div><h3 className="font-bold text-neutral-900">إضافة موظف جديد</h3><p className="mt-1 text-xs text-neutral-500">كلمة المرور لا تقل عن 12 حرفًا.</p></div></div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1.5"><span className="text-sm font-semibold text-neutral-700">الاسم</span><input className="input" required minLength={2} maxLength={160} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} autoComplete="name" /></label>
          <label className="space-y-1.5"><span className="text-sm font-semibold text-neutral-700">البريد الإلكتروني</span><input className="input" type="email" required maxLength={254} dir="ltr" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" /></label>
          <label className="space-y-1.5"><span className="text-sm font-semibold text-neutral-700">كلمة المرور المؤقتة</span><input className="input" type="password" required minLength={12} maxLength={1024} dir="ltr" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" /></label>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-neutral-700">المحافظات المسموح بها <span className="font-normal text-neutral-500">(اختر واحدة على الأقل)</span></legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {EGYPT_GOVERNORATES.map((governorate) => {
              const checked = form.assignedGovernorates.includes(governorate)
              return <label key={governorate} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${checked ? 'border-primary-300 bg-primary-50 text-primary-800' : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'}`}>
                <input className="h-4 w-4 accent-primary-600" type="checkbox" checked={checked} onChange={() => toggleGovernorate(governorate)} />
                <span>{governorate}</span>
              </label>
            })}
          </div>
          <p className="mt-2 text-xs text-neutral-500">المحدد: {form.assignedGovernorates.length ? form.assignedGovernorates.join('، ') : 'لم تحدد محافظة بعد'}</p>
        </fieldset>
        <button type="submit" disabled={saving || form.assignedGovernorates.length === 0} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">{saving ? <LoaderCircle size={16} className="animate-spin" /> : <UserPlus size={16} />}{saving ? 'جارٍ إنشاء الحساب...' : 'إنشاء حساب الموظف'}</button>
      </form>

      <section className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4"><Users className="text-primary-600" size={20} /><div><h3 className="font-bold text-neutral-900">حسابات الموظفين</h3><p className="mt-1 text-xs text-neutral-500">تغيير الحالة يعطّل الجلسات القائمة فورًا.</p></div></div>
        {loading ? <div className="flex items-center justify-center gap-2 py-12 text-sm text-neutral-500"><LoaderCircle className="animate-spin" size={18} />جارٍ التحميل...</div> : employees.length === 0 ? <p className="py-12 text-center text-sm text-neutral-500">لا يوجد موظفون حتى الآن.</p> : (
          <div className="divide-y divide-neutral-100">
            {employees.map((employee) => <article key={employee.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><p className="font-semibold text-neutral-900">{employee.full_name}</p><p className="mt-1 text-sm text-neutral-500" dir="ltr">{employee.email}</p><div className="mt-2 flex flex-wrap gap-1.5">{employee.assigned_governorates.map((governorate) => <span key={governorate} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs text-primary-700">{governorate}</span>)}</div></div>
              <div className="flex items-center gap-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${employee.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>{employee.is_active ? <Check size={13} /> : <X size={13} />}{employee.is_active ? 'نشط' : 'موقوف'}</span><button type="button" onClick={() => toggleStatus(employee)} className={employee.is_active ? 'btn-secondary text-rose-700' : 'btn-secondary text-emerald-700'}>{employee.is_active ? 'إيقاف الحساب' : 'تفعيل الحساب'}</button></div>
            </article>)}
          </div>
        )}
      </section>
    </div>
  )
}
