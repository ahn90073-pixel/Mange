import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import { useEffect } from 'react'

const config = {
  success: { icon: CheckCircle2, bg: 'bg-success-600', text: 'text-white' },
  error: { icon: XCircle, bg: 'bg-danger-600', text: 'text-white' },
  warning: { icon: AlertTriangle, bg: 'bg-warning-600', text: 'text-white' },
  info: { icon: Info, bg: 'bg-primary-600', text: 'text-white' },
}

export default function Toast({ type = 'success', message, onClose, duration = 3000 }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [message, onClose, duration])

  if (!message) return null

  const c = config[type] || config.success
  const Icon = c.icon

  return (
    <div className="fixed bottom-6 left-6 z-[60] animate-fade-in-up">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg ${c.bg} ${c.text}`}
      >
        <Icon size={20} />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}
