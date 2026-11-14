import { useState } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, Award, ShoppingBag, Settings,
  Headphones, Menu, X, Sparkles, LogOut, Bell, ChevronRight
} from 'lucide-react'
import useAuthStore from '../store/authStore'

const sidebarLinks = [
  { icon: LayoutDashboard, label: 'Overview', to: '/dashboard' },
  { icon: BookOpen, label: 'My Learning', to: '/dashboard/learning' },
  { icon: Award, label: 'Certificates', to: '/dashboard/certificates' },
  { icon: ShoppingBag, label: 'Purchase History', to: '/dashboard/purchases' },
  { icon: Settings, label: 'Account Settings', to: '/dashboard/settings' },
  { icon: Headphones, label: 'Support', to: '/dashboard/support' },
]

function Sidebar({ onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aivora-indigo to-aivora-purple flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-display font-black gradient-text">AIVORA</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-aivora-indigo/10 border border-aivora-indigo/20">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aivora-indigo to-aivora-purple flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarLinks.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-aivora-indigo/20 to-aivora-purple/10 text-aivora-indigo border border-aivora-indigo/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-aivora-indigo' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-aivora-indigo" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-aivora-dark flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 glass-dark border-r border-white/5 fixed inset-y-0 left-0 z-30">
        <Sidebar />
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
              className="fixed inset-y-0 left-0 w-72 glass-dark border-r border-white/5 z-50 lg:hidden"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-20 glass-dark border-b border-white/5 h-16 flex items-center justify-between px-4 md:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg glass text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors hidden sm:block">← Back to Site</Link>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg glass text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-aivora-indigo" />
            </button>
            <Link to="/courses" className="hidden sm:flex px-3 py-1.5 rounded-lg bg-gradient-to-r from-aivora-indigo to-aivora-purple text-xs font-semibold text-white hover:opacity-90 transition-opacity">
              Browse Courses
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
