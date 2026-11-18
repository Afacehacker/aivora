import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, PlayCircle, ChevronLeft, ChevronRight,
  Download, FileText, Award, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Button from '../../components/ui/Button'
import ProgressBar from '../../components/ui/ProgressBar'
import PageLoader from '../../components/common/PageLoader'
import { cleanLessonTitle } from '../../utils/lessonTitle'
import { normalizeMediaUrl } from '../../utils/mediaUrl'
import api from '../../services/api'

const speeds = [0.75, 1, 1.25, 1.5, 2]

export default function CoursePlayerPage() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const videoRef = useRef(null)

  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [lessons, setLessons] = useState([])
  const [activeLesson, setActiveLesson] = useState(null)
  const [completedIds, setCompletedIds] = useState([])
  const [progress, setProgress] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    let isMounted = true
    const loadPlayerData = async () => {
      setLoading(true)
      try {
        // Verify enrollment
        const enrRes = await api.get(`/enrollments/check/${courseId}`)
        if (!enrRes.data?.isEnrolled) {
          toast.error('You must be enrolled in this course to access the player.')
          navigate('/courses')
          return
        }

        const enrollment = enrRes.data.enrollment
        setCompletedIds((enrollment.completedLessons || []).map(String))
        setProgress(enrollment.progress || 0)

        const [courseRes, modRes, lesRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/courses/${courseId}/modules`),
          api.get(`/courses/${courseId}/lessons`),
        ])

        if (!isMounted) return
        setCourse(courseRes.data)
        setModules(modRes.data || [])
        const allLessons = lesRes.data || []
        setLessons(allLessons)

        // Choose active lesson
        const initialLesson =
          allLessons.find((l) => String(l._id) === String(lessonId)) ||
          allLessons.find((l) => String(l._id) === String(enrollment.lastAccessedLesson)) ||
          allLessons[0] ||
          null

        setActiveLesson(initialLesson)
      } catch (err) {
        toast.error(err.message || 'Could not load course lessons.')
        navigate('/dashboard/learning')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadPlayerData()
    return () => {
      isMounted = false
    }
  }, [courseId, lessonId, navigate])

  // Load saved notes from localStorage per lesson
  useEffect(() => {
    if (activeLesson?._id) {
      const saved = localStorage.getItem(`aivora_notes_${activeLesson._id}`) || ''
      setNotes(saved)
    }
  }, [activeLesson])

  const handleNotesChange = (val) => {
    setNotes(val)
    if (activeLesson?._id) {
      localStorage.setItem(`aivora_notes_${activeLesson._id}`, val)
    }
  }

  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate)
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
    }
  }

  const handleMarkComplete = async () => {
    if (!activeLesson) return
    setMarking(true)
    try {
      const res = await api.patch('/enrollments/progress', {
        courseId,
        lessonId: activeLesson._id,
      })
      const updatedProgress = res.data?.progress ?? progress
      setProgress(updatedProgress)
      if (!completedIds.includes(String(activeLesson._id))) {
        setCompletedIds([...completedIds, String(activeLesson._id)])
      }
      toast.success('Video tutorial marked as completed!')

      if (updatedProgress >= 100) {
        await api.post(`/certificates/generate/${courseId}`).catch(() => {})
        toast.success('Congratulations! You completed 100% of this course!')
      }
    } catch (err) {
      toast.error(err.message || 'Could not update progress')
    } finally {
      setMarking(false)
    }
  }

  if (loading) return <PageLoader />
  if (!course) return null

  const currentIndex = lessons.findIndex((l) => String(l._id) === String(activeLesson?._id))
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  const isCurrentCompleted = activeLesson && completedIds.includes(String(activeLesson._id))

  return (
    <>
      <SEO
        title={`${cleanLessonTitle(activeLesson?.title, currentIndex >= 0 ? currentIndex : 0)} — Course Player`}
      />

      <div className="min-h-screen bg-aivora-dark flex flex-col">
        {/* Top Bar */}
        <header className="h-16 glass-dark border-b border-white/10 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/dashboard/learning"
              className="p-2 rounded-lg glass text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <p className="text-xs text-aivora-cyan font-semibold uppercase tracking-wider">
                AIVORA Course Player
              </p>
              <h1 className="text-sm sm:text-base font-display font-bold text-white truncate">
                {course.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 w-48">
              <ProgressBar value={progress} showLabel />
            </div>
            {progress >= 100 && (
              <Link to="/dashboard/certificates">
                <Button size="sm" iconLeft={<Award className="w-4 h-4 text-amber-400" />}>
                  Certificate
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Main Split Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
          {/* Video & Lesson Content Area */}
          <div className="lg:col-span-8 xl:col-span-9 p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Video Player */}
            <div className="aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-card">
              {activeLesson?.videoUrl ? (
                <video
                  ref={videoRef}
                  key={activeLesson._id || activeLesson.videoUrl}
                  src={normalizeMediaUrl(activeLesson.videoUrl)}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  controlsList="nodownload"
                  onEnded={handleMarkComplete}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                  <Sparkles className="w-10 h-10 text-aivora-indigo mb-2" />
                  <p className="text-sm">Select a video tutorial to begin streaming.</p>
                </div>
              )}
            </div>

            {/* Player Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 glass rounded-2xl p-4 border border-white/10">
              {/* Speed Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 mr-1">Speed:</span>
                {speeds.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      playbackRate === s
                        ? 'bg-aivora-indigo text-white'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Navigation & Complete */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!prevLesson}
                  onClick={() => prevLesson && setActiveLesson(prevLesson)}
                  iconLeft={<ChevronLeft className="w-4 h-4" />}
                >
                  Prev
                </Button>

                <Button
                  variant={isCurrentCompleted ? 'secondary' : 'primary'}
                  size="sm"
                  loading={marking}
                  onClick={handleMarkComplete}
                  iconLeft={<CheckCircle2 className="w-4 h-4" />}
                >
                  {isCurrentCompleted ? 'Completed' : 'Mark Complete'}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!nextLesson}
                  onClick={() => nextLesson && setActiveLesson(nextLesson)}
                  iconRight={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>

            {/* Lesson Title & Description */}
            {activeLesson && (
              <div className="glass rounded-2xl p-6 border border-white/10 space-y-3">
                <h2 className="text-xl font-display font-bold text-white">
                  {cleanLessonTitle(activeLesson.title, currentIndex >= 0 ? currentIndex : 0)}
                </h2>
                {activeLesson.description && (
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {activeLesson.description}
                  </p>
                )}
                {activeLesson.content && (
                  <div className="text-sm text-slate-300 pt-3 border-t border-white/5 whitespace-pre-line">
                    {activeLesson.content}
                  </div>
                )}
              </div>
            )}

            {/* Downloadable Resources & Personal Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resources */}
              <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
                <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-aivora-cyan" />
                  Downloadable Resources
                </h3>
                {activeLesson?.resources?.length > 0 ? (
                  <div className="space-y-2">
                    {activeLesson.resources.map((res, idx) => (
                      <a
                        key={idx}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-slate-200 transition-colors"
                      >
                        <span className="truncate">{res.title || 'Course Resource'}</span>
                        <Download className="w-4 h-4 text-aivora-indigo flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    No downloadable attachments for this specific lesson.
                  </p>
                )}
              </div>

              {/* Personal Lesson Notes */}
              <div className="glass rounded-2xl p-6 border border-white/10 space-y-3">
                <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-aivora-indigo" />
                  My Lesson Notes (Auto-Saved)
                </h3>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Jot down prompts, timestamps, or key takeaways..."
                  className="w-full rounded-xl bg-aivora-navy border border-white/10 p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-aivora-indigo/50"
                />
              </div>
            </div>
          </div>

          {/* Right Curriculum Sidebar */}
          <aside className="lg:col-span-4 xl:col-span-3 glass-dark border-l border-white/10 p-4 sm:p-5 overflow-y-auto max-h-screen">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-slate-400 mb-4">
              Video Tutorials ({completedIds.length}/{lessons.length})
            </h3>

            <div className="space-y-4">
              {modules.map((mod) => {
                const modLessons = lessons.filter(
                  (l) => String(l.module?._id || l.module) === String(mod._id)
                )
                return (
                  <div
                    key={mod._id}
                    className="rounded-2xl border border-white/10 overflow-hidden bg-aivora-navy/60"
                  >
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-xs font-bold text-white">{mod.title}</p>
                    </div>
                    <div className="divide-y divide-white/5">
                      {modLessons.map((lesson) => {
                        const lIdx = lessons.findIndex((l) => String(l._id) === String(lesson._id))
                        const isActive = String(activeLesson?._id) === String(lesson._id)
                        const isDone = completedIds.includes(String(lesson._id))
                        return (
                          <button
                            key={lesson._id}
                            type="button"
                            onClick={() => setActiveLesson(lesson)}
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 text-xs transition-colors ${
                              isActive
                                ? 'bg-aivora-indigo/20 text-white font-semibold'
                                : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <PlayCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            )}
                            <span className="flex-1 line-clamp-2">
                              {cleanLessonTitle(lesson.title, lIdx >= 0 ? lIdx : 0)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
