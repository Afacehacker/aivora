import { motion } from 'framer-motion'
import { Quote, MessageSquarePlus } from 'lucide-react'
import StarRating from '../ui/StarRating'

export default function Testimonials({ testimonials = [] }) {
  const approved = testimonials.filter((t) => t.isApproved !== false)

  return (
    <section className="py-24 relative bg-aivora-navy/40 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block px-3.5 py-1.5 rounded-full glass border border-aivora-indigo/30 text-xs font-semibold uppercase tracking-wider text-aivora-cyan mb-3">
            Verified Student Feedback
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white mb-4">
            Student <span className="gradient-text">Testimonials</span>
          </h2>
          <p className="text-slate-400 text-base">
            We only display genuine reviews submitted by verified enrolled students.
          </p>
        </div>

        {approved.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approved.map((item, idx) => (
              <motion.div
                key={item._id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="glass rounded-2xl p-6 border border-white/10 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <StarRating rating={item.rating || 5} />
                    <Quote className="w-6 h-6 text-aivora-indigo/40" />
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    &ldquo;{item.comment}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aivora-indigo to-aivora-purple flex items-center justify-center text-white font-bold text-sm">
                    {item.name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.role || 'Verified Student'}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto glass rounded-2xl p-10 text-center border border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-aivora-indigo/10 border border-aivora-indigo/30 flex items-center justify-center mx-auto mb-4">
              <MessageSquarePlus className="w-7 h-7 text-aivora-indigo" />
            </div>
            <h3 className="text-lg font-display font-bold text-white mb-2">
              Genuine Student Reviews Only
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              AIVORA does not fabricate ratings or student reviews. As enrolled students complete courses and submit verified feedback, their reviews appear here automatically.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
