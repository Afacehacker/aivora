import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visible = pages.filter(
    (p) => p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)
  )

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg glass hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {visible.map((page, idx) => {
        const prev = visible[idx - 1]
        return (
          <div key={page} className="flex items-center gap-2">
            {prev && page - prev > 1 && (
              <span className="text-slate-500 text-sm">…</span>
            )}
            <button
              onClick={() => onPageChange(page)}
              className={clsx(
                'w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200',
                page === currentPage
                  ? 'bg-gradient-to-r from-aivora-indigo to-aivora-purple text-white shadow-glow-indigo'
                  : 'glass hover:bg-white/10 text-slate-400 hover:text-white'
              )}
            >
              {page}
            </button>
          </div>
        )
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg glass hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
