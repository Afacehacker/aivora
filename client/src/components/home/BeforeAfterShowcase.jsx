import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sliders, Sparkles, Volume2, Clapperboard, ShieldCheck } from 'lucide-react'

const showcaseModes = [
  {
    id: 'character',
    label: 'Character Transformation',
    icon: Sparkles,
    beforeTitle: 'Original Studio Portrait (Licensed)',
    afterTitle: 'AI Stylized Sci-Fi Character',
    beforeImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
    afterImage: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=900&q=80',
    description:
      'Transform consented reference photography into stylized cinematic characters while preserving facial structure and lighting direction.',
  },
  {
    id: 'motion',
    label: 'Static Image vs. Animated Scene',
    icon: Clapperboard,
    beforeTitle: 'Static Concept Artwork',
    afterTitle: 'Cinematic Motion Sequence (24fps)',
    beforeImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80',
    afterImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80',
    description:
      'Bring still concept frames to life with controlled camera dolly motion, atmospheric particles, and dynamic lighting.',
  },
  {
    id: 'voice',
    label: 'Original vs. Authorized Cloned Voice',
    icon: Volume2,
    beforeTitle: 'Raw Microphone Recording',
    afterTitle: 'Studio Neural Voice Master (Consented)',
    beforeImage: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=80',
    afterImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=80',
    description:
      'Convert raw vocal takes into noise-free, broadcast-mastered narration or multilingual dubbing using authorized voice models.',
  },
]

export default function BeforeAfterShowcase() {
  const [activeTab, setActiveTab] = useState(showcaseModes[0])
  const [sliderPos, setSliderPos] = useState(50)

  return (
    <section className="py-24 relative bg-aivora-navy/60 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass border border-aivora-cyan/30 text-xs font-semibold uppercase tracking-wider text-aivora-cyan mb-3">
            <Sliders className="w-3.5 h-3.5" />
            Interactive Transformation Lab
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white mb-4">
            Before & After <span className="gradient-text">AI Showcase</span>
          </h2>
          <p className="text-slate-400 text-base">
            Drag the interactive comparison slider to inspect how raw creative inputs are transformed through AIVORA production workflows.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {showcaseModes.map((mode) => {
            const Icon = mode.icon
            const active = activeTab.id === mode.id
            return (
              <button
                key={mode.id}
                onClick={() => setActiveTab(mode)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-aivora-indigo to-aivora-purple text-white shadow-glow-indigo'
                    : 'glass text-slate-300 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{mode.label}</span>
              </button>
            )
          })}
        </div>

        {/* Interactive Comparison Frame */}
        <motion.div
          key={activeTab.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-white/15 shadow-card-hover select-none bg-aivora-dark">
            {/* After Image (Full layer) */}
            <img
              src={activeTab.afterImage}
              alt={activeTab.afterTitle}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-aivora-dark/80 via-transparent to-transparent" />

            {/* Before Image (Clipped layer) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img
                src={activeTab.beforeImage}
                alt={activeTab.beforeTitle}
                className="absolute inset-0 w-full h-full object-cover filter saturate-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-aivora-dark/80 via-transparent to-transparent" />
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl glass-dark text-xs font-semibold text-slate-200 border border-white/10">
              BEFORE: {activeTab.beforeTitle}
            </div>
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl glass-dark text-xs font-semibold text-aivora-cyan border border-aivora-cyan/30">
              AFTER: {activeTab.afterTitle}
            </div>

            {/* Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_15px_rgba(255,255,255,0.9)] pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-r from-aivora-indigo to-aivora-purple border-2 border-white flex items-center justify-center shadow-lg">
                <Sliders className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Range Input Control */}
            <input
              type="range"
              min="5"
              max="95"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              aria-label="Comparison slider"
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
            />
          </div>

          {/* Caption & Ethical Notice */}
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass rounded-2xl p-5 border border-white/10">
            <p className="text-sm text-slate-300">{activeTab.description}</p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Licensed & Consented Media</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
