import { Star } from 'lucide-react'

export default function StarRating({ rating = 0, max = 5, size = 'sm', showValue = false }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`${sizes[size]} ${
            i < Math.floor(rating)
              ? 'text-amber-400 fill-amber-400'
              : i < rating
              ? 'text-amber-400 fill-amber-400/50'
              : 'text-slate-600'
          }`}
        />
      ))}
      {showValue && (
        <span className="text-sm text-slate-300 ml-1 font-medium">{Number(rating).toFixed(1)}</span>
      )}
    </div>
  )
}
