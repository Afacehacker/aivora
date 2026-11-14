import { motion } from 'framer-motion'

export default function PageLoader() {
  return (
    <div className="fixed inset-0 bg-aivora-dark flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-display font-black gradient-text"
        >
          AIVORA
        </motion.div>

        {/* Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-2 border-aivora-indigo/20 border-t-aivora-indigo"
        />
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}
