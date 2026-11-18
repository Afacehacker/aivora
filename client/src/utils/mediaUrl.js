const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|mkv|avi|m4v)(\?.*)?$/i

/**
 * Extracts the backend origin from VITE_API_URL if configured.
 * e.g., 'https://api.aivora.com/api/v1' -> 'https://api.aivora.com'
 */
export function getApiOrigin() {
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
 * Preserves each file's exact identity and path without overwriting or substituting other videos.
 * Handles:
 * - Full CDN / external URLs (Cloudinary, S3, Vimeo, etc.)
 * - Local uploads (/uploads/videos/filename.mp4)
 * - API media streaming (/api/v1/media/videos/filename.mp4)
 * - Cross-origin production routing when frontend and backend domains differ
 */
export function normalizeMediaUrl(url = '') {
  if (!url || typeof url !== 'string') return ''

  // Already a full external CDN URL (Cloudinary, AWS S3, Vimeo, Unsplash, etc.)
  if (/^https?:\/\//i.test(url) && !/^(https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?)/i.test(url)) {
    return url
  }

  const apiOrigin = getApiOrigin()
  // Strip localhost prefix if present in database records
  let clean = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '')

  if (!clean.startsWith('/')) {
    clean = `/${clean}`
  }

  // In cross-origin environments (e.g. Vercel frontend + Render backend),
  // prefix apiOrigin so videos stream directly from backend without 404ing on Vercel
  if (apiOrigin) {
    return `${apiOrigin}${clean}`
  }

  return clean
}

/**
 * Returns prioritized fallback URLs specifically for the GIVEN video file.
 * NEVER substitutes a different video or replaces other course videos.
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
      if (apiOrigin) {
        const full = `${apiOrigin}${p}`
        if (!fallbacks.includes(full)) fallbacks.push(full)
      }
      if (!fallbacks.includes(p)) fallbacks.push(p)
    })
  }

  return Array.from(new Set(fallbacks.filter(Boolean)))
}

/**
 * Resolves receipt proof media URLs.
 * Handles both relative paths (/api/v1/media/images/..., /uploads/images/...)
 * and full external URLs (Cloudinary, S3, etc.).
 * Ensures that if frontend and backend domains differ in production,
 * the API origin is prepended so the receipt actually loads from the backend!
 */
export function getReceiptMediaUrl(url = '') {
  if (!url || typeof url !== 'string') return ''

  // Full external URL (Cloudinary, S3, etc.)
  if (/^https?:\/\//i.test(url) && !/^(https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?)/i.test(url)) {
    return url
  }

  const apiOrigin = getApiOrigin()
  let clean = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '')
  if (!clean.startsWith('/')) clean = `/${clean}`

  if (apiOrigin) {
    return `${apiOrigin}${clean}`
  }

  return clean
}

/**
 * Returns prioritized fallback URLs specifically for payment receipts.
 */
export function getReceiptFallbackUrls(url = '') {
  if (!url || typeof url !== 'string') return []
  const primary = getReceiptMediaUrl(url)
  const fallbacks = [primary]

  const apiOrigin = getApiOrigin()
  const filename = url.split('/').pop()?.split('?')[0]

  if (filename) {
    const paths = [
      `/api/v1/media/images/${filename}`,
      `/uploads/images/${filename}`,
      `/api/v1/media/resources/${filename}`,
      `/uploads/resources/${filename}`,
    ]

    paths.forEach((p) => {
      if (apiOrigin) {
        const full = `${apiOrigin}${p}`
        if (!fallbacks.includes(full)) fallbacks.push(full)
      }
      if (!fallbacks.includes(p)) fallbacks.push(p)
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
