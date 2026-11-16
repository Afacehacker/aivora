import { clsx } from 'clsx'

const colorMap = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  error: 'bg-rose-50 text-rose-700 border border-rose-200',
  info: 'bg-pink-50 text-pink-700 border border-pink-200',
  purple: 'bg-rose-50 text-rose-700 border border-rose-200',
  indigo: 'bg-pink-50 text-pink-700 border border-pink-200',
  cyan: 'bg-pink-100/70 text-pink-800 border border-pink-300/60',
  default: 'bg-white text-slate-700 border border-pink-200 shadow-sm',
}

export default function Badge({ children, color = 'default', className = '' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
        colorMap[color] || colorMap.default,
        className
      )}
    >
      {children}
    </span>
  )
}
