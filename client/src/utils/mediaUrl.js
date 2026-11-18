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
 * - Cloudinary & CDN URLs
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

  // Handle local dev URLs (http://localhost:5000/...)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)) {
    // If running in production (e.g. on Vercel) where API origin is configured
    if (!isFrontendOnLocalhost && apiOrigin) {
      return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, apiOrigin)
    }
    // In local dev, strip http://localhost:5000 so Vite dev server proxies it seamlessly
    return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '')
  }

  // Handle relative media paths (/uploads/... or /api/v1/media/...)
  const cleanPath = url.startsWith('/') ? url : `/${url}`

  // If frontend is deployed on a separate domain from backend (e.g. Vercel + Render)
  if (!isFrontendOnLocalhost && apiOrigin && apiOrigin !== currentOrigin) {
    return `${apiOrigin}${cleanPath}`
  }

  return cleanPath
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
      `/uploads/videos/${filename}`,
      `/api/v1/media/videos/${filename}`,
    ]

    paths.forEach((p) => {
      if (!fallbacks.includes(p)) fallbacks.push(p)
      if (apiOrigin) {
        const full = `${apiOrigin}${p}`
        if (!fallbacks.includes(full)) fallbacks.push(full)
      }
    })
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
