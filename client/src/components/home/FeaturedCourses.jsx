import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import CourseCard from './CourseCard'
import { SkeletonCard } from '../ui/Skeleton'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import courseService from '../../services/courseService'
import CourseMediaPreview, { normalizeMediaUrl } from '../common/CourseMediaPreview'

const filterTabs = [
  { id: 'all', label: 'All Courses', type: 'all' },
  { id: 'beginner', label: 'Beginner', type: 'level' },
  { id: 'intermediate', label: 'Intermediate', type: 'level' },
  { id: 'advanced', label: 'Advanced', type: 'level' },
  { id: 'ai-video-creation', label: 'AI Video', type: 'category' },
  { id: 'ai-voice-cloning', label: 'AI Voice', type: 'category' },
  { id: 'ai-character-transformation', label: 'AI Characters', type: 'category' },
  { id: 'image-to-video', label: 'Image Animation', type: 'category' },
]

// Initial instant-render courses so mobile users see content in 0ms while fresh data hydrates
const INITIAL_COURSES = [
  {
    _id: 'initial-image-to-video',
    title: 'IMAGE to VIDEO',
    slug: 'image-to-video',
    shortDescription: 'Image to a talking video',
    thumbnail: null,
    previewVideo: '/uploads/videos/1794654991023-Empty-1794653741016.mp4',
    category: { name: 'Image to Video', slug: 'image-to-video' },
    instructor: { name: 'AIVORA Administrator' },
    price: 10000,
    discountPrice: null,
    level: 'beginner',
    totalLessons: 1,
    totalDuration: 300,
    rating: { avg: 0, count: 0 },
  },
  {
    _id: 'initial-voice-cloning',
    title: '[Demo] Professional AI Voiceover & Consent-Based Voice Studio',
    slug: 'demo-professional-ai-voiceover-consent-based-voice-studio',
    shortDescription:
      'Produce studio-grade narration, multilingual dubbing, and authorized voice clones with emotional nuance.',
    thumbnail: null,
    previewVideo: '/api/v1/media/videos/voice-cloning-studio.mp4',
    category: { name: 'AI Voice Cloning', slug: 'ai-voice-cloning' },
    instructor: { name: 'AIVORA Administrator' },
    price: 38000,
    discountPrice: 24000,
    level: 'beginner',
    totalLessons: 1,
    totalDuration: 490,
    rating: { avg: 0, count: 0 },
  },
  {
    _id: 'initial-character-design',
    title: '[Demo] Authorized AI Character Design & Talking Avatars',
    slug: 'demo-authorized-ai-character-design-talking-avatars',
    shortDescription:
      'Design consistent fictional characters, realistic digital presenters, and lip-synced avatars ethically.',
    thumbnail: null,
    previewVideo: '/api/v1/media/videos/ai-character-avatar.mp4',
    category: { name: 'AI Character Transformation', slug: 'ai-character-transformation' },
    instructor: { name: 'AIVORA Administrator' },
    price: 55000,
    discountPrice: 35000,
    level: 'intermediate',
    totalLessons: 2,
    totalDuration: 1400,
    rating: { avg: 0, count: 0 },
  },
  {
    _id: 'initial-cinematic-video',
    title: '[Demo] Cinematic AI Video Production Masterclass',
    slug: 'demo-cinematic-ai-video-production-masterclass',
    shortDescription:
      'Master text-to-video, camera motion control, lighting direction, and commercial AI filmmaking from scratch.',
    thumbnail: null,
    previewVideo: '/api/v1/media/videos/cinematic-ai-video.mp4',
    category: { name: 'AI Video Creation', slug: 'ai-video-creation' },
    instructor: { name: 'AIVORA Administrator' },
    price: 45000,
    discountPrice: 29500,
    level: 'beginner',
    totalLessons: 3,
    totalDuration: 2120,
    rating: { avg: 0, count: 0 },
  },
]

// Initial instant-render courses with persistent browser cache so reloads have 0ms delay
const getInitialFeaturedCourses = () => {
  try {
    const cached = localStorage.getItem('aivora_cached_featured_courses')
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return INITIAL_COURSES
}

export default function FeaturedCourses() {
  const [activeFilter, setActiveFilter] = useState(filterTabs[0])
  const [courses, setCourses] = useState(getInitialFeaturedCourses)
  const [loading, setLoading] = useState(false)
  const [previewCourse, setPreviewCourse] = useState(null)

  useEffect(() => {
    let isMounted = true
    const fetchCourses = async () => {
      if (activeFilter.id !== 'all') setLoading(true)
      try {
        const params = { limit: 6 }
        if (activeFilter.type === 'level') params.level = activeFilter.id
        if (activeFilter.type === 'category') params.category = activeFilter.id
        const res = await courseService.getAllCourses(params)
        if (isMounted && res?.data?.length) {
          setCourses(res.data)
          if (activeFilter.id === 'all') {
            try {
              localStorage.setItem('aivora_cached_featured_courses', JSON.stringify(res.data))
            } catch {}
          }
        } else if (isMounted && activeFilter.id !== 'all') {
          setCourses([])
        }
      } catch {
        // Keep initial courses on network hiccup
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchCourses()
    return () => {
      isMounted = false
    }
  }, [activeFilter])

  return (
    <section className="py-14 sm:py-24 relative bg-pink-50/40 border-y border-pink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pink-100/70 border border-pink-200 text-xs font-semibold uppercase tracking-wider text-pink-700 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Course Marketplace
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-display font-black text-slate-900">
              Featured <span className="gradient-text">AI Courses</span>
            </h2>
          </div>
          <Link to="/courses">
            <Button variant="secondary" iconRight={<ArrowRight className="w-4 h-4" />}>
              View All Courses
            </Button>
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-3 mb-6 sm:mb-8">
          {filterTabs.map((tab) => {
            const active = activeFilter.id === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${
                  active
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-glow-pink'
                    : 'bg-white text-slate-700 border border-pink-100 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                onPreview={(c) => setPreviewCourse(c)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-pink-100 shadow-sm">
            <p className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
              No courses found for &ldquo;{activeFilter.label}&rdquo; yet.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mb-6">
              Try another category filter or browse our full catalog.
            </p>
            <Button onClick={() => setActiveFilter(filterTabs[0])}>Reset Filter</Button>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-10 sm:mt-12 text-center">
          <Link to="/courses">
            <Button size="lg" iconRight={<ArrowRight className="w-5 h-5" />}>
              View All Courses
            </Button>
          </Link>
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
              <CourseMediaPreview
                course={previewCourse}
                className="w-full h-auto max-h-[75vh] object-contain"
                autoPlay={true}
                muted={false}
                loop={true}
                controls={true}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-slate-700">{previewCourse.shortDescription}</p>
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
