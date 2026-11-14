import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import CourseCard from './CourseCard'
import { SkeletonCard } from '../ui/Skeleton'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import courseService from '../../services/courseService'

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

export default function FeaturedCourses() {
  const [activeFilter, setActiveFilter] = useState(filterTabs[0])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewCourse, setPreviewCourse] = useState(null)

  useEffect(() => {
    let isMounted = true
    const fetchCourses = async () => {
      setLoading(true)
      try {
        const params = { limit: 6 }
        if (activeFilter.type === 'level') params.level = activeFilter.id
        if (activeFilter.type === 'category') params.category = activeFilter.id
        const res = await courseService.getAllCourses(params)
        if (isMounted) {
          setCourses(res?.data || [])
        }
      } catch {
        if (isMounted) setCourses([])
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
    <section className="py-24 relative bg-aivora-navy/50 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass border border-aivora-indigo/30 text-xs font-semibold uppercase tracking-wider text-aivora-cyan mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Course Marketplace
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white">
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
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-4 mb-8">
          {filterTabs.map((tab) => {
            const active = activeFilter.id === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-gradient-to-r from-aivora-indigo to-aivora-purple text-white shadow-glow-indigo'
                    : 'glass text-slate-400 hover:text-white'
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                onPreview={(c) => setPreviewCourse(c)}
              />
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-12 text-center border border-white/10">
            <p className="text-lg font-semibold text-white mb-2">
              No courses found for &ldquo;{activeFilter.label}&rdquo; yet.
            </p>
            <p className="text-sm text-slate-400 mb-6">
              Try another category filter or browse our full catalog.
            </p>
            <Button onClick={() => setActiveFilter(filterTabs[0])}>Reset Filter</Button>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
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
