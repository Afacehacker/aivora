import { forwardRef } from 'react'
import { clsx } from 'clsx'

const Select = forwardRef(function Select(
  { label, error, className = '', containerClassName = '', children, ...props },
  ref
) {
  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-slate-300">{label}</label>
      )}
      <select
        ref={ref}
        className={clsx(
          'w-full rounded-xl bg-aivora-navy border py-3 px-4 text-white focus:outline-none focus:ring-2 transition-all duration-200 appearance-none',
          error
            ? 'border-red-500/50 focus:ring-red-500/30'
            : 'border-white/10 focus:ring-aivora-indigo/30 focus:border-aivora-indigo/50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
})

export default Select
