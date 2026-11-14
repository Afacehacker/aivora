import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

const variants = {
  primary: 'bg-gradient-to-r from-aivora-indigo to-aivora-purple text-white hover:opacity-90 shadow-glow-indigo',
  secondary: 'glass text-white hover:bg-white/10 border border-white/10',
  outline: 'border border-aivora-indigo text-aivora-indigo hover:bg-aivora-indigo/10',
  ghost: 'text-slate-300 hover:text-white hover:bg-white/5',
  danger: 'bg-red-500/90 text-white hover:bg-red-600',
}

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  className = '',
  onClick,
  type = 'button',
  fullWidth = false,
  ...props
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        'relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-aivora-indigo/50 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : iconLeft ? (
        <span className="flex-shrink-0">{iconLeft}</span>
      ) : null}
      {children}
      {!loading && iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </motion.button>
  )
}
