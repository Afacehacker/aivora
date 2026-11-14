import { forwardRef } from 'react'
import { clsx } from 'clsx'

const Input = forwardRef(function Input(
  {
    label,
    error,
    icon: Icon,
    iconRight: IconRight,
    className = '',
    containerClassName = '',
    type = 'text',
    hint,
    ...props
  },
  ref
) {
  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={clsx(
            'w-full rounded-xl bg-aivora-navy border transition-all duration-200 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2',
            'py-3 px-4',
            Icon && 'pl-10',
            IconRight && 'pr-10',
            error
              ? 'border-red-500/50 focus:ring-red-500/30'
              : 'border-white/10 focus:ring-aivora-indigo/30 focus:border-aivora-indigo/50',
            className
          )}
          {...props}
        />
        {IconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IconRight className="w-4 h-4" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
})

export default Input
