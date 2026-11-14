import { useState } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, Users, ShoppingCart, Star, Settings,
  Globe, Headphones, Tag, FolderOpen, Menu, X, Sparkles, LogOut,
  Bell, ChevronRight, Shield
} from 'lucide-react'
import useAuthStore from '../store/authStore'

const adminLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/admin/dashboard' },
  { icon: BookOpen, label: 'Courses', to: '/admin/courses' },
  { icon: FolderOpen, label: 'Categories', to: '/admin/categories' },
  { icon: Users, label: 'Students', to: '/admin/students' },
  { icon: ShoppingCart, label: 'Orders', to: '/admin/orders' },
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aivora-indigo to-aivora-purple flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-display font-black gradient-text block">AIVORA</span>
            <span className="text-xs text-slate-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-3 border-b border-white/5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-aivora-indigo/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aivora-indigo to-aivora-purple flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-aivora-indigo">Administrator</p>
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
                  ? 'bg-gradient-to-r from-aivora-indigo/20 to-aivora-purple/10 text-aivora-indigo border border-aivora-indigo/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-aivora-indigo' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-aivora-indigo" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Globe className="w-4 h-4" />
          <span>View Site</span>
        </Link>
        <button
          onClick={() => { useAuthStore.getState().logout(); navigate('/') }}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
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
    <div className="min-h-screen bg-aivora-dark flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-aivora-navy border-r border-white/5 fixed inset-y-0 left-0 z-30">
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="fixed inset-y-0 left-0 w-56 bg-aivora-navy border-r border-white/5 z-50 lg:hidden"
            >
              <AdminSidebar onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="lg:pl-56 flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-aivora-navy/90 backdrop-blur-sm border-b border-white/5 h-14 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-slate-200">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <div className="text-xs text-slate-500 hidden sm:block">
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
