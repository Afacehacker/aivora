import { clsx } from 'clsx'

const colorMap = {
  success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  error: 'bg-red-500/20 text-red-400 border border-red-500/30',
  info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  indigo: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  default: 'bg-white/10 text-slate-300 border border-white/10',
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
