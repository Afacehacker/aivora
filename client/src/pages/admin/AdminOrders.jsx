import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import SEO from '../../components/common/SEO'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
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

  useEffect(() => {
    setLoading(true)
    adminService
      .getAllOrders({ status: statusFilter || undefined })
      .then((res) => setOrders(res?.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const handleExportCSV = () => {
    if (!orders.length) return
    const headers = ['Reference', 'Student', 'Email', 'Course', 'Amount', 'Status', 'Date']
    const rows = orders.map((o) => [
      o.transactionRef,
      o.student?.name || '',
      o.student?.email || '',
      o.course?.title || '',
      o.amount,
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
      <SEO title="Order & Transaction Management — AIVORA Admin" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Order & Payment Management</h1>
            <p className="text-sm text-slate-400">
              Monitor all student payment references, verification statuses, and export reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl bg-aivora-navy border border-white/10 px-3.5 py-2 text-xs text-white"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
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
                  <th className="py-3.5 px-4">Provider</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {orders.map((o) => (
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
                    <td className="py-3.5 px-4 capitalize text-xs">{o.paymentProvider}</td>
                    <td className="py-3.5 px-4">
                      <Badge color={statusColor[o.status] || 'default'} className="capitalize">
                        {o.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
