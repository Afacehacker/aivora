import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles, ShieldCheck, Globe, Video, Cpu, Award, ArrowRight
} from 'lucide-react'
import SEO from '../components/common/SEO'
import Button from '../components/ui/Button'

const values = [
  {
    icon: Video,
    title: 'Production-Grade Video Tutorials',
    description:
      'Every course is designed around real creative workflows—from AI video generation and character consistency to studio narration.',
  },
  {
    icon: ShieldCheck,
    title: 'Ethical & Consented AI',
    description:
      'We train creators on proper intellectual property licensing, disclosure, and consent-based likeness and voice workflows.',
  },
  {
    icon: Globe,
    title: 'Accessible Worldwide',
    description:
      'Built for creators in Nigeria, Africa, and across the globe with localized payment options and mobile-ready streaming.',
  },
  {
    icon: Cpu,
    title: 'Modern 2027 AI Toolstack',
    description:
      'Stay ahead with structured training on state-of-the-art generative video, voice synthesis, and digital avatar pipelines.',
  },
]

export default function AboutPage() {
  return (
    <>
      <SEO
        title="About AIVORA"
        description="Learn how AIVORA empowers creators, filmmakers, and entrepreneurs with practical AI creative education."
        url="/about"
      />

      <div className="pt-28 pb-24 bg-aivora-dark min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-aivora-indigo/30 text-xs font-semibold uppercase tracking-wider text-aivora-cyan">
              <Sparkles className="w-3.5 h-3.5" />
              About AIVORA
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-white leading-tight">
              Empowering the Next Generation of{' '}
              <span className="gradient-text">AI Creative Pioneers</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              AIVORA is an international AI technology and creative education platform dedicated to teaching beginners, content creators, filmmakers, and marketers how to produce extraordinary media using modern Artificial Intelligence.
            </p>
          </div>

          {/* Split Story */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-3xl overflow-hidden border border-white/15 shadow-card">
              <img
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80"
                alt="AIVORA Creative Studio"
                className="w-full h-80 sm:h-96 object-cover"
              />
            </div>
            <div className="space-y-5">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                Studio-Quality Production Without Studio Overhead
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Traditionally, producing cinematic visual effects, animated characters, and studio voiceovers required expensive camera rigs, large crews, and months of post-production.
              </p>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                At AIVORA, we break down complex generative AI workflows into structured, step-by-step lessons. Whether you are launching a faceless YouTube channel, directing an AI short film, or producing high-converting brand commercials, our courses give you repeatable systems that work.
              </p>
              <div className="pt-2">
                <Link to="/courses">
                  <Button iconRight={<ArrowRight className="w-4 h-4" />}>
                    Explore Our Courses
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Core Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="glass rounded-2xl p-6 border border-white/10"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-aivora-indigo to-aivora-purple flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-white mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{v.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
