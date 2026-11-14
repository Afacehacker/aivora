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
          scrolled ? 'glass-dark shadow-card' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aivora-indigo to-aivora-purple flex items-center justify-center">
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
                    className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
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
                          ? 'text-aivora-indigo bg-aivora-indigo/10'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
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
                    className="flex items-center gap-2 px-3 py-2 rounded-xl glass hover:bg-white/10 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-aivora-indigo to-aivora-purple flex items-center justify-center text-xs font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-slate-200 max-w-24 truncate">{user?.name}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-52 glass-dark rounded-xl border border-white/10 shadow-card overflow-hidden"
                        onMouseLeave={() => setUserMenuOpen(false)}
                      >
                        <div className="p-3 border-b border-white/10">
                          <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                        <div className="p-1">
                          <Link
                            to="/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                          </Link>
                          <Link
                            to="/dashboard/settings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <User className="w-4 h-4" /> Profile
                          </Link>
                          {user?.role === 'admin' && (
                            <Link
                              to="/admin/dashboard"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-aivora-indigo hover:bg-aivora-indigo/10 transition-colors"
                            >
                              <Shield className="w-4 h-4" /> Admin Panel
                            </Link>
                          )}
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full"
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
              className="md:hidden p-2 rounded-lg glass text-slate-300 hover:text-white"
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="fixed top-0 right-0 bottom-0 w-72 glass-dark border-l border-white/10 z-40 md:hidden flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xl font-display font-black gradient-text">AIVORA</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <nav className="flex flex-col gap-1 flex-1">
                {navLinks.map((link) =>
                  link.isHash ? (
                    <a
                      key={link.to}
                      href={link.to}
                      onClick={() => setMobileOpen(false)}
                      className="px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
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
                            ? 'text-aivora-indigo bg-aivora-indigo/10'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  )
                )}

                {isAuthenticated && (
                  <>
                    <div className="border-t border-white/10 my-3" />
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-aivora-indigo hover:bg-aivora-indigo/10"
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
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
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
