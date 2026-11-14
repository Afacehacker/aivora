import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles, Play, ArrowRight, CheckCircle2, ShieldCheck
} from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import CourseCard from './CourseCard'
import courseService from '../../services/courseService'

const trustPills = [
  'Structured Step-by-Step Training',
  'Practical Real-World AI Workflows',
  'Beginner-Friendly Curriculum',
  'Responsible & Licensed AI Practices',
]

const defaultHeroCourse = {
  _id: '6af843f3af39a92f1c363686',
  title: 'IMAGE to VIDEO',
  slug: 'image-to-video',
  shortDescription: 'Image to a talking video',
  description: 'Learn how to change image to a talking video in less than 5minutes',
  thumbnail: null,
  previewVideo: '/uploads/videos/1794654991023-Empty-1794653741016.mp4',
  category: {
    name: 'Image to Video',
    slug: 'image-to-video',
  },
  instructor: {
    name: 'AIVORA Administrator',
  },
  price: 10000,
  discountPrice: null,
  level: 'beginner',
  totalLessons: 0,
  totalDuration: 0,
  rating: { avg: 0, count: 0 },
}

export default function HeroSection({ settings }) {
  const [heroCourse, setHeroCourse] = useState(defaultHeroCourse)
  const [previewCourse, setPreviewCourse] = useState(null)

  useEffect(() => {
    let isMounted = true
    courseService
      .getCourseBySlug('image-to-video')
      .then((res) => {
        if (isMounted && res?.data) {
          setHeroCourse(res.data)
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  const headline = settings?.heroHeadline || 'Your Imagination. Powered by AI.'
  const subHeadline =
    settings?.heroSubHeadline ||
    'Master the art of AI video creation, digital characters, realistic voice cloning, and cinematic storytelling. Learn the skills to create extraordinary content without expensive equipment or complicated production studios.'

  return (
    <section className="relative flex items-center pt-20 sm:pt-24 pb-12 sm:pb-16 overflow-hidden bg-hero-gradient">
      {/* Ambient Glowing Orbs (Desktop only to prevent mobile GPU lag) */}
      <div className="hidden lg:block absolute top-1/4 -left-32 w-96 h-96 bg-aivora-indigo/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="hidden lg:block absolute bottom-1/4 -right-32 w-96 h-96 bg-aivora-purple/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-aivora-cyan/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-aivora-indigo/30 text-xs sm:text-sm font-medium text-slate-200">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-aivora-cyan flex-shrink-0" />
              <span className="truncate">Next-Generation AI Creative Production Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-black tracking-tight leading-[1.12] text-white">
              {headline.includes('Powered by AI') ? (
                <>
                  Your Imagination.{' '}
                  <span className="gradient-text block sm:inline">Powered by AI.</span>
                </>
              ) : (
                <span className="gradient-text">{headline}</span>
              )}
            </h1>

            {/* Supporting Headline */}
            <p className="text-sm sm:text-lg lg:text-xl text-slate-300 leading-relaxed max-w-2xl">
              {subHeadline}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1">
              <Link to="/courses" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  iconRight={<ArrowRight className="w-5 h-5" />}
                >
                  Explore All Courses
                </Button>
              </Link>
              <Link to="/auth/register" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  iconLeft={<Play className="w-4 h-4 text-aivora-cyan fill-aivora-cyan" />}
                >
                  Start Learning Today
                </Button>
              </Link>
            </div>

            {/* Trust Indicator */}
            <div className="pt-4 sm:pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-aivora-cyan mb-2.5">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Structured, Practical, Beginner-Friendly Training</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {trustPills.map((pill) => (
                  <div key={pill} className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{pill}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Featured Course Product (IMAGE to VIDEO — Image to a talking video) */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <CourseCard
                course={heroCourse}
                onPreview={(c) => setPreviewCourse(c)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Video Modal */}
      <Modal
        isOpen={!!previewCourse}
        onClose={() => setPreviewCourse(null)}
        title={previewCourse?.title || 'Course Preview'}
        maxWidth="max-w-3xl"
      >
        {previewCourse && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <video
                src={previewCourse.previewVideo}
                controls
                autoPlay
                className="w-full h-auto max-h-[75vh] object-contain"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">{previewCourse.shortDescription}</p>
              <Link to={`/courses/${previewCourse.slug}`}>
                <Button size="sm">Go to Course</Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}
