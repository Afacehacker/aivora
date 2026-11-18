import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, Users, Star, Settings,
  Globe, Headphones, Tag, FolderOpen, Menu, X, Sparkles, LogOut,
  Bell, ChevronRight, Shield, CreditCard, ShieldCheck
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import adminService from '../services/adminService'

const adminLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/admin/dashboard' },
  { icon: ShieldCheck, label: 'Payment Approvals', to: '/admin/payments', isApproval: true },
  { icon: BookOpen, label: 'Courses', to: '/admin/courses' },
  { icon: FolderOpen, label: 'Categories', to: '/admin/categories' },
  { icon: Users, label: 'Students', to: '/admin/students' },
  { icon: CreditCard, label: 'Bank & Orders', to: '/admin/orders' },
  { icon: Star, label: 'Reviews', to: '/admin/reviews' },
  { icon: Tag, label: 'Coupons', to: '/admin/coupons' },
  { icon: Headphones, label: 'Support', to: '/admin/support' },
  { icon: Globe, label: 'Website Settings', to: '/admin/settings' },
]

function AdminSidebar({ onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    adminService
      .getAllOrders({ status: 'pending' })
      .then((res) => {
        setPendingCount((res?.data || []).length)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex flex-col h-full bg-white select-none">
      <div className="flex items-center justify-between p-5 border-b border-pink-100">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-display font-black gradient-text block">AIVORA</span>
            <span className="text-xs text-pink-600 font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3" /> Admin
            </span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-slate-500 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-3 border-b border-pink-100">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-50/70 border border-pink-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-pink-600 font-medium">Administrator</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto hide-scrollbar">
        {adminLinks.map(({ icon: Icon, label, to, isApproval }) => (
          <NavLink
            key={`${to}-${label}`}
            to={to}
            end={to === '/admin/dashboard'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${
                isActive
                  ? 'bg-pink-100/70 text-pink-700 font-black border border-pink-200 shadow-xs'
                  : 'text-slate-700 hover:text-pink-600 hover:bg-pink-50/70'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? 'text-pink-600' : 'text-slate-500 group-hover:text-pink-600'
                  }`}
                />
                <span className="flex-1 truncate">{label}</span>
                {isApproval && pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-black shadow-xs">
                    {pendingCount}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-pink-600" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-pink-100 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 hover:text-pink-600 hover:bg-pink-50 transition-all font-semibold"
        >
          <Globe className="w-4 h-4 text-slate-500" />
          <span>View Site</span>
        </Link>
        <button
          onClick={() => {
            useAuthStore.getState().logout()
            navigate('/')
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-600 hover:bg-rose-50 transition-all w-full font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#fff5f7] flex admin-scope">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-pink-100 fixed inset-y-0 left-0 z-30 shadow-sm">
        <AdminSidebar />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="fixed inset-y-0 left-0 w-60 bg-white border-r border-pink-100 z-50 lg:hidden shadow-2xl"
            >
              <AdminSidebar onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white border-b border-pink-100 h-14 flex items-center justify-between px-4 md:px-6 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-pink-50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-800 hidden sm:inline-block">
              AIVORA Platform Administration
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/payments"
              className="px-3 py-1.5 rounded-xl bg-pink-50 border border-pink-200 text-xs font-bold text-pink-700 hover:bg-pink-100 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify Payments</span>
            </Link>
            <Link
              to="/"
              className="text-xs text-slate-600 hover:text-pink-600 flex items-center gap-1 font-semibold"
            >
              <Globe className="w-3.5 h-3.5" /> Site
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
