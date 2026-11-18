import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Download,
  Filter,
  RefreshCw,
  Clock,
  ArrowRight,
  ExternalLink,
  Building2,
  AlertTriangle,
  Check,
  Copy,
} from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ReceiptViewerModal from '../../components/admin/ReceiptViewerModal'
import { formatPrice } from '../../components/home/CourseCard'
import adminService from '../../services/adminService'
import { getReceiptMediaUrl } from '../../utils/mediaUrl'

export default function AdminPaymentApprovals() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || 'pending'

  const [payments, setPayments] = useState([])
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  // Selected payment for full receipt inspection modal
  const [inspectingPayment, setInspectingPayment] = useState(null)
  const [copiedRef, setCopiedRef] = useState(null)

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await adminService.getAllOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      setPayments(res?.data || [])
    } catch (err) {
      toast.error(err.message || 'Failed to fetch payments')
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [statusFilter])

  const handleStatusUpdate = async (paymentId, newStatus) => {
    setUpdatingId(paymentId)
    try {
      await adminService.updateOrderStatus(paymentId, { status: newStatus })
      toast.success(
        newStatus === 'success'
          ? 'Payment approved! Course has been unlocked for the student.'
          : `Payment marked as ${newStatus}.`
      )
      // Close modal if inspecting
      if (inspectingPayment?._id === paymentId) {
        setInspectingPayment(null)
      }
      fetchPayments()
    } catch (err) {
      toast.error(err.message || 'Failed to update payment status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedRef(text)
    toast.success('Transaction reference copied!')
    setTimeout(() => setCopiedRef(null), 2000)
  }

  // Filtered payments by search
  const filteredPayments = payments.filter((p) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      p.transactionRef?.toLowerCase().includes(term) ||
      p.student?.name?.toLowerCase().includes(term) ||
      p.student?.email?.toLowerCase().includes(term) ||
      p.course?.title?.toLowerCase().includes(term) ||
      (p.senderName || p.metadata?.senderName || '').toLowerCase().includes(term) ||
      (p.senderBank || p.metadata?.senderBank || '').toLowerCase().includes(term)
    )
  })

  // Quick statistics
  const pendingCount = payments.filter((p) => p.status === 'pending').length
  const successCount = payments.filter((p) => p.status === 'success').length
  const failedCount = payments.filter((p) => p.status === 'failed').length
  const totalVerifiedRevenue = payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const handleExportCSV = () => {
    if (!filteredPayments.length) return
    const headers = [
      'Reference',
      'Student Name',
      'Email',
      'Course Title',
      'Amount (NGN)',
      'Sender Bank',
      'Sender Account Name',
      'Status',
      'Receipt URL',
      'Date',
    ]
    const rows = filteredPayments.map((p) => [
      p.transactionRef,
      p.student?.name || '',
      p.student?.email || '',
      p.course?.title || '',
      p.amount,
      p.senderBank || p.metadata?.senderBank || '',
      p.senderName || p.metadata?.senderName || '',
      p.status,
      p.proofUrl || p.payment?.proofUrl || '',
      new Date(p.createdAt).toISOString(),
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aivora-payment-approvals-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <>
      <SEO title="Student Payment Approvals — AIVORA Admin" />

      <div className="space-y-7">
        {/* Page Title & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-pink-200 shadow-sm">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 border border-pink-200 text-xs font-bold text-pink-700 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Manual Bank Transfer Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900">
              Student Payment Approvals
            </h1>
            <p className="text-sm text-slate-700 font-medium mt-1">
              Verify student transfer receipts with full-resolution inspection, approve to immediately unlock course access, or reject invalid transfers.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchPayments}
              iconLeft={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              iconLeft={<Download className="w-4 h-4" />}
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* High-Contrast KPI Cards (Solid pure white, no blur) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border-2 border-amber-300 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Pending Verification
              </p>
              <p className="text-3xl font-display font-black text-slate-900 mt-1">
                {pendingCount}
              </p>
              <p className="text-xs text-amber-700 font-medium mt-0.5">Needs admin action</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border-2 border-emerald-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Approved Payments
              </p>
              <p className="text-3xl font-display font-black text-slate-900 mt-1">
                {successCount}
              </p>
              <p className="text-xs text-emerald-700 font-medium mt-0.5">Courses unlocked</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border-2 border-rose-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Rejected Payments
              </p>
              <p className="text-3xl font-display font-black text-slate-900 mt-1">
                {failedCount}
              </p>
              <p className="text-xs text-rose-700 font-medium mt-0.5">Declined transfers</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700">
              <XCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border-2 border-pink-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-pink-800">
                Verified Revenue
              </p>
              <p className="text-2xl sm:text-3xl font-display font-black text-slate-900 mt-1">
                {formatPrice(totalVerifiedRevenue)}
              </p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">Total approved NGN</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-pink-100 border border-pink-300 flex items-center justify-center text-pink-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-pink-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'pending', label: 'Pending Approval', badge: pendingCount },
              { id: 'success', label: 'Approved (Success)', badge: successCount },
              { id: 'failed', label: 'Rejected (Failed)', badge: failedCount },
              { id: 'all', label: 'All Records', badge: payments.length },
            ].map((tab) => {
              const active = statusFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id)
                    setSearchParams(tab.id !== 'pending' ? { status: tab.id } : {})
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-2 ${
                    active
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                      : 'bg-slate-50 text-slate-800 border border-slate-200 hover:bg-pink-50 hover:text-pink-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      active ? 'bg-white text-pink-700' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="w-full md:w-80">
            <Input
              placeholder="Search student, email, bank, ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              iconLeft={<Search className="w-4 h-4 text-slate-500" />}
            />
          </div>
        </div>

        {/* Payment Submissions List / Table */}
        <div className="bg-white rounded-2xl border border-pink-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-pink-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-base font-display font-black text-slate-900">
                Payment Verification Records ({filteredPayments.length})
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Click &lsquo;Inspect Receipt&rsquo; to preview the full bank transfer receipt image or PDF with zoom tools.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-pink-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Loading payment submissions...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600 mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <p className="text-base font-bold text-slate-900">No payment records found</p>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                {statusFilter === 'pending'
                  ? 'There are currently no manual bank transfers waiting for approval.'
                  : 'No payment submissions matched your filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 border-b border-slate-200 text-xs uppercase font-black text-slate-700">
                  <tr>
                    <th className="py-4 px-4">Student</th>
                    <th className="py-4 px-4">Course</th>
                    <th className="py-4 px-4">Amount</th>
                    <th className="py-4 px-4">Bank &amp; Narration</th>
                    <th className="py-4 px-4">Transfer Receipt Proof</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4 text-right">Approve / Reject Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredPayments.map((p) => {
                    const isUpdating = updatingId === p._id
                    const isPending = p.status === 'pending'
                    const sName = p.senderName || p.metadata?.senderName || '—'
                    const sBank = p.senderBank || p.metadata?.senderBank || 'Bank Transfer'
                    const tNote = p.transferNote || p.metadata?.transferNote || ''
                    const receiptRaw = p.proofUrl || p.payment?.proofUrl
                    const receiptResolved = receiptRaw ? getReceiptMediaUrl(receiptRaw) : ''

                    return (
                      <tr key={p._id} className="hover:bg-pink-50/30 transition-colors">
                        {/* Student */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-xs font-black text-white shadow-sm flex-shrink-0">
                              {p.student?.name?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">
                                {p.student?.name || 'Student'}
                              </p>
                              <p className="text-xs text-slate-600 truncate">{p.student?.email}</p>
                              <button
                                type="button"
                                onClick={() => handleCopy(p.transactionRef)}
                                className="inline-flex items-center gap-1 font-mono text-[11px] text-pink-700 hover:text-pink-900 hover:underline mt-0.5"
                                title="Click to copy transaction reference"
                              >
                                {p.transactionRef}
                                {copiedRef === p.transactionRef ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Course */}
                        <td className="py-4 px-4 font-semibold text-slate-900 max-w-[200px]">
                          <p className="truncate">{p.course?.title || 'Course'}</p>
                          <span className="text-[11px] text-slate-500 font-mono">
                            /{p.course?.slug || ''}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4">
                          <span className="text-base font-black text-slate-900 block">
                            {formatPrice(p.amount)}
                          </span>
                          <span className="text-[11px] font-bold uppercase text-slate-500">
                            {p.currency || 'NGN'}
                          </span>
                        </td>

                        {/* Bank Details */}
                        <td className="py-4 px-4 text-xs">
                          <p className="font-black text-slate-900 text-sm">{sBank}</p>
                          <p className="text-slate-700 mt-0.5">
                            Sender: <strong>{sName}</strong>
                          </p>
                          {tNote && (
                            <p className="text-slate-500 italic mt-0.5 max-w-xs truncate">
                              &ldquo;{tNote}&rdquo;
                            </p>
                          )}
                        </td>

                        {/* Receipt Thumbnail & Button */}
                        <td className="py-4 px-4">
                          {receiptRaw ? (
                            <div className="flex items-center gap-2">
                              {/* Thumbnail preview */}
                              <button
                                type="button"
                                onClick={() => setInspectingPayment(p)}
                                className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-300 overflow-hidden flex-shrink-0 group relative shadow-sm hover:ring-2 hover:ring-pink-500 transition-all"
                                title="Click to inspect receipt full size"
                              >
                                {receiptRaw.toLowerCase().endsWith('.pdf') ? (
                                  <div className="w-full h-full flex items-center justify-center text-pink-400 bg-slate-800">
                                    <span className="text-[10px] font-bold">PDF</span>
                                  </div>
                                ) : (
                                  <img
                                    src={receiptResolved}
                                    alt="Receipt thumbnail"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye className="w-4 h-4 text-white" />
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setInspectingPayment(p)}
                                className="px-3 py-1.5 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-800 font-bold text-xs inline-flex items-center gap-1.5 transition-colors border border-pink-200"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect Receipt</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">No receipt attached</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                              p.status === 'success'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : p.status === 'failed'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {p.status === 'success' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : p.status === 'failed' ? (
                              <XCircle className="w-3 h-3 text-rose-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-700" />
                            )}
                            {p.status}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 text-xs font-mono text-slate-600">
                          {new Date(p.createdAt).toLocaleDateString()}
                          <span className="block text-[10px] text-slate-400">
                            {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.status !== 'success' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleStatusUpdate(p._id, 'success')}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                                title="Approve payment and enroll student immediately"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Approve &amp; Unlock</span>
                              </button>
                            )}

                            {isPending && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleStatusUpdate(p._id, 'failed')}
                                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                                title="Reject payment"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            )}

                            {p.status === 'success' && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <Check className="w-4 h-4" /> Unlocked
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Full Receipt Modal Viewer with Zoom, Rotation & 1-Click Approve/Reject */}
      {inspectingPayment && (
        <ReceiptViewerModal
          isOpen={Boolean(inspectingPayment)}
          onClose={() => setInspectingPayment(null)}
          receiptUrl={inspectingPayment.proofUrl || inspectingPayment.payment?.proofUrl}
          payment={inspectingPayment}
          isProcessing={updatingId === inspectingPayment._id}
          onApprove={(id) => handleStatusUpdate(id, 'success')}
          onReject={(id) => handleStatusUpdate(id, 'failed')}
        />
      )}
    </>
  )
}
