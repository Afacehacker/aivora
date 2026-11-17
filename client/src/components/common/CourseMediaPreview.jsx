import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { Play } from 'lucide-react'

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|mkv|avi|m4v)(\?.*)?$/i

export function normalizeMediaUrl(url = '') {
  if (!url || typeof url !== 'string') return url
  // Rewrite local dev uploads host to relative /uploads/... so it works seamlessly on Vercel & Render
  return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000\/uploads\//i, '/uploads/')
}

export function isVideoUrl(url = '') {
  if (!url || typeof url !== 'string') return false
  return (
    VIDEO_EXTENSIONS.test(url) ||
    url.includes('/uploads/videos/') ||
    url.includes('/api/v1/media/videos/')
  )
}

export function courseUsesVideoCover(course) {
  return true // Cover is exclusively video
}

/**
 * Product cover display: 100% video.
 * Renders HTML5 <video> directly with preload="auto", playsInline, and autoplay
 * for instant 0ms first-frame rendering and immediate playback on page reload.
 */
export default function CourseMediaPreview({
  course,
  className = 'w-full h-full object-contain object-center',
  videoClassName,
  autoPlay = true,
  muted = true,
  loop = true,
  controls = false,
}) {
  const videoRef = useRef(null)
  const [videoFailed, setVideoFailed] = useState(false)

  const previewVid = normalizeMediaUrl(course?.previewVideo)
  const thumbVid = isVideoUrl(course?.thumbnail) ? normalizeMediaUrl(course?.thumbnail) : null
  const firstLessonVid = normalizeMediaUrl(course?.modules?.[0]?.lessons?.[0]?.videoUrl)

  const rawVideoSrc = previewVid || thumbVid || firstLessonVid
  const shouldRenderVideo = Boolean(rawVideoSrc) && !videoFailed

  // Reset error state if the video URL changes
  useEffect(() => {
    setVideoFailed(false)
  }, [rawVideoSrc])

  // Instant autoplay & viewport intersection handling
  useEffect(() => {
    const el = videoRef.current
    if (!el || !shouldRenderVideo) return

    // Explicitly guarantee muted on both property and attribute for strict browser autoplay policies
    el.muted = muted
    el.defaultMuted = muted

    if (autoPlay) {
      const playPromise = el.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay restricted or delayed by browser power-saver; handled gracefully
        })
      }
    }

    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (autoPlay && el.paused) {
              el.play().catch(() => {})
            }
          } else if (!el.paused) {
            el.pause()
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [shouldRenderVideo, autoPlay, muted, rawVideoSrc])

  if (shouldRenderVideo) {
    const resolvedVideoClass =
      videoClassName ||
      className
        .replace(/\bobject-cover\b/g, 'object-contain')
        .replace(/\bgroup-hover:scale-105\b/g, '')

    const posterImage =
      course?.thumbnail && !isVideoUrl(course.thumbnail)
        ? normalizeMediaUrl(course.thumbnail)
        : undefined

    return (
      <video
        ref={videoRef}
        key={rawVideoSrc}
        src={rawVideoSrc}
        poster={posterImage}
        muted={muted}
        loop={loop}
        playsInline
        autoPlay={autoPlay}
        controls={controls}
        preload="auto"
        onError={() => setVideoFailed(true)}
        className={clsx('bg-black', resolvedVideoClass)}
      />
    )
  }

  return (
    <div
      className={clsx(
        'w-full h-full min-h-[160px] bg-black/90 flex flex-col items-center justify-center gap-2 p-4 text-center',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-aivora-cyan flex items-center justify-center">
        <Play className="w-5 h-5 fill-aivora-cyan" />
      </div>
      <span className="text-xs text-slate-300 font-semibold">{course?.title || 'Video Tutorial'}</span>
    </div>
  )
}
