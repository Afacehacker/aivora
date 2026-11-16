import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, PlayCircle, CheckCircle2, Award, ArrowRight } from 'lucide-react'
import SEO from '../../components/common/SEO'
import ProgressBar from '../../components/ui/ProgressBar'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import CourseMediaPreview from '../../components/common/CourseMediaPreview'
import useAuthStore from '../../store/authStore'
import courseService from '../../services/courseService'
import api from '../../services/api'

export default function DashboardOverview() {
  const { user } = useAuthStore()
  const [enrollments, setEnrollments] = useState([])
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      courseService.getMyEnrollments(),
      api.get('/certificates/my').catch(() => ({ data: [] })),
    ])
      .then(([enrRes, certRes]) => {
        if (isMounted) {
          setEnrollments(enrRes?.data || [])
          setCertificates(certRes?.data || [])
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const inProgress = enrollments.filter((e) => e.progress > 0 && e.progress < 100)
  const completed = enrollments.filter((e) => e.progress >= 100)

  const stats = [
    { label: 'Enrolled Courses', value: enrollments.length, icon: BookOpen, color: 'text-aivora-indigo' },
    { label: 'In Progress', value: inProgress.length, icon: PlayCircle, color: 'text-aivora-cyan' },
    { label: 'Completed', value: completed.length, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Certificates', value: certificates.length, icon: Award, color: 'text-amber-400' },
  ]

  return (
    <>
      <SEO title="Student Dashboard — AIVORA" />

      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-aivora-navy via-indigo-950/60 to-purple-950/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-white">
              Welcome back, <span className="gradient-text">{user?.name}</span>!
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Track your AI creative learning progress and pick up right where you left off.
            </p>
          </div>
          <Link to="/courses">
            <Button size="sm" iconRight={<ArrowRight className="w-4 h-4" />}>
              Explore More Courses
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="glass rounded-2xl p-5 border border-white/10 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-display font-black text-white">{s.value}</p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Continue Learning */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-white">My Enrolled Courses</h2>
            <Link to="/dashboard/learning" className="text-xs text-aivora-indigo hover:underline">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-36 rounded-2xl glass animate-pulse" />
              ))}
            </div>
          ) : enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {enrollments.slice(0, 4).map((enr) => {
                const course = enr.course
                if (!course) return null
                return (
                  <div
                    key={enr._id}
                    className="glass rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row gap-4 items-center"
                  >
                    <CourseMediaPreview
                      course={course}
                      className="w-full sm:w-32 h-24 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 w-full space-y-2.5">
                      <h3 className="text-sm font-display font-bold text-white line-clamp-1">
                        {course.title}
                      </h3>
                      <ProgressBar value={enr.progress || 0} showLabel />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-400">
                          {enr.completedLessons?.length || 0} / {course.totalLessons || 0} tutorial videos
                        </span>
                        <Link
                          to={`/dashboard/learn/${course._id}`}
                          className="text-xs font-semibold text-aivora-cyan hover:underline"
                        >
                          {enr.progress > 0 ? 'Continue Learning →' : 'Start Course →'}
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="You haven't enrolled in any courses yet"
              description="Browse our AI video, voiceover, and character creation courses to start learning today."
              ctaLabel="Explore Courses"
              ctaHref="/courses"
            />
          )}
        </div>
      </div>
    </>
  )
}
