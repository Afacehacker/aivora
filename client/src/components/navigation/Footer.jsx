import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Facebook, Twitter, Instagram, Youtube, Linkedin, Mail, Phone, MapPin, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const footerLinks = {
  'Quick Links': [
    { label: 'Home', to: '/' },
    { label: 'All Courses', to: '/courses' },
    { label: 'About AIVORA', to: '/about' },
    { label: 'Contact Us', to: '/contact' },
  ],
  'Course Categories': [
    { label: 'AI Video Creation', to: '/courses?category=ai-video' },
    { label: 'AI Voice Cloning', to: '/courses?category=ai-voice' },
    { label: 'AI Characters', to: '/courses?category=ai-characters' },
    { label: 'Short Film Production', to: '/courses?category=short-film' },
    { label: 'Social Media AI', to: '/courses?category=social-media' },
  ],
  'Support': [
    { label: 'Help Center', to: '/dashboard/support' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Refund Policy', to: '/refund' },
    { label: 'Disclaimer', to: '/disclaimer' },
  ],
}

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter/X' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'YouTube' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!email) return
    setSubscribing(true)
    setTimeout(() => {
      toast.success('Thank you for subscribing!')
      setEmail('')
      setSubscribing(false)
    }, 1000)
  }

  return (
    <footer className="relative bg-white border-t border-pink-100">
      {/* Gradient divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent opacity-80" />

      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-pink-100/40 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-display font-black gradient-text">AIVORA</span>
            </Link>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              The future of AI creative education. Master cutting-edge AI tools through practical,
              beginner-friendly courses. Your imagination, powered by AI.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-lg bg-pink-50/70 border border-pink-200 flex items-center justify-center text-slate-600 hover:text-pink-600 hover:border-pink-300 transition-colors shadow-sm"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>

            {/* Contact info */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-pink-500 flex-shrink-0" />
                <span>support@aivora.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-pink-500 flex-shrink-0" />
                <span>+1 (555) 000-0000</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-pink-500 flex-shrink-0" />
                <span>Online — Worldwide</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-600 hover:text-pink-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="bg-pink-50/60 border border-pink-200 rounded-2xl p-6 mb-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h4 className="text-base font-semibold text-slate-900 mb-1">Stay ahead of the curve</h4>
              <p className="text-sm text-slate-600">Get the latest AI tutorials and course updates in your inbox.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-3 flex-1 max-w-md">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-pink-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 text-sm shadow-sm"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={subscribing}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60 shadow-sm"
              >
                <Send className="w-4 h-4" />
                {subscribing ? 'Sending…' : 'Subscribe'}
              </motion.button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-pink-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} AIVORA. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {['Terms', 'Privacy', 'Refund Policy', 'Disclaimer'].map((item) => (
              <Link
                key={item}
                to={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-xs text-slate-500 hover:text-pink-600 transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
