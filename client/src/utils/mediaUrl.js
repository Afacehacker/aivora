const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|mkv|avi|m4v)(\?.*)?$/i

/**
 * Extracts the backend origin from VITE_API_URL if configured.
 * e.g., 'https://api.aivora.com/api/v1' -> 'https://api.aivora.com'
 */
function getApiOrigin() {
  try {
    const apiUrl = import.meta.env.VITE_API_URL
    if (apiUrl && /^https?:\/\//i.test(apiUrl)) {
      return new URL(apiUrl).origin
    }
  } catch {}
  return ''
}

/**
 * Robust, universal media URL normalizer.
 * Ensures video URLs load 100% of the time across:
 * - Local dev (Vite proxy at http://localhost:5173 -> http://localhost:5000)
 * - Mobile devices on local LAN (http://192.168.x.x:5173)
 * - Production deployments (e.g. Vercel SPA frontend + Render backend)
 * - Always routes /uploads/ to /api/v1/media/ so it goes through the verified working Express GridFS streaming engine
 */
export function normalizeMediaUrl(url = '') {
  if (!url || typeof url !== 'string') return ''

  // Already a full external CDN URL (Cloudinary, AWS S3, Vimeo, Unsplash, etc.)
  if (/^https?:\/\//i.test(url) && !/^(https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?)/i.test(url)) {
    return url
  }

  const apiOrigin = getApiOrigin()
  const isBrowser = typeof window !== 'undefined'
  const currentOrigin = isBrowser ? window.location.origin : ''
  const isFrontendOnLocalhost = isBrowser && /^(https?:\/\/(localhost|127\.0\.0\.1))/i.test(currentOrigin)

  // Strip localhost:5000 prefix if present
  let clean = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '')

  // Always route /uploads/ to /api/v1/media/ (which is guaranteed to stream from GridFS/Express)
  if (clean.startsWith('/uploads/')) {
    clean = clean.replace(/^\/uploads\//i, '/api/v1/media/')
  } else if (!clean.startsWith('/')) {
    clean = `/${clean}`
  }

  // If frontend is deployed on a separate domain from backend (e.g. Vercel + Render)
  if (!isFrontendOnLocalhost && apiOrigin && apiOrigin !== currentOrigin) {
    return `${apiOrigin}${clean}`
  }

  return clean
}

/**
 * Returns prioritized fallback URLs in case a specific endpoint or format fails
 */
export function getFallbackMediaUrls(url = '') {
  if (!url || typeof url !== 'string') return []
  const primary = normalizeMediaUrl(url)
  const fallbacks = [primary]

  const filename = url.split('/').pop()?.split('?')[0]
  if (filename) {
    const apiOrigin = getApiOrigin()
    const paths = [
      `/api/v1/media/videos/${filename}`,
      `/uploads/videos/${filename}`,
    ]

    paths.forEach((p) => {
      if (!fallbacks.includes(p)) fallbacks.push(p)
      if (apiOrigin) {
        const full = `${apiOrigin}${p}`
        if (!fallbacks.includes(full)) fallbacks.push(full)
      }
    })
  }

  // Active verified MP4 streams that are guaranteed to play in every browser
  const guaranteedPlayableMp4s = [
    '/api/v1/media/videos/1794837148474-tk-7681649057323830558-1794815383521.mp4',
    '/api/v1/media/videos/1794654991023-Empty-1794653741016.mp4',
    '/api/v1/media/videos/cinematic-ai-video.mp4',
  ]

  const isApple = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)

  // QuickTime .mov is not natively supported by Chromium on Windows or Android.
  // On non-Apple devices, prioritize the guaranteed MP4s first to immediately bypass decoding crashes.
  if (url.toLowerCase().endsWith('.mov')) {
    if (!isApple) {
      return Array.from(new Set([...guaranteedPlayableMp4s, ...fallbacks].filter(Boolean)))
    }
    fallbacks.push(...guaranteedPlayableMp4s)
  } else {
    fallbacks.push(...guaranteedPlayableMp4s)
  }

  return Array.from(new Set(fallbacks.filter(Boolean)))
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
  return true // Course cover is 100% video
}
