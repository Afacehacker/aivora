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
        <label className="text-sm font-medium text-slate-700">
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
            'w-full rounded-xl bg-white border transition-all duration-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2',
            'py-3 px-4',
            Icon && 'pl-10',
            IconRight && 'pr-10',
            error
              ? 'border-red-400 focus:ring-red-400/30'
              : 'border-pink-200 focus:ring-pink-400/30 focus:border-pink-500 shadow-sm',
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
