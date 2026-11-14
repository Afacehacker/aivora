import { useState, useEffect } from 'react'
import { Check, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Badge from '../../components/ui/Badge'
import StarRating from '../../components/ui/StarRating'
import adminService from '../../services/adminService'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await adminService.getAllReviews()
      setReviews(res?.data || [])
    } catch {
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleApprove = async (id, isApproved) => {
    try {
      await adminService.updateReviewStatus(id, { isApproved })
      toast.success(isApproved ? 'Review approved!' : 'Review hidden')
      fetchReviews()
    } catch (err) {
      toast.error(err.message || 'Could not update review')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return
    try {
      await adminService.deleteReview(id)
      toast.success('Review deleted')
      fetchReviews()
    } catch (err) {
      toast.error(err.message || 'Could not delete review')
    }
  }

  return (
    <>
      <SEO title="Review Management — AIVORA Admin" />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Review Moderation</h1>
          <p className="text-sm text-slate-400">
            Approve or remove student course reviews before they appear publicly.
          </p>
        </div>

        {loading ? (
          <div className="h-48 rounded-2xl glass animate-pulse" />
        ) : reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r._id}
                className="glass rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">
                      {r.student?.name || 'Student'}
                    </span>
                    <StarRating rating={r.rating} />
                    <Badge color={r.isApproved ? 'success' : 'warning'}>
                      {r.isApproved ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-aivora-cyan">Course: {r.course?.title}</p>
                  <p className="text-sm text-slate-300">{r.comment}</p>
                </div>

                <div className="flex items-center gap-2">
                  {!r.isApproved && (
                    <button
                      onClick={() => handleApprove(r._id, true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1 hover:bg-emerald-500/30"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r._id)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-10 text-center border border-white/10 text-slate-400 text-sm">
            No student reviews submitted yet.
          </div>
        )}
      </div>
    </>
  )
}
