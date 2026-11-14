import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'

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
  const thumb = normalizeMediaUrl(course?.thumbnail)
  const previewVid = normalizeMediaUrl(course?.previewVideo)
  return Boolean((!thumb && previewVid) || isVideoUrl(thumb))
}

const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=75'

/**
 * Renders a course's cover media seamlessly whether the admin uploaded:
 * 1) A picture (`course.thumbnail`), OR
 * 2) Only a video (`course.previewVideo`), OR
 * 3) A video URL inside `course.thumbnail`
 * Prevents infinite network retry loops if a mobile connection drops (`onError` fallback).
 */
export default function CourseMediaPreview({
  course,
  className = 'w-full h-full object-cover',
  videoClassName,
  autoPlay = true,
  muted = true,
  loop = true,
  controls = false,
}) {
  const videoRef = useRef(null)
  const [videoFailed, setVideoFailed] = useState(false)

  const thumb = normalizeMediaUrl(course?.thumbnail)
  const previewVid = normalizeMediaUrl(course?.previewVideo)

  const shouldRenderVideo = courseUsesVideoCover(course) && !videoFailed
  const videoSrc = isVideoUrl(thumb) ? thumb : previewVid

  useEffect(() => {
    setVideoFailed(false)
  }, [videoSrc])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !shouldRenderVideo || !autoPlay) return

    if (typeof IntersectionObserver === 'undefined') {
      if (navigator.onLine !== false) el.play().catch(() => {})
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (navigator.onLine !== false && el.paused) {
              el.play().catch(() => {})
            }
          } else if (!el.paused) {
            el.pause()
          }
        })
      },
      { threshold: 0.25 }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [shouldRenderVideo, autoPlay, videoSrc])

  if (shouldRenderVideo && videoSrc) {
    const resolvedVideoClass =
      videoClassName ||
      className
        .replace(/\bobject-cover\b/g, 'object-contain')
        .replace(/\bgroup-hover:scale-105\b/g, '')

    return (
      <video
        ref={videoRef}
        src={videoSrc}
        muted={muted}
        loop={loop}
        playsInline
        controls={controls}
        preload="metadata"
        onError={() => setVideoFailed(true)}
        className={clsx('bg-black', resolvedVideoClass)}
      />
    )
  }

  return (
    <img
      src={(!isVideoUrl(thumb) && thumb) || FALLBACK_POSTER}
      alt={course?.title || 'AIVORA Course'}
      loading="lazy"
      decoding="async"
      className={clsx(className)}
    />
  )
}
