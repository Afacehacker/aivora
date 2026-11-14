import { motion } from 'framer-motion'
import Button from './Button'

export default function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  description = '',
  ctaLabel,
  onCta,
  ctaHref,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      {Icon && (
        <div className="w-20 h-20 rounded-2xl bg-aivora-indigo/10 border border-aivora-indigo/20 flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-aivora-indigo" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-slate-400 max-w-sm mb-6">{description}</p>}
      {ctaLabel && (onCta || ctaHref) && (
        <Button
          onClick={onCta}
          {...(ctaHref ? { as: 'a', href: ctaHref } : {})}
        >
          {ctaLabel}
        </Button>
      )}
    </motion.div>
  )
}
