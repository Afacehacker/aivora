import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, BookOpen, GraduationCap, DollarSign, Plus, TrendingUp,
  Clock, ShieldCheck
} from 'lucide-react'
import SEO from '../../components/common/SEO'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { formatPrice } from '../../components/home/CourseCard'
import adminService from '../../services/adminService'
import api from '../../services/api'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      adminService.getDashboardStats(),
      adminService.getRevenueChart().catch(() => ({ data: [] })),
      api.get('/admin/activity-logs?limit=6').catch(() => ({ data: [] })),
    ])
      .then(([statsRes, revRes, logRes]) => {
        if (isMounted) {
          setStats(statsRes?.data || {})
          setRevenueData(revRes?.data || [])
          setLogs(logRes?.data || [])
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const kpis = [
    {
      label: 'Registered Students',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-aivora-indigo',
    },
    {
      label: 'Total Courses',
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      color: 'text-aivora-cyan',
    },
    {
      label: 'Total Enrollments',
      value: stats?.totalEnrollments || 0,
      icon: GraduationCap,
      color: 'text-aivora-purple',
    },
    {
      label: 'Verified Revenue',
      value: formatPrice(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'text-emerald-400',
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
            <h1 className="text-2xl font-display font-black text-white">
              Administrator Overview
            </h1>
            <p className="text-sm text-slate-400">
              Complete platform metrics, revenue analytics, and real-time operational logs.
            </p>
          </div>
          <Link to="/admin/courses/create">
            <Button size="sm" iconLeft={<Plus className="w-4 h-4" />}>
              Create New Course
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpis.map((k) => {
            const Icon = k.icon
            return (
              <div
                key={k.label}
                className="glass rounded-2xl p-5 border border-white/10 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-6 h-6 ${k.color}`} />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-display font-black text-white">
                    {loading ? '...' : k.value}
                  </p>
                  <p className="text-xs text-slate-400">{k.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Revenue Chart & Popular Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-7 glass rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Verified Monthly Revenue
              </h2>
              <span className="text-xs text-slate-400">Last 12 Months</span>
            </div>

            {revenueData.length > 0 ? (
              <div className="h-52 flex items-end gap-3 pt-6">
                {revenueData.map((d, idx) => {
                  const pct = Math.max(8, Math.round(((d.revenue || 0) / maxRev) * 100))
                  const label = monthNames[(d._id?.month || 1) - 1]
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-aivora-indigo to-aivora-cyan transition-all"
                        style={{ height: `${pct}%` }}
                        title={`${label}: ${formatPrice(d.revenue)}`}
                      />
                      <span className="text-[10px] text-slate-400">{label}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-sm text-slate-500">
                Revenue bars will populate as verified transactions are processed.
              </div>
            )}
          </div>

          {/* Popular Courses */}
          <div className="lg:col-span-5 glass rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-white">Popular Courses</h2>
              <Link to="/admin/courses" className="text-xs text-aivora-indigo hover:underline">
                Manage →
              </Link>
            </div>
            <div className="space-y-3">
              {(stats?.popularCourses || []).map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                    <p className="text-xs text-slate-400">{formatPrice(c.price)}</p>
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
          {/* Recent Purchases */}
          <div className="lg:col-span-7 glass rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-white">Recent Transactions</h2>
              <Link to="/admin/orders" className="text-xs text-aivora-indigo hover:underline">
                View All →
              </Link>
            </div>
            {(stats?.recentPurchases || []).length > 0 ? (
              <div className="space-y-2.5">
                {stats.recentPurchases.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">
                        {p.student?.name || 'Student'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {p.course?.title || 'Course'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{formatPrice(p.amount)}</p>
                      <Badge color={p.status === 'success' ? 'success' : 'warning'}>
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No recent purchases recorded yet.</p>
            )}
          </div>

          {/* Audit Logs */}
          <div className="lg:col-span-5 glass rounded-2xl p-6 border border-white/10 space-y-4">
            <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-aivora-cyan" />
              Admin Activity Audit Log
            </h2>
            {logs.length > 0 ? (
              <div className="space-y-2.5">
                {logs.map((log) => (
                  <div key={log._id} className="p-3 rounded-xl bg-white/5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-aivora-cyan">
                        {log.action}
                      </span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-400">
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
    </>
  )
}
