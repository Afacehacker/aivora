import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Play, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import ProgressBar from '../../components/ui/ProgressBar'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import CourseMediaPreview, { courseUsesVideoCover } from '../../components/common/CourseMediaPreview'
import courseService from '../../services/courseService'
import api from '../../services/api'

export default function MyLearningPage() {
  const [enrollments, setEnrollments] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    courseService
      .getMyEnrollments()
      .then((res) => {
        if (isMounted) setEnrollments(res?.data || [])
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const handleGenerateCertificate = async (courseId) => {
    try {
      await api.post(`/certificates/generate/${courseId}`)
      toast.success('Certificate generated! View it in My Certificates.')
    } catch (err) {
      toast.error(err.message || 'Could not generate certificate.')
    }
  }

  const filtered = enrollments.filter((e) => {
    if (filter === 'in-progress') return e.progress > 0 && e.progress < 100
    if (filter === 'completed') return e.progress >= 100
    return true
  })

  return (
    <>
      <SEO title="My Learning — AIVORA" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">My Learning</h1>
            <p className="text-sm text-slate-400">All courses you have purchased or enrolled in.</p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Courses' },
              { id: 'in-progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filter === tab.id
                    ? 'bg-gradient-to-r from-aivora-indigo to-aivora-purple text-white'
                    : 'glass text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl glass animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((enr) => {
              const course = enr.course
              if (!course) return null
              return (
                <div
                  key={enr._id}
                  className="glass rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-between"
                >
                  <div>
                    <div
                      className={
                        courseUsesVideoCover(course)
                          ? 'relative w-full bg-black flex items-center justify-center overflow-hidden'
                          : 'relative h-44 bg-aivora-navy'
                      }
                    >
                      <CourseMediaPreview
                        course={course}
                        className="w-full h-full object-cover"
                        videoClassName="w-full h-auto max-h-[380px] object-contain block"
                      />
                    </div>
                    <div className="p-5 space-y-3">
                      <h3 className="text-base font-display font-bold text-white line-clamp-2">
                        {course.title}
                      </h3>
                      <ProgressBar value={enr.progress || 0} showLabel />
                      <p className="text-xs text-slate-400">
                        {enr.completedLessons?.length || 0} of {course.totalLessons || 0} lessons completed
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 space-y-2">
                    <Link to={`/dashboard/learn/${course._id}`}>
                      <Button
                        fullWidth
                        size="sm"
                        iconLeft={<Play className="w-4 h-4 fill-white" />}
                      >
                        {enr.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                      </Button>
                    </Link>

                    {enr.progress >= 100 && (
                      <Button
                        variant="secondary"
                        fullWidth
                        size="sm"
                        iconLeft={<Award className="w-4 h-4 text-amber-400" />}
                        onClick={() => handleGenerateCertificate(course._id)}
                      >
                        Claim Certificate
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No courses in this view"
            description="Enroll in a course from the marketplace to start building AI projects."
            ctaLabel="Browse Courses"
            ctaHref="/courses"
          />
        )}
      </div>
    </>
  )
}
