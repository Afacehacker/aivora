import { useState } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, Users, ShoppingCart, Star, Settings,
  Globe, Headphones, Tag, FolderOpen, Menu, X, Sparkles, LogOut,
  Bell, ChevronRight, Shield, CreditCard, CheckCircle2
} from 'lucide-react'
import useAuthStore from '../store/authStore'

const adminLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/admin/dashboard' },
  { icon: CheckCircle2, label: 'Approve Payments', to: '/admin/orders?status=pending' },
  { icon: CreditCard, label: 'Payments & Orders', to: '/admin/orders' },
  { icon: BookOpen, label: 'Courses', to: '/admin/courses' },
  { icon: FolderOpen, label: 'Categories', to: '/admin/categories' },
  { icon: Users, label: 'Students', to: '/admin/students' },
  { icon: Star, label: 'Reviews', to: '/admin/reviews' },
  { icon: Tag, label: 'Coupons', to: '/admin/coupons' },
  { icon: Headphones, label: 'Support', to: '/admin/support' },
  { icon: Globe, label: 'Website', to: '/admin/settings' },
  { icon: Settings, label: 'Settings', to: '/admin/settings' },
]

function AdminSidebar({ onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-5 border-b border-pink-100">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-display font-black gradient-text block">AIVORA</span>
            <span className="text-xs text-pink-600 font-semibold flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>
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
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-pink-600 font-medium">Administrator</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto hide-scrollbar">
        {adminLinks.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={`${to}-${label}`}
            to={to}
            end={to === '/admin/dashboard'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-pink-50 text-pink-600 font-semibold border border-pink-200'
                  : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-pink-600' : 'text-slate-500 group-hover:text-pink-600'}`} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-pink-600" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-pink-100 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-600 hover:text-pink-600 hover:bg-pink-50 transition-all font-medium"
        >
          <Globe className="w-4 h-4" />
          <span>View Site</span>
        </Link>
        <button
          onClick={() => { useAuthStore.getState().logout(); navigate('/') }}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-600 hover:bg-rose-50 transition-all w-full font-medium"
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
    <div className="min-h-screen bg-[#fff5f7] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-pink-100 fixed inset-y-0 left-0 z-30 shadow-sm">
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
              className="fixed inset-y-0 left-0 w-56 bg-white border-r border-pink-100 z-50 lg:hidden shadow-2xl"
            >
              <AdminSidebar onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="lg:pl-56 flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-pink-100 h-14 flex items-center justify-between px-4 md:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-pink-50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-slate-800">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-slate-500 hover:text-pink-600 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <div className="text-xs text-slate-500 hidden sm:block font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
