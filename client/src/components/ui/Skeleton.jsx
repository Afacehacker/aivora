import { clsx } from 'clsx'

function SkeletonBlock({ className = '' }) {
  return (
    <div className={clsx('animate-pulse bg-white/5 rounded-lg', className)} />
  )
}

export function SkeletonText({ lines = 2, className = '' }) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ size = 'md' }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' }
  return <div className={clsx('animate-pulse bg-white/5 rounded-full', sizes[size])} />
}

export function SkeletonCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/5">
      <SkeletonBlock className="h-48 rounded-none" />
      <div className="p-5 space-y-3">
        <SkeletonBlock className="h-5 w-3/4" />
        <SkeletonBlock className="h-4 w-1/2" />
        <SkeletonBlock className="h-4 w-full" />
        <div className="flex justify-between items-center pt-2">
          <SkeletonBlock className="h-6 w-20" />
          <SkeletonBlock className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default SkeletonBlock
