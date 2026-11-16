import { useState, useEffect } from 'react'
import { ShoppingBag } from 'lucide-react'
import SEO from '../../components/common/SEO'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { formatPrice } from '../../components/home/CourseCard'
import paymentService from '../../services/paymentService'

const statusColor = {
  success: 'success',
  pending: 'warning',
  failed: 'error',
  refunded: 'purple',
}

export default function PurchaseHistoryPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    paymentService
      .getMyPayments()
      .then((res) => {
        if (isMounted) setPayments(res?.data || [])
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <>
      <SEO title="Purchase & Payment History — AIVORA" />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Purchase & Payment History</h1>
          <p className="text-sm text-slate-400">
            View all your course transactions and payment references.
          </p>
        </div>

        {loading ? (
          <div className="h-64 rounded-2xl glass animate-pulse" />
        ) : payments.length > 0 ? (
          <div className="glass rounded-2xl border border-white/10 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Transfer Details</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-white/5">
                    <td className="py-3.5 px-4 font-mono text-xs text-aivora-cyan">
                      {p.transactionRef}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      {p.course?.title || p.metadata?.courseTitle || 'Course'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold">{formatPrice(p.amount)}</td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-medium text-emerald-300">
                        {p.senderBank || p.metadata?.senderBank || 'Manual Bank Transfer'}
                      </span>
                      {(p.senderName || p.metadata?.senderName) && (
                        <span className="block text-slate-400">
                          Sender: {p.senderName || p.metadata?.senderName}
                        </span>
                      )}
                      {p.proofUrl && (
                        <a
                          href={p.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-pink-400 hover:text-pink-300 underline mt-1"
                        >
                          View Receipt Screenshot ↗
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge color={statusColor[p.status] || 'default'} className="capitalize">
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="No transactions yet"
            description="Your verified course purchases and receipts will appear here."
            ctaLabel="Browse Courses"
            ctaHref="/courses"
          />
        )}
      </div>
    </>
  )
}
