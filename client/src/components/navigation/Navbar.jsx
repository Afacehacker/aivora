import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sparkles, ChevronDown, LogOut, User, LayoutDashboard, Shield } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import Button from '../ui/Button'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Explore Courses', to: '/courses' },
  { label: "What You'll Learn", to: '/#what-you-learn', isHash: true },
  { label: 'How It Works', to: '/#how-it-works', isHash: true },
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md border-b border-pink-100 shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-display font-black gradient-text tracking-tight">AIVORA</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) =>
                link.isHash ? (
                  <a
                    key={link.to}
                    href={link.to}
                    className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-pink-600 bg-pink-50 font-semibold'
                          : 'text-slate-700 hover:text-pink-600 hover:bg-pink-50'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                )
              )}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-pink-200 hover:bg-pink-50 transition-colors shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-slate-800 max-w-24 truncate">{user?.name}</span>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-pink-100 shadow-xl overflow-hidden"
                        onMouseLeave={() => setUserMenuOpen(false)}
                      >
                        <div className="p-3 border-b border-pink-100 bg-pink-50/50">
                          <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                        <div className="p-1">
                          <Link
                            to="/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                          </Link>
                          <Link
                            to="/dashboard/settings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                          >
                            <User className="w-4 h-4" /> Profile
                          </Link>
                          {user?.role === 'admin' && (
                            <Link
                              to="/admin/dashboard"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-pink-600 hover:bg-pink-50 font-medium transition-colors"
                            >
                              <Shield className="w-4 h-4" /> Admin Panel
                            </Link>
                          )}
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 transition-colors w-full"
                          >
                            <LogOut className="w-4 h-4" /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link to="/auth/login">
                    <Button variant="outline" size="sm">Login</Button>
                  </Link>
                  <Link to="/auth/register">
                    <Button variant="primary" size="sm">Get Started</Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg bg-white border border-pink-200 text-slate-700 hover:text-pink-600 shadow-sm"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white border-l border-pink-200 shadow-2xl z-40 md:hidden flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xl font-display font-black gradient-text">AIVORA</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-pink-50"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <nav className="flex flex-col gap-1 flex-1">
                {navLinks.map((link) =>
                  link.isHash ? (
                    <a
                      key={link.to}
                      href={link.to}
                      onClick={() => setMobileOpen(false)}
                      className="px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? 'text-pink-600 bg-pink-50 font-semibold'
                            : 'text-slate-700 hover:text-pink-600 hover:bg-pink-50'
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  )
                )}

                {isAuthenticated && (
                  <>
                    <div className="border-t border-pink-100 my-3" />
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-slate-700 hover:text-pink-600 hover:bg-pink-50 font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-pink-600 hover:bg-pink-50 font-medium"
                      >
                        <Shield className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                  </>
                )}
              </nav>

              <div className="flex flex-col gap-3 mt-6">
                {isAuthenticated ? (
                  <button
                    onClick={() => { handleLogout(); setMobileOpen(false) }}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors font-semibold"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                ) : (
                  <>
                    <Link to="/auth/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" fullWidth>Login</Button>
                    </Link>
                    <Link to="/auth/register" onClick={() => setMobileOpen(false)}>
                      <Button variant="primary" fullWidth>Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
