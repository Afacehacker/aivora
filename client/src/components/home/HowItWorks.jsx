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
    <section id="how-it-works" className="py-12 sm:py-20 lg:py-24 relative bg-aivora-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <span className="inline-block px-3.5 py-1.5 rounded-full glass border border-aivora-indigo/30 text-xs font-semibold uppercase tracking-wider text-aivora-indigo mb-3">
            Simple Learning Journey
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white mb-4">
            How <span className="gradient-text">AIVORA Works</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
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
                className="relative glass rounded-2xl p-6 border border-white/10 hover:border-aivora-indigo/40 transition-all"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-aivora-indigo to-aivora-purple flex items-center justify-center shadow-glow-indigo">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-display font-black text-white/10">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-display font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
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
