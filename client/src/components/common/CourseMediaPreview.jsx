import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|mkv|avi|m4v)(\?.*)?$/i

// Shared in-memory Blob URL cache so identical videos on the same page download ONCE
// and never trigger Chromium's net::ERR_CACHE_OPERATION_NOT_SUPPORTED concurrent range lock.
const videoBlobUrlCache = new Map()
const videoFetchPromiseCache = new Map()

function getOrFetchVideoBlobUrl(url) {
  if (videoBlobUrlCache.has(url)) {
    return Promise.resolve(videoBlobUrlCache.get(url))
  }
  if (videoFetchPromiseCache.has(url)) {
    return videoFetchPromiseCache.get(url)
  }

  const promise = fetch(url, { cache: 'force-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.blob()
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob)
      videoBlobUrlCache.set(url, blobUrl)
      videoFetchPromiseCache.delete(url)
      return blobUrl
    })
    .catch((err) => {
      videoFetchPromiseCache.delete(url)
      throw err
    })

  videoFetchPromiseCache.set(url, promise)
  return promise
}

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
 * Uses an in-memory Blob URL cache to eliminate Chromium net::ERR_CACHE_OPERATION_NOT_SUPPORTED
 * when multiple cards display the same video, and stops retrying if the network is offline.
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
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState(null)

  const thumb = normalizeMediaUrl(course?.thumbnail)
  const previewVid = normalizeMediaUrl(course?.previewVideo)

  const shouldRenderVideo = courseUsesVideoCover(course) && !videoFailed
  const rawVideoSrc = isVideoUrl(thumb) ? thumb : previewVid

  useEffect(() => {
    let isMounted = true
    setVideoFailed(false)

    if (!shouldRenderVideo || !rawVideoSrc) {
      setResolvedVideoSrc(null)
      return
    }

    // If already cached as a blob URL in memory, use it immediately
    if (videoBlobUrlCache.has(rawVideoSrc)) {
      setResolvedVideoSrc(videoBlobUrlCache.get(rawVideoSrc))
      return
    }

    getOrFetchVideoBlobUrl(rawVideoSrc)
      .then((blobUrl) => {
        if (isMounted) setResolvedVideoSrc(blobUrl)
      })
      .catch(() => {
        // Fallback to direct URL if fetch fails, or mark failed if offline
        if (isMounted) {
          if (navigator.onLine === false) {
            setVideoFailed(true)
          } else {
            setResolvedVideoSrc(rawVideoSrc)
          }
        }
      })

    return () => {
      isMounted = false
    }
  }, [rawVideoSrc, shouldRenderVideo])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !shouldRenderVideo || !resolvedVideoSrc || !autoPlay) return

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
      { threshold: 0.2 }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [shouldRenderVideo, autoPlay, resolvedVideoSrc])

  if (shouldRenderVideo && resolvedVideoSrc) {
    const resolvedVideoClass =
      videoClassName ||
      className
        .replace(/\bobject-cover\b/g, 'object-contain')
        .replace(/\bgroup-hover:scale-105\b/g, '')

    return (
      <video
        ref={videoRef}
        src={resolvedVideoSrc}
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
