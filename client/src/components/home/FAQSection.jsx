import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'

const defaultFaqs = [
  {
    question: 'Who can join AIVORA?',
    answer:
      'AIVORA is built for beginners, content creators, influencers, entrepreneurs, digital marketers, filmmakers, YouTubers, and creative professionals worldwide who want to master modern AI production tools.',
  },
  {
    question: 'Do I need previous AI experience?',
    answer:
      'No previous AI, coding, or film studio experience is needed. Every course starts with clear fundamentals and progresses step-by-step into practical projects.',
  },
  {
    question: 'How do I access my courses?',
    answer:
      'Once you create an account and complete a verified payment, your course is immediately unlocked inside your Student Dashboard under "My Learning".',
  },
  {
    question: 'What payment methods are accepted?',
    answer:
      'We accept Nigerian Naira payments (cards, bank transfer, USSD) via Paystack as well as supported international payment cards.',
  },
  {
    question: 'Can I learn on my phone?',
    answer:
      'Yes! AIVORA is fully responsive across Android phones, iPhones, tablets, laptops, and desktop computers, including our mobile-optimized course video player.',
  },
  {
    question: 'Are courses available permanently?',
    answer:
      'Courses provide ongoing on-demand access where specified, so you can learn at your own pace and revisit lessons whenever you need a refresher.',
  },
  {
    question: 'Do I receive certificates?',
    answer:
      'Yes. When you complete 100% of the lessons in a course, you can generate and download a verifiable AIVORA Certificate of Completion from your dashboard.',
  },
  {
    question: 'What happens if payment fails?',
    answer:
      'If a payment fails or is interrupted, no unauthorized access is granted. You can retry checkout or contact Support with your payment reference for immediate verification.',
  },
  {
    question: 'How can I contact support?',
    answer:
      'You can open a support ticket directly inside your Student Dashboard or reach us via our Contact page and support email.',
  },
]

export default function FAQSection({ faqs = [] }) {
  const list = faqs.length > 0 ? faqs : defaultFaqs
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="py-24 relative bg-aivora-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass border border-aivora-indigo/30 text-xs font-semibold uppercase tracking-wider text-aivora-indigo mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white mb-4">
            Got <span className="gradient-text">Questions?</span>
          </h2>
          <p className="text-slate-400 text-base">
            Everything you need to know about learning with AIVORA.
          </p>
        </div>

        <div className="space-y-3">
          {list.map((item, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={item._id || idx}
                className={`rounded-2xl transition-all border ${
                  isOpen
                    ? 'glass-dark border-aivora-indigo/50 shadow-glow-indigo'
                    : 'glass border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="text-base font-display font-semibold text-white">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-aivora-indigo flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
