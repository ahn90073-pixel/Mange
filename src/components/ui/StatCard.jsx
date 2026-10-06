import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({
  title,
  value,
  icon: Icon,
  color = 'primary',
  trend,
  trendLabel,
}) {
  const colorMap = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-600', icon: 'bg-primary-600' },
    success: { bg: 'bg-success-50', text: 'text-success-600', icon: 'bg-success-600' },
    warning: { bg: 'bg-warning-50', text: 'text-warning-600', icon: 'bg-warning-600' },
    danger: { bg: 'bg-danger-50', text: 'text-danger-600', icon: 'bg-danger-600' },
    neutral: { bg: 'bg-neutral-100', text: 'text-neutral-600', icon: 'bg-neutral-600' },
  }
  const c = colorMap[color] || colorMap.primary

  return (
    <div className="card p-5 hover:shadow-card-hover transition-shadow duration-300">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center text-white`}
        >
          <Icon size={24} />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trend >= 0 ? 'text-success-600' : 'text-danger-600'
            }`}
          >
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-sm text-neutral-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      {trendLabel && <p className="text-xs text-neutral-400 mt-2">{trendLabel}</p>}
    </div>
  )
}
