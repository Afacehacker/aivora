import { motion } from 'framer-motion'
import {
  Search, UserPlus, CreditCard, Unlock, PlayCircle, Award
} from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: Search,
    title: 'Choose Your Preferred Course',
    description: 'Browse our specialized AI video tutorials and pick the skill track that matches your creative goals.',
  },
  {
    step: '02',
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Register your personal AIVORA student profile in under a minute.',
  },
  {
    step: '03',
    icon: CreditCard,
    title: 'Make a Secure Payment',
    description: 'Complete checkout safely in Nigerian Naira or international currency via verified gateways.',
  },
  {
    step: '04',
    icon: Unlock,
    title: 'Get Instant Verified Access',
    description: 'Once your transaction is verified by our backend, your course unlocks immediately.',
  },
  {
    step: '05',
    icon: PlayCircle,
    title: 'Watch Lessons & Complete Projects',
    description: 'Stream HD lessons, track your progress automatically, and build real-world AI productions.',
  },
  {
    step: '06',
    icon: Award,
    title: 'Download Resources & Earn Certificates',
    description: 'Access permitted project files and claim your verifiable AIVORA certificate upon completion.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-12 sm:py-20 lg:py-24 relative bg-white border-y border-pink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-pink-100/70 border border-pink-200 text-xs font-semibold uppercase tracking-wider text-pink-700 mb-3 shadow-sm">
            Simple Learning Journey
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-slate-900 mb-4">
            How <span className="gradient-text">AIVORA Works</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            From your first course selection to earning your completion certificate in six seamless steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="relative bg-[#fff5f7] rounded-2xl p-6 border border-pink-100 hover:border-pink-300 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-sm">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-display font-black text-pink-200">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-display font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
