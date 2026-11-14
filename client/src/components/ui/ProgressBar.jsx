import { clsx } from 'clsx'

export default function ProgressBar({ value = 0, max = 100, className = '', showLabel = false, color = 'indigo' }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  const colors = {
    indigo: 'from-aivora-indigo to-aivora-purple',
    cyan: 'from-aivora-cyan to-aivora-indigo',
    green: 'from-emerald-500 to-teal-500',
  }
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colors[color] || colors.indigo} rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-400 w-10 text-right">{Math.round(percent)}%</span>
      )}
    </div>
  )
}
