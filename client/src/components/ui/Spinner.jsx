import { motion } from 'framer-motion'
import { clsx } from 'clsx'

export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={clsx(
        'rounded-full border-2 border-aivora-indigo/20 border-t-aivora-indigo',
        sizes[size],
        className
      )}
    />
  )
}
