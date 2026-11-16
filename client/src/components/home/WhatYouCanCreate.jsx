import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  UserCheck, Mic2, Clapperboard, Bot, Video,
  Sparkles, Share2, Wand2, ArrowUpRight
} from 'lucide-react'

const creationPillars = [
  {
    id: 1,
    title: 'AI Celebrity & Character Transformation',
    description:
      'Learn authorized likeness workflows, fictional character design, and studio-grade digital character transformations with full IP compliance.',
    icon: UserCheck,
    image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
    categorySlug: 'ai-character-transformation',
    accent: 'from-aivora-indigo to-aivora-purple',
  },
  {
    id: 2,
    title: 'AI Voice Cloning & Voiceovers',
    description:
      'Produce broadcast-quality narration, emotional voiceovers, multilingual dubbing, and consent-based voice replication.',
    icon: Mic2,
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
    categorySlug: 'ai-voice-cloning',
    accent: 'from-aivora-cyan to-aivora-blue',
  },
  {
    id: 3,
    title: 'Image-to-Video Animation',
    description:
      'Transform static illustrations, product shots, and portraits into fluid cinematic video sequences with natural camera motion.',
    icon: Clapperboard,
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    categorySlug: 'image-to-video',
    accent: 'from-aivora-magenta to-aivora-purple',
  },
  {
    id: 4,
    title: 'AI Talking Avatars',
    description:
      'Build lifelike digital presenters and lip-synced virtual spokespeople for training videos, brand storytelling, and global presentations.',
    icon: Bot,
    image: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=800&q=80',
    categorySlug: 'ai-talking-avatars',
    accent: 'from-aivora-indigo to-aivora-cyan',
  },
  {
    id: 5,
    title: 'Cinematic AI Video Creation',
    description:
      'Direct high-definition scenes from text prompts with precise control over lighting, lens depth, atmosphere, and pacing.',
    icon: Video,
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    categorySlug: 'ai-video-creation',
    accent: 'from-aivora-purple to-aivora-indigo',
  },
  {
    id: 6,
    title: 'AI Storytelling & Short Films',
    description:
      'Combine scriptwriting, storyboarding, multi-shot character continuity, and sound design to produce complete AI short films.',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
    categorySlug: 'ai-short-film-production',
    accent: 'from-amber-500 to-aivora-magenta',
  },
  {
    id: 7,
    title: 'AI Content Creation for Social Media',
    description:
      'Create scroll-stopping visual hooks, faceless YouTube channels, TikTok series, and Instagram Reels at 10x studio speed.',
    icon: Share2,
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
    categorySlug: 'ai-content-creation',
    accent: 'from-emerald-400 to-aivora-cyan',
  },
  {
    id: 8,
    title: 'AI Video Editing & Enhancement',
    description:
      'Upscale resolution, interpolate frames, clean audio, automate captions, and color-grade AI footage for commercial delivery.',
    icon: Wand2,
    image: 'https://images.unsplash.com/photo-1574717025058-2f8737d2e2b7?auto=format&fit=crop&w=800&q=80',
    categorySlug: 'ai-video-creation',
    accent: 'from-aivora-blue to-aivora-purple',
  },
]

export default function WhatYouCanCreate() {
  return (
    <section id="what-you-learn" className="py-12 sm:py-20 lg:py-24 relative bg-aivora-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <span className="inline-block px-3.5 py-1.5 rounded-full glass border border-aivora-indigo/30 text-xs font-semibold uppercase tracking-wider text-aivora-indigo mb-4">
            Creative Specializations
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white mb-4">
            What You Can <span className="gradient-text">Create With AIVORA</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Practical, studio-grade training across eight core AI creative disciplines—taught with ethical standards and commercial quality.
          </p>
        </div>

        {/* 8-Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {creationPillars.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                className="group glass rounded-2xl overflow-hidden border border-white/10 hover:border-aivora-indigo/40 transition-all duration-300 flex flex-col shadow-card hover:shadow-card-hover"
              >
                {/* Visual Header */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-aivora-navy via-aivora-navy/40 to-transparent" />
                  <div
                    className={`absolute bottom-3 left-4 w-10 h-10 rounded-xl bg-gradient-to-br ${item.accent} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-display font-bold text-white group-hover:text-aivora-indigo transition-colors mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>

                  <Link
                    to={`/courses?category=${item.categorySlug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-aivora-cyan hover:text-white transition-colors"
                  >
                    <span>Learn More</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
