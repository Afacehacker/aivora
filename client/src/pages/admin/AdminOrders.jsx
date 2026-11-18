import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  CreditCard,
  Clock,
  Check,
  Search,
  Filter,
} from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { formatPrice } from '../../components/home/CourseCard'
import adminService from '../../services/adminService'
import ReceiptViewerModal from '../../components/admin/ReceiptViewerModal'

const statusColor = {
  success: 'success',
  pending: 'warning',
  failed: 'error',
  refunded: 'purple',
}

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || ''

  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [inspectingPayment, setInspectingPayment] = useState(null)

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
    if (!window.confirm('Are you sure you want to remove these bank payment details?')) return
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
    a.download = `aivora-payments-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  // Filter orders by search term (name, email, reference, course)
  const filteredOrders = orders.filter((o) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      o.transactionRef?.toLowerCase().includes(term) ||
      o.student?.name?.toLowerCase().includes(term) ||
      o.student?.email?.toLowerCase().includes(term) ||
      o.course?.title?.toLowerCase().includes(term) ||
      (o.senderName || o.metadata?.senderName || '').toLowerCase().includes(term) ||
      (o.senderBank || o.metadata?.senderBank || '').toLowerCase().includes(term)
    )
  })

  const pendingCount = orders.filter((o) => o.status === 'pending').length

  return (
    <>
      <SEO title="Payment Approvals & Orders — AIVORA Admin" />

      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-pink-600" />
              Payment Approvals &amp; Bank Transfer Management
            </h1>
            <p className="text-sm text-slate-600">
              Approve or reject student manual bank transfers, view payment receipts, and manage bank account details shown at checkout.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            iconLeft={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: '', label: 'All Orders & Payments' },
            { id: 'pending', label: 'Pending Verification', badge: pendingCount > 0 ? pendingCount : null },
            { id: 'success', label: 'Approved (Success)' },
            { id: 'failed', label: 'Rejected (Failed)' },
          ].map((tab) => {
            const active = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id)
                  setSearchParams(tab.id ? { status: tab.id } : {})
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-2 ${
                  active
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-pink-100 hover:bg-pink-50'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      active ? 'bg-white text-pink-600' : 'bg-pink-100 text-pink-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Student Manual Transfers Table */}
        <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900">
                Student Payment Submissions
              </h2>
              <p className="text-xs text-slate-500">
                Click &ldquo;Approve &amp; Unlock&rdquo; to verify student payment and grant instant access to the course.
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search reference, student, course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                iconLeft={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
          </div>

          {loading ? (
            <div className="h-64 rounded-2xl bg-pink-50/50 animate-pulse border border-pink-100" />
          ) : (
            <div className="border border-pink-100 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-pink-50/60 border-b border-pink-100 text-xs uppercase font-bold text-slate-600">
                  <tr>
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Course</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Bank &amp; Sender</th>
                    <th className="py-3.5 px-4">Receipt Proof</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Approve / Reject Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100 text-slate-700">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((o) => {
                      const sName = o.senderName || o.metadata?.senderName || '—'
                      const sBank = o.senderBank || o.metadata?.senderBank || 'Bank Transfer'
                      const tNote = o.transferNote || o.metadata?.transferNote || ''
                      const receipt = o.proofUrl || o.payment?.proofUrl
                      const isUpdating = updatingOrderId === o._id
                      const isPending = o.status === 'pending'

                      return (
                        <tr key={o._id} className="hover:bg-pink-50/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-pink-600">
                            {o.transactionRef}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-900">{o.student?.name || 'Student'}</p>
                            <p className="text-xs text-slate-500">{o.student?.email}</p>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {o.course?.title || 'Selected Course'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {formatPrice(o.amount)}
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <p className="font-semibold text-slate-900">{sBank}</p>
                            <p className="text-slate-600">Sender: {sName}</p>
                            {tNote && <p className="text-slate-400 mt-0.5">Note: {tNote}</p>}
                          </td>
                          <td className="py-3.5 px-4">
                            {receipt ? (
                              <button
                                type="button"
                                onClick={() => setInspectingPayment(o)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" /> Inspect Receipt
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No receipt attached</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge color={statusColor[o.status] || 'default'} className="capitalize">
                              {o.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {o.status !== 'success' && (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleStatusUpdate(o._id, 'success')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                                  title="Approve student payment and unlock course access"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve &amp; Unlock</span>
                                </button>
                              )}
                              {isPending && (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleStatusUpdate(o._id, 'failed')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold transition-colors disabled:opacity-50"
                                  title="Reject payment"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}
                              {o.status === 'success' && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                  <Check className="w-4 h-4" /> Enrolled &amp; Unlocked
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                        No payment records matching the selected status or search term.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Admin Bank Payment Details Manager (Add & Remove Accounts shown on checkout) */}
        <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900">
                  Bank Payment Details (Shown to Students at Checkout)
                </h2>
                <p className="text-xs text-slate-500">
                  Manage bank accounts where students can transfer payment. Remove old details or add new ones anytime.
                </p>
              </div>
            </div>
            <Badge color="warning" className="flex items-center gap-1 self-start sm:self-auto">
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
                    className="rounded-2xl bg-pink-50/50 border border-pink-100 p-4 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-pink-600">
                        {acc.bankName}
                      </span>
                      <p className="text-xl font-mono font-black text-slate-900 tracking-wider">
                        {acc.accountNumber}
                      </p>
                      <p className="text-xs text-slate-700">
                        Account Name: <strong className="text-slate-900">{acc.accountName}</strong>
                      </p>
                      {acc.instructions && (
                        <p className="text-xs text-slate-500 pt-1">{acc.instructions}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePaymentAccount(acc._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold text-red-600 transition-colors"
                      title="Remove this bank account detail"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
                No active payment bank details found. Add a bank account below so students can make manual transfers.
              </div>
            )}
          </div>

          {/* Add New Payment Details Form */}
          <form
            onSubmit={handleAddPaymentAccount}
            className="pt-4 border-t border-pink-100 space-y-4"
          >
            <h3 className="text-sm font-display font-bold text-slate-900">
              Add New Bank Account for Manual Transfers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Bank Name"
                placeholder="e.g. Moniepoint MFB, Kuda, PalmPay, UBA"
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
                  placeholder="e.g. Use your full name or email as transfer narration"
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
                Save Bank Details
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Full Receipt Modal Viewer with Zoom, Rotation & 1-Click Decisions */}
      {inspectingPayment && (
        <ReceiptViewerModal
          isOpen={Boolean(inspectingPayment)}
          onClose={() => setInspectingPayment(null)}
          receiptUrl={inspectingPayment.proofUrl || inspectingPayment.payment?.proofUrl}
          payment={inspectingPayment}
          isProcessing={updatingOrderId === inspectingPayment._id}
          onApprove={(id) => handleStatusUpdate(id, 'success')}
          onReject={(id) => handleStatusUpdate(id, 'failed')}
        />
      )}
    </>
  )
}
