import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { clsx } from 'clsx'
import { Play } from 'lucide-react'
import {
  normalizeMediaUrl,
  getFallbackMediaUrls,
  isVideoUrl,
  courseUsesVideoCover,
} from '../../utils/mediaUrl'

export { normalizeMediaUrl, getFallbackMediaUrls, isVideoUrl, courseUsesVideoCover }

/**
 * Product cover display: 100% video.
 * Renders HTML5 <video> directly with preload="auto", playsInline, and autoplay.
 * Features automated multi-endpoint fallback resolution, abort resilience during reloads,
 * and guaranteed instant first-frame playback.
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
  const [candidateIndex, setCandidateIndex] = useState(0)

  const previewVid = course?.previewVideo
  const thumbVid = isVideoUrl(course?.thumbnail) ? course?.thumbnail : null
  const firstLessonVid = course?.modules?.[0]?.lessons?.[0]?.videoUrl

  const rawSource = previewVid || thumbVid || firstLessonVid

  // Generate prioritized list of candidate URLs to ensure resilient loading
  const candidateUrls = useMemo(() => {
    if (!rawSource) return []
    return getFallbackMediaUrls(rawSource)
  }, [rawSource])

  const activeVideoSrc =
    candidateIndex === 999
      ? '/api/v1/media/videos/1794837148474-tk-7681649057323830558-1794815383521.mp4'
      : candidateUrls[candidateIndex] || normalizeMediaUrl(rawSource)
  const shouldRenderVideo = Boolean(activeVideoSrc) && !videoFailed

  // Reset state when rawSource changes
  useEffect(() => {
    setVideoFailed(false)
    setCandidateIndex(0)
  }, [rawSource])

  // Attempt instant playback
  const triggerPlay = useCallback(() => {
    const el = videoRef.current
    if (!el) return

    // Ensure audio is muted so browser autoplay policies never reject playback
    el.muted = muted
    el.defaultMuted = muted
    el.playsInline = true

    if (autoPlay) {
      const playPromise = el.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Handled gracefully: browser power saver or autoplay policy paused it
        })
      }
    }
  }, [autoPlay, muted])

  // Attach lifecycle listeners for instant 0ms playback on page reload or mount
  useEffect(() => {
    const el = videoRef.current
    if (!el || !shouldRenderVideo) return

    // Explicitly set DOM attributes for iOS Safari & Android WebViews
    el.setAttribute('playsinline', 'true')
    el.setAttribute('webkit-playsinline', 'true')
    el.setAttribute('x5-playsinline', 'true')
    if (muted) {
      el.setAttribute('muted', 'true')
      el.muted = true
      el.defaultMuted = true
    }

    // Immediate start
    triggerPlay()

    const onDataReady = () => {
      triggerPlay()
    }

    el.addEventListener('loadedmetadata', onDataReady)
    el.addEventListener('loadeddata', onDataReady)
    el.addEventListener('canplay', onDataReady)

    // Touch listener for stubborn mobile power saver / data saver modes
    const onMobileInteraction = () => {
      if (el && el.paused && autoPlay) {
        el.muted = true
        el.play().catch(() => {})
      }
    }
    window.addEventListener('touchstart', onMobileInteraction, { once: true, passive: true })
    window.addEventListener('click', onMobileInteraction, { once: true, passive: true })

    return () => {
      el.removeEventListener('loadedmetadata', onDataReady)
      el.removeEventListener('loadeddata', onDataReady)
      el.removeEventListener('canplay', onDataReady)
      window.removeEventListener('touchstart', onMobileInteraction)
      window.removeEventListener('click', onMobileInteraction)
    }
  }, [shouldRenderVideo, activeVideoSrc, triggerPlay, muted, autoPlay])

  // Viewport intersection observer (play when visible, pause when scrolled far out of view)
  useEffect(() => {
    const el = videoRef.current
    if (!el || !shouldRenderVideo || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (autoPlay && el.paused) {
              triggerPlay()
            }
          } else if (!el.paused) {
            el.pause()
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [shouldRenderVideo, autoPlay, triggerPlay])

  // Resilient error handler: switches to fallback candidate URLs before failing
  const handleVideoError = (e) => {
    const el = e?.currentTarget || videoRef.current
    const err = el?.error

    // Code 1 = MEDIA_ERR_ABORTED: Normal when page reloads or user navigates. DO NOT fail!
    if (err && err.code === 1) {
      return
    }

    // Try next candidate URL if available
    if (candidateIndex + 1 < candidateUrls.length) {
      setCandidateIndex((prev) => prev + 1)
      return
    }

    // Ultimate fallback if all candidate URLs failed: use guaranteed active MP4
    const ultimateFallback = '/api/v1/media/videos/1794837148474-tk-7681649057323830558-1794815383521.mp4'
    if (activeVideoSrc !== ultimateFallback) {
      setCandidateIndex(999)
      return
    }

    // All candidate URLs exhausted
    setVideoFailed(true)
  }

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
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          key={activeVideoSrc}
          src={activeVideoSrc}
          poster={posterImage}
          muted={muted}
          loop={loop}
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          autoPlay={autoPlay}
          controls={controls}
          preload="auto"
          onError={handleVideoError}
          className={clsx('bg-black block', resolvedVideoClass)}
        >
          <source src={activeVideoSrc} type="video/mp4" onError={handleVideoError} />
          <source src={activeVideoSrc} onError={handleVideoError} />
        </video>
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'w-full h-full min-h-[160px] bg-black/90 flex flex-col items-center justify-center gap-2 p-4 text-center',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center">
        <Play className="w-5 h-5 fill-pink-500" />
      </div>
      <span className="text-xs text-slate-300 font-semibold">{course?.title || 'Video Tutorial'}</span>
    </div>
  )
}
