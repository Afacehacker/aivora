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
          <h1 className="text-2xl font-display font-black text-slate-900">Review Moderation</h1>
          <p className="text-sm text-slate-600 font-medium">
            Approve or remove student course reviews before they appear publicly.
          </p>
        </div>

        {loading ? (
          <div className="h-48 rounded-2xl bg-white border border-pink-100 animate-pulse" />
        ) : reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r._id}
                className="bg-white rounded-2xl p-5 border border-pink-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900">
                      {r.student?.name || 'Student'}
                    </span>
                    <StarRating rating={r.rating} />
                    <Badge color={r.isApproved ? 'success' : 'warning'}>
                      {r.isApproved ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-pink-600 font-semibold">Course: {r.course?.title}</p>
                  <p className="text-sm text-slate-700">{r.comment}</p>
                </div>

                <div className="flex items-center gap-2">
                  {!r.isApproved && (
                    <button
                      onClick={() => handleApprove(r._id, true)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 shadow-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r._id)}
                    className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                    title="Delete review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center border border-pink-200 text-slate-600 text-sm">
            No student reviews submitted yet.
          </div>
        )}
      </div>
    </>
  )
}
