import { useState, useEffect } from 'react'
import {
  Download,
  Plus,
  Trash2,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  X,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { formatPrice } from '../../components/home/CourseCard'
import adminService from '../../services/adminService'

const statusColor = {
  success: 'success',
  pending: 'warning',
  failed: 'error',
  refunded: 'purple',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState(null)

  // Manual Payment Bank Accounts State
  const [paymentAccounts, setPaymentAccounts] = useState([])
  const [newAccount, setNewAccount] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    instructions: '',
  })
  const [addingAccount, setAddingAccount] = useState(false)

  const loadOrders = () => {
    setLoading(true)
    adminService
      .getAllOrders({ status: statusFilter || undefined })
      .then((res) => setOrders(res?.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  const loadPaymentAccounts = () => {
    adminService
      .getPaymentAccounts()
      .then((res) => {
        setPaymentAccounts(res?.data?.paymentAccounts || [])
      })
      .catch(() => {})
  }

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  useEffect(() => {
    loadPaymentAccounts()
  }, [])

  const handleAddPaymentAccount = async (e) => {
    e.preventDefault()
    if (!newAccount.bankName.trim() || !newAccount.accountName.trim() || !newAccount.accountNumber.trim()) {
      toast.error('Please enter Bank Name, Account Name, and Account Number.')
      return
    }
    setAddingAccount(true)
    try {
      const res = await adminService.createPaymentAccount(newAccount)
      setPaymentAccounts(res?.data || [])
      setNewAccount({ bankName: '', accountName: '', accountNumber: '', instructions: '' })
      toast.success('New payment bank details added!')
    } catch (err) {
      toast.error(err.message || 'Could not add payment account')
    } finally {
      setAddingAccount(false)
    }
  }

  const handleRemovePaymentAccount = async (id) => {
    try {
      const res = await adminService.deletePaymentAccount(id)
      setPaymentAccounts(res?.data || [])
      toast.success('Payment details removed!')
    } catch (err) {
      toast.error(err.message || 'Could not remove payment details')
    }
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId)
    try {
      await adminService.updateOrderStatus(orderId, { status: newStatus })
      toast.success(
        newStatus === 'success'
          ? 'Payment approved & course unlocked for student!'
          : `Payment marked as ${newStatus}`
      )
      loadOrders()
    } catch (err) {
      toast.error(err.message || 'Failed to update payment status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleExportCSV = () => {
    if (!orders.length) return
    const headers = [
      'Reference',
      'Student',
      'Email',
      'Course',
      'Amount',
      'Sender Name',
      'Sender Bank',
      'Status',
      'Date',
    ]
    const rows = orders.map((o) => [
      o.transactionRef,
      o.student?.name || '',
      o.student?.email || '',
      o.course?.title || '',
      o.amount,
      o.senderName || o.metadata?.senderName || '',
      o.senderBank || o.metadata?.senderBank || '',
      o.status,
      new Date(o.createdAt).toISOString(),
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aivora-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <>
      <SEO title="Manual Payment & Order Management — AIVORA Admin" />

      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">
            Manual Payments & Bank Details Management
          </h1>
          <p className="text-sm text-slate-400">
            Add or remove bank account payment details displayed on the checkout page, and approve student bank transfers.
          </p>
        </div>

        {/* Admin Bank Payment Details Manager (Add & Remove Payment Details) */}
        <div className="glass rounded-2xl p-6 border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-aivora-indigo/20 border border-aivora-indigo/40 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-aivora-cyan" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-white">
                  Bank Payment Details (Shown to Students at Checkout)
                </h2>
                <p className="text-xs text-slate-400">
                  Remove existing bank payment details or add new bank account details anytime.
                </p>
              </div>
            </div>
            <Badge color="warning" className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> OPay Excluded Notice Active
            </Badge>
          </div>

          {/* Current Bank Accounts List */}
          <div className="space-y-3">
            {paymentAccounts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentAccounts.map((acc) => (
                  <div
                    key={acc._id}
                    className="rounded-2xl bg-aivora-navy/90 border border-white/10 p-4 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-aivora-cyan">
                        {acc.bankName}
                      </span>
                      <p className="text-xl font-mono font-black text-white tracking-wider">
                        {acc.accountNumber}
                      </p>
                      <p className="text-xs text-slate-300">
                        Account Name: <strong className="text-white">{acc.accountName}</strong>
                      </p>
                      {acc.instructions && (
                        <p className="text-xs text-slate-400 pt-1">{acc.instructions}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePaymentAccount(acc._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-semibold text-red-300 transition-colors"
                      title="Remove this payment detail"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-200">
                No active payment bank details found. Add a bank account below so students can make manual transfers.
              </div>
            )}
          </div>

          {/* Add New Payment Details Form */}
          <form
            onSubmit={handleAddPaymentAccount}
            className="pt-4 border-t border-white/10 space-y-4"
          >
            <h3 className="text-sm font-display font-bold text-white">
              Add Another Bank Payment Detail
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Bank Name (e.g. Moniepoint, Kuda, PalmPay, UBA, Access, FirstBank)"
                placeholder="e.g. Moniepoint MFB"
                value={newAccount.bankName}
                onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                required
              />
              <Input
                label="Account Number"
                placeholder="e.g. 8012345678"
                value={newAccount.accountNumber}
                onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                required
              />
              <Input
                label="Account Name"
                placeholder="e.g. AIVORA Creative Hub"
                value={newAccount.accountName}
                onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
              <div className="flex-1">
                <Input
                  label="Transfer Instructions (Optional)"
                  placeholder="e.g. Use your full name or email as narration"
                  value={newAccount.instructions}
                  onChange={(e) => setNewAccount({ ...newAccount, instructions: e.target.value })}
                />
              </div>
              <Button
                type="submit"
                size="md"
                loading={addingAccount}
                iconLeft={<Plus className="w-4 h-4" />}
              >
                Add Payment Details
              </Button>
            </div>
          </form>
        </div>

        {/* Student Manual Transfers Table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-display font-bold text-white">
                Student Manual Transfer Submissions
              </h2>
              <p className="text-xs text-slate-400">
                Verify student transfers and click &ldquo;Approve &amp; Unlock&rdquo; to grant immediate course access.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl bg-aivora-navy border border-white/10 px-3.5 py-2 text-xs text-white"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Verification</option>
                <option value="success">Approved (Success)</option>
                <option value="failed">Rejected (Failed)</option>
              </select>

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

          {loading ? (
            <div className="h-64 rounded-2xl glass animate-pulse" />
          ) : (
            <div className="glass rounded-2xl border border-white/10 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Course</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Sender Bank &amp; Name</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {orders.length > 0 ? (
                    orders.map((o) => {
                      const sName = o.senderName || o.metadata?.senderName || '—'
                      const sBank = o.senderBank || o.metadata?.senderBank || 'Manual Transfer'
                      const tNote = o.transferNote || o.metadata?.transferNote || ''
                      return (
                        <tr key={o._id} className="hover:bg-white/5">
                          <td className="py-3.5 px-4 font-mono text-xs text-aivora-cyan">
                            {o.transactionRef}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-medium text-white">{o.student?.name || 'Student'}</p>
                            <p className="text-xs text-slate-400">{o.student?.email}</p>
                          </td>
                          <td className="py-3.5 px-4">{o.course?.title || 'Course'}</td>
                          <td className="py-3.5 px-4 font-semibold">{formatPrice(o.amount)}</td>
                          <td className="py-3.5 px-4 text-xs">
                            <p className="font-semibold text-emerald-300">{sBank}</p>
                            <p className="text-slate-300">Sender: {sName}</p>
                            {tNote && <p className="text-slate-400">Note: {tNote}</p>}
                            {o.proofUrl || o.payment?.proofUrl ? (
                              <button
                                type="button"
                                onClick={() => setViewingReceiptUrl(o.proofUrl || o.payment?.proofUrl)}
                                className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[11px] font-semibold hover:bg-pink-500/30 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Receipt
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 block mt-1">No receipt uploaded</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge color={statusColor[o.status] || 'default'} className="capitalize">
                              {o.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-400">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {o.status !== 'success' && (
                                <button
                                  type="button"
                                  disabled={updatingOrderId === o._id}
                                  onClick={() => handleStatusUpdate(o._id, 'success')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-semibold text-emerald-300 transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve &amp; Unlock</span>
                                </button>
                              )}
                              {o.status === 'pending' && (
                                <button
                                  type="button"
                                  disabled={updatingOrderId === o._id}
                                  onClick={() => handleStatusUpdate(o._id, 'failed')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-semibold text-red-300 transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        No manual payment records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Receipt Image / PDF Viewer Modal */}
      {viewingReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-pink-400" />
                <span>Student Bank Transfer Receipt</span>
              </h3>
              <button
                type="button"
                onClick={() => setViewingReceiptUrl(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto rounded-xl bg-black flex items-center justify-center p-2 border border-white/10">
              {viewingReceiptUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={viewingReceiptUrl}
                  className="w-full h-96 rounded-lg"
                  title="Receipt PDF"
                />
              ) : (
                <img
                  src={viewingReceiptUrl}
                  alt="Student Payment Receipt"
                  className="max-h-[60vh] w-auto object-contain rounded-lg shadow-lg"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={viewingReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-pink-400 hover:text-pink-300 underline inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full-Size in New Tab
              </a>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setViewingReceiptUrl(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
