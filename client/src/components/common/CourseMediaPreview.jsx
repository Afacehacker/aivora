import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { Film, Play } from 'lucide-react'

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
  return true // Cover is exclusively video
}

/**
 * Product cover display: 100% video only.
 * Renders the preview promo video with smart caching, playsInline, and autoplay.
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
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState(null)

  const previewVid = normalizeMediaUrl(course?.previewVideo)
  const thumbVid = isVideoUrl(course?.thumbnail) ? normalizeMediaUrl(course?.thumbnail) : null
  const firstLessonVid = normalizeMediaUrl(course?.modules?.[0]?.lessons?.[0]?.videoUrl)

  const rawVideoSrc = previewVid || thumbVid || firstLessonVid
  const shouldRenderVideo = Boolean(rawVideoSrc) && !videoFailed

  useEffect(() => {
    let isMounted = true
    setVideoFailed(false)

    if (!shouldRenderVideo || !rawVideoSrc) {
      setResolvedVideoSrc(null)
      return
    }

    if (videoBlobUrlCache.has(rawVideoSrc)) {
      setResolvedVideoSrc(videoBlobUrlCache.get(rawVideoSrc))
      return
    }

    getOrFetchVideoBlobUrl(rawVideoSrc)
      .then((blobUrl) => {
        if (isMounted) setResolvedVideoSrc(blobUrl)
      })
      .catch(() => {
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
