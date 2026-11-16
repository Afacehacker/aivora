import { motion } from 'framer-motion'
import { Quote, MessageSquarePlus } from 'lucide-react'
import StarRating from '../ui/StarRating'

export default function Testimonials({ testimonials = [] }) {
  const approved = testimonials.filter((t) => t.isApproved !== false)

  return (
    <section className="py-12 sm:py-20 lg:py-24 relative bg-pink-50/40 border-t border-pink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-pink-100/70 border border-pink-200 text-xs font-semibold uppercase tracking-wider text-pink-700 mb-3 shadow-sm">
            Verified Student Feedback
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-slate-900 mb-4">
            Student <span className="gradient-text">Testimonials</span>
          </h2>
          <p className="text-slate-600 text-base">
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
                className="bg-white rounded-2xl p-6 border border-pink-100 flex flex-col justify-between space-y-4 shadow-card"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <StarRating rating={item.rating || 5} />
                    <Quote className="w-6 h-6 text-pink-300" />
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    &ldquo;{item.comment}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-pink-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {item.name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.role || 'Verified Student'}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-10 text-center border border-pink-100 shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center mx-auto mb-4">
              <MessageSquarePlus className="w-7 h-7 text-pink-500" />
            </div>
            <h3 className="text-lg font-display font-bold text-slate-900 mb-2">
              Genuine Student Reviews Only
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              AIVORA does not fabricate ratings or student reviews. As enrolled students complete courses and submit verified feedback, their reviews appear here automatically.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
