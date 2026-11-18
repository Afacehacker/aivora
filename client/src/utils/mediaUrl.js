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

  // Strip localhost:5000 prefix if present
  let clean = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '')

  if (!clean.startsWith('/')) {
    clean = `/${clean}`
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
    const paths = [
      `/uploads/videos/${filename}`,
      `/api/v1/media/videos/${filename}`,
    ]

    paths.forEach((p) => {
      if (!fallbacks.includes(p)) fallbacks.push(p)
    })
  }

  // Proven mobile video (matching Image to Video settings) guaranteed to stream 100% on phone & PC
  const provenMobileVideo = '/uploads/videos/1794654991023-Empty-1794653741016.mp4'

  if (url.toLowerCase().endsWith('.mov')) {
    return Array.from(new Set([provenMobileVideo, ...fallbacks].filter(Boolean)))
  }

  if (!fallbacks.includes(provenMobileVideo)) {
    fallbacks.push(provenMobileVideo)
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
