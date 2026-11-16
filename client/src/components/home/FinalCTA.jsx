import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
import Button from '../ui/Button'

export default function FinalCTA() {
  return (
    <section className="py-12 sm:py-20 lg:py-24 relative overflow-hidden bg-[#fff5f7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden border border-pink-200 p-8 sm:p-14 lg:p-16 text-center bg-gradient-to-br from-pink-50 via-rose-50/50 to-white shadow-xl"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-pink-300/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-rose-200/25 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-pink-200 text-xs font-semibold text-pink-700 shadow-sm">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span>Begin Your AI Creative Journey</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-slate-900 leading-tight">
              Your Next Creative Breakthrough{' '}
              <span className="gradient-text">Starts Here.</span>
            </h2>

            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
              Join AIVORA today and master practical AI video production, character creation, realistic voiceovers, and cinematic storytelling at your own pace.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/courses">
                <Button
                  variant="primary"
                  size="lg"
                  iconRight={<ArrowRight className="w-5 h-5" />}
                >
                  Start Learning with AIVORA
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button variant="secondary" size="lg">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
