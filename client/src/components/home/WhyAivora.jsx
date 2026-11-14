import { motion } from 'framer-motion'
import {
  CheckCircle2, Users, Lightbulb, Infinity as InfinityIcon,
  Download, Clock, Compass, Headphones
} from 'lucide-react'

const reasons = [
  {
    icon: CheckCircle2,
    title: 'Practical Step-by-Step Lessons',
    description: 'Clear, structured video walkthroughs that guide you from concept to finished production.',
  },
  {
    icon: Users,
    title: 'Beginner-Friendly Training',
    description: 'Designed for creators of all backgrounds—no coding or studio engineering required.',
  },
  {
    icon: Lightbulb,
    title: 'Real-World AI Projects',
    description: 'Build portfolio-ready AI commercials, character animations, voiceovers, and short films.',
  },
  {
    icon: InfinityIcon,
    title: 'Lifetime Access Where Specified',
    description: 'Revisit lessons and updated workflow modules anytime on eligible courses.',
  },
  {
    icon: Download,
    title: 'Downloadable Resources',
    description: 'Access curated prompt libraries, project checklists, and reference sheets where permitted.',
  },
  {
    icon: Clock,
    title: 'Learn at Your Own Pace',
    description: 'Stream HD lessons on desktop, tablet, or mobile whenever your schedule allows.',
  },
  {
    icon: Compass,
    title: 'Structured Learning Paths',
    description: 'Progress logically from foundational prompting to advanced multi-scene direction.',
  },
  {
    icon: Headphones,
    title: 'Dedicated Student Support',
    description: 'Direct access to our support ticket system for technical or course assistance.',
  },
]

export default function WhyAivora() {
  return (
    <section className="py-24 relative bg-aivora-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6">
            <span className="inline-block px-3.5 py-1.5 rounded-full glass border border-aivora-indigo/30 text-xs font-semibold uppercase tracking-wider text-aivora-indigo">
              The AIVORA Advantage
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white leading-tight">
              Why Creators Choose <span className="gradient-text">AIVORA</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              We focus on practical execution, commercial polish, and ethical AI production workflows so you can create extraordinary digital media independently.
            </p>

            {/* Visual Studio Card */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-card">
              <img
                src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=900&q=80"
                alt="AIVORA Creative Production Environment"
                loading="lazy"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-aivora-dark via-aivora-dark/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 glass-dark p-4 rounded-xl border border-white/10">
                <p className="text-sm font-bold text-white">
                  Built for Modern Filmmakers, Marketers & Digital Creators
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Structured modules • Verifiable certificates • Multi-device learning
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: 8 Feature Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reasons.map((item, idx) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="glass rounded-2xl p-5 border border-white/10 hover:border-aivora-indigo/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aivora-indigo/20 to-aivora-purple/20 border border-aivora-indigo/30 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-aivora-indigo" />
                  </div>
                  <h3 className="text-base font-display font-bold text-white mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
