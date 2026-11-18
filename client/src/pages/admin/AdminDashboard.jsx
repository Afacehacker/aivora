import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, BookOpen, GraduationCap, DollarSign, Plus, TrendingUp,
  Clock, ShieldCheck, CheckCircle2, XCircle, Eye, X, ExternalLink,
  AlertCircle, CreditCard, ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { formatPrice } from '../../components/home/CourseCard'
import adminService from '../../services/adminService'
import api from '../../services/api'
import ReceiptViewerModal from '../../components/admin/ReceiptViewerModal'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [logs, setLogs] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [inspectingPayment, setInspectingPayment] = useState(null)

  const loadDashboardData = () => {
    setLoading(true)
    Promise.all([
      adminService.getDashboardStats(),
      adminService.getRevenueChart().catch(() => ({ data: [] })),
      api.get('/admin/activity-logs?limit=6').catch(() => ({ data: [] })),
      adminService.getAllOrders({ status: 'pending' }).catch(() => ({ data: [] })),
    ])
      .then(([statsRes, revRes, logRes, pendingRes]) => {
        setStats(statsRes?.data || {})
        setRevenueData(revRes?.data || [])
        setLogs(logRes?.data || [])
        setPendingOrders(pendingRes?.data || [])
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleUpdatePaymentStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId)
    try {
      await adminService.updateOrderStatus(orderId, { status: newStatus })
      toast.success(
        newStatus === 'success'
          ? 'Payment approved & course unlocked for student!'
          : `Payment marked as ${newStatus}.`
      )
      loadDashboardData()
    } catch (err) {
      toast.error(err.message || 'Failed to update payment status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const kpis = [
    {
      label: 'Registered Students',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-pink-600',
    },
    {
      label: 'Total Courses',
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      color: 'text-pink-600',
    },
    {
      label: 'Total Enrollments',
      value: stats?.totalEnrollments || 0,
      icon: GraduationCap,
      color: 'text-pink-600',
    },
    {
      label: 'Verified Revenue',
      value: formatPrice(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'text-emerald-600',
    },
  ]

  const maxRev = Math.max(...revenueData.map((d) => d.revenue || 0), 1)

  return (
    <>
      <SEO title="Admin Overview — AIVORA" />

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-black text-slate-900">
              Administrator Overview
            </h1>
            <p className="text-sm text-slate-600">
              Complete platform metrics, revenue analytics, and real-time operational logs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/payments">
              <Button variant="secondary" size="sm" iconLeft={<ShieldCheck className="w-4 h-4 text-pink-600" />}>
                Payment Approvals
              </Button>
            </Link>
            <Link to="/admin/courses/create">
              <Button size="sm" iconLeft={<Plus className="w-4 h-4" />}>
                Create New Course
              </Button>
            </Link>
          </div>
        </div>

        {/* Priority Pending Payments Approval Section */}
        {pendingOrders.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
                  <AlertCircle className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-display font-black text-slate-900 flex items-center gap-2">
                    <span>Student Manual Payments Awaiting Approval</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold">
                      {pendingOrders.length} Pending
                    </span>
                  </h2>
                  <p className="text-xs text-slate-600">
                    Review student transfer receipts below and click &ldquo;Approve &amp; Unlock&rdquo; to give them immediate course access.
                  </p>
                </div>
              </div>
              <Link
                to="/admin/payments?status=pending"
                className="text-xs font-bold text-amber-800 hover:text-amber-900 underline flex items-center gap-1 self-start sm:self-center"
              >
                Open Payment Approvals Page <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {pendingOrders.slice(0, 4).map((order) => {
                const sName = order.senderName || order.metadata?.senderName || 'Student Transfer'
                const sBank = order.senderBank || order.metadata?.senderBank || 'Bank Transfer'
                const receipt = order.proofUrl || order.payment?.proofUrl
                const isUpdating = updatingOrderId === order._id

                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {order.student?.name || 'Student'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{order.student?.email}</p>
                        <p className="text-xs font-semibold text-pink-600 mt-1 truncate">
                          Course: {order.course?.title || 'Selected Course'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-base font-black text-slate-900">
                          {formatPrice(order.amount)}
                        </span>
                        <p className="text-[11px] font-mono text-slate-400">
                          Ref: {order.transactionRef?.slice(0, 12)}...
                        </p>
                      </div>
                    </div>

                    <div className="bg-amber-50/60 rounded-lg p-2 text-xs text-slate-700 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900">{sBank}</span> • Sender: {sName}
                      </div>
                      {receipt ? (
                        <button
                          type="button"
                          onClick={() => setInspectingPayment(order)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-600 hover:text-pink-700 underline"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect Receipt
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">No receipt file</span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdatePaymentStatus(order._id, 'failed')}
                        className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-600 transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdatePaymentStatus(order._id, 'success')}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve &amp; Unlock
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpis.map((k) => {
            const Icon = k.icon
            return (
              <div
                key={k.label}
                className="bg-white rounded-2xl p-5 border border-pink-100 flex items-center gap-4 shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-6 h-6 ${k.color}`} />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-display font-black text-slate-900">
                    {loading ? '...' : k.value}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">{k.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Revenue Chart & Popular Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-pink-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-bold text-slate-900">Revenue Analytics</h2>
                <p className="text-xs text-slate-500">Monthly completed student course enrollments.</p>
              </div>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Live Tracking
              </span>
            </div>
            <div className="h-48 flex items-end gap-2 pt-6">
              {revenueData.length > 0 ? (
                revenueData.map((d, i) => {
                  const pct = Math.max(Math.round(((d.revenue || 0) / maxRev) * 100), 6)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full flex items-end justify-center h-36">
                        <div
                          style={{ height: `${pct}%` }}
                          className="w-full rounded-t-lg bg-gradient-to-t from-pink-500 to-rose-400 group-hover:from-pink-600 group-hover:to-rose-500 transition-all shadow-sm"
                          title={`${formatPrice(d.revenue || 0)} (${d.count || 0} sales)`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {monthNames[(d.month || 1) - 1] || d.month}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  No revenue records to display yet.
                </div>
              )}
            </div>
          </div>

          {/* Popular Courses */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-pink-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-slate-900">Featured AI Courses</h2>
              <Link to="/admin/courses" className="text-xs text-pink-600 font-semibold hover:underline">
                Manage Courses →
              </Link>
            </div>
            <div className="space-y-3">
              {(stats?.popularCourses || []).map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-pink-50/50 border border-pink-100"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                    <p className="text-xs text-slate-500">{formatPrice(c.price)}</p>
                  </div>
                  <Badge color={c.isPublished ? 'success' : 'warning'}>
                    {c.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Purchases & Admin Audit Trail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Purchases with direct Approve / Reject */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-pink-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-bold text-slate-900">Recent Transactions</h2>
                <p className="text-xs text-slate-500">Student purchases and transfer requests.</p>
              </div>
              <Link to="/admin/orders" className="text-xs text-pink-600 font-semibold hover:underline">
                View All Payments →
              </Link>
            </div>
            {(stats?.recentPurchases || []).length > 0 ? (
              <div className="space-y-2.5">
                {stats.recentPurchases.map((p) => {
                  const isPending = p.status === 'pending'
                  const isUpdating = updatingOrderId === p._id

                  return (
                    <div
                      key={p._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-pink-50/50 border border-pink-100 text-sm gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 truncate">
                            {p.student?.name || 'Student'}
                          </p>
                          <Badge color={p.status === 'success' ? 'success' : p.status === 'failed' ? 'error' : 'warning'}>
                            {p.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {p.course?.title || 'Course'}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString()} • Ref: {p.transactionRef}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <p className="font-bold text-slate-900">{formatPrice(p.amount)}</p>
                        {isPending && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleUpdatePaymentStatus(p._id, 'success')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                              title="Approve payment and unlock course"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleUpdatePaymentStatus(p._id, 'failed')}
                              className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors"
                              title="Reject payment"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No recent purchases recorded yet.</p>
            )}
          </div>

          {/* Audit Logs */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-pink-100 shadow-sm space-y-4">
            <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-pink-600" />
              Admin Activity Audit Log
            </h2>
            {logs.length > 0 ? (
              <div className="space-y-2.5">
                {logs.map((log) => (
                  <div key={log._id} className="p-3 rounded-xl bg-pink-50/50 border border-pink-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-pink-600">
                        {log.action}
                      </span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      By {log.admin?.name || 'Admin'} on {log.targetModel || 'System'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Administrative actions (course creation, manual access grants, status updates) are automatically logged here.
              </p>
            )}
          </div>
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
          onApprove={(id) => handleUpdatePaymentStatus(id, 'success')}
          onReject={(id) => handleUpdatePaymentStatus(id, 'failed')}
        />
      )}
    </>
  )
}
