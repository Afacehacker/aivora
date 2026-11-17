import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Sparkles, ExternalLink, ShieldCheck, Zap, MessageSquare, Bell } from 'lucide-react'
import settingsService from '../../services/settingsService'

// Default fallback URL if none configured in admin or environment
export const DEFAULT_TELEGRAM_URL =
  import.meta.env.VITE_TELEGRAM_URL || 'https://t.me/your_telegram_channel'

const SNOOZE_STORAGE_KEY = 'aivora_hide_telegram_popup_until'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

export default function TelegramPopup({ settings: initialSettings = null }) {
  const [isOpen, setIsOpen] = useState(false)
  const [siteSettings, setSiteSettings] = useState(initialSettings)

  // Fetch settings dynamically if not passed from parent
  useEffect(() => {
    if (initialSettings) {
      setSiteSettings(initialSettings)
      return
    }

    let isMounted = true
    settingsService
      .getSiteSettings()
      .then((res) => {
        if (isMounted && res?.data) {
          setSiteSettings(res.data)
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [initialSettings])

  useEffect(() => {
    // Check if user explicitly snoozed via "Don't show again today"
    try {
      const hideUntil = localStorage.getItem(SNOOZE_STORAGE_KEY)
      if (hideUntil) {
        const expiryTime = parseInt(hideUntil, 10)
        if (!isNaN(expiryTime) && Date.now() < expiryTime) {
          return // Snooze active
        } else {
          localStorage.removeItem(SNOOZE_STORAGE_KEY)
        }
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }

    // Fast, quick, and smooth pop-up entrance
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 250)

    return () => clearTimeout(timer)
  }, [])

  // If explicitly disabled by admin in settings
  if (siteSettings?.telegramPopup?.enabled === false) {
    return null
  }

  const primaryUrl =
    siteSettings?.telegramChannelUrl ||
    siteSettings?.telegramPopup?.channelUrl ||
    siteSettings?.socialLinks?.telegram ||
    DEFAULT_TELEGRAM_URL

  const additionalLinks = (siteSettings?.telegramPopup?.additionalLinks || []).filter(
    (item) => item?.url && item?.url.trim() !== ''
  )

  const title = siteSettings?.telegramPopup?.title || 'Join Our Telegram Channel! 🚀'
  const description =
    siteSettings?.telegramPopup?.description ||
    'Be the first to get exclusive website updates, new course drops, free AI video creation prompts, and direct support.'
  const buttonText = siteSettings?.telegramPopup?.buttonText || 'Join Telegram Channel'

  // Action: Snooze for today
  const handleSnooze = () => {
    try {
      const expiry = Date.now() + ONE_DAY_MS
      localStorage.setItem(SNOOZE_STORAGE_KEY, expiry.toString())
    } catch {}
    setIsOpen(false)
  }

  // Action: Dismiss for this session
  const handleDismiss = () => {
    setIsOpen(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden z-10 my-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="telegram-popup-title"
          >
            {/* Top Decorative Banner */}
            <div className="relative h-28 bg-gradient-to-br from-pink-500 via-rose-500 to-[#229ED9] p-6 flex items-center justify-between overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/15 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-sky-400/30 rounded-full blur-lg pointer-events-none" />

              {/* Telegram Icon & Pill */}
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-[#229ED9] p-2.5 transform -rotate-3 hover:rotate-0 transition-transform">
                  <svg
                    className="w-full h-full fill-current"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md">
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                    Official Community
                  </span>
                  <p className="text-white font-bold text-sm tracking-wide mt-1">Aivora Creators Club</p>
                </div>
              </div>

              {/* Close 'X' Button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="relative z-10 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none"
                aria-label="Close popup"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Card Content */}
            <div className="p-6">
              <div className="text-left space-y-2">
                <h3 id="telegram-popup-title" className="text-xl font-extrabold text-slate-900 leading-snug">
                  {title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Perks list */}
              <div className="mt-4 space-y-2 bg-pink-50/60 border border-pink-100/80 rounded-2xl p-3.5 text-xs text-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-pink-500/10 text-pink-600 flex items-center justify-center shrink-0">
                    <Bell className="w-3 h-3" />
                  </div>
                  <span>Instant alerts for new website updates & features</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-pink-500/10 text-pink-600 flex items-center justify-center shrink-0">
                    <Zap className="w-3 h-3" />
                  </div>
                  <span>Free weekly AI video prompts & workflow templates</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-pink-500/10 text-pink-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <span>Early-bird discounts on upcoming courses & tools</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-pink-500/10 text-pink-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                  <span>Direct community support and creator networking</span>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="mt-5 space-y-2.5">
                <a
                  href={primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-[#229ED9] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>{buttonText}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                {/* Additional Community Links configured by admin */}
                {additionalLinks.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {additionalLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100/80 text-sky-900 font-semibold text-xs flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                          <span>{link.label || 'Additional Telegram Link'}</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-sky-500" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Explicit "Don't show again today" Option */}
                <button
                  type="button"
                  onClick={handleSnooze}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-pink-300 bg-white hover:bg-pink-50/40 text-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Don't show again today</span>
                </button>
              </div>

              {/* Quick dismiss link */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Closing will show again on next visit</span>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-slate-500 hover:text-slate-800 hover:underline"
                >
                  Dismiss now
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
