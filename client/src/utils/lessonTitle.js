/**
 * Utility to ensure video filenames as saved on the user's device NEVER show on the website.
 * If a lesson title is empty, or resembles a device video filename (e.g. VID_..., WhatsApp Video...,
 * Screen Recording..., .mp4, timestamps, or raw camera prefixes), it is cleanly replaced with a
 * professional title like "Video Tutorial 1", "Video Tutorial 2", etc.
 */

const DEVICE_FILENAME_PATTERNS = [
  // Standard video extensions
  /\.(mp4|webm|mov|mkv|avi|m4v|3gp|flv|wmv)$/i,
  // Camera & phone auto-generated prefixes
  /^(vid|img|mov|pxl|rec|screen\s*recording|whatsapp\s*video|mvi|sam|dji|gopr|gp|clip)[_\s-]/i,
  // Timestamp prefixes (e.g. 1794654991023-... or 20261114_143022)
  /^\d{10,}[-_]/,
  /^\d{4}[-_]?\d{2}[-_]?\d{2}[-_]?\d{2,}/,
  // UUIDs or random hash names
  /^[0-9a-f]{8}-[0-9a-f]{4}/i,
  // Upload temporary naming (e.g. upl-..., empty-17946...)
  /^(upl|empty|upload|temp|file)[-_]/i,
]

export function isDeviceFileName(str = '') {
  if (!str || typeof str !== 'string') return true
  const trimmed = str.trim()
  if (!trimmed) return true

  return DEVICE_FILENAME_PATTERNS.some((pattern) => pattern.test(trimmed))
}

export function cleanLessonTitle(rawTitle, fallbackIndex = 0) {
  const fallbackNumber = fallbackIndex + 1
  const defaultTitle = `Video Tutorial ${fallbackNumber}`

  if (!rawTitle || typeof rawTitle !== 'string') {
    return defaultTitle
  }

  let title = rawTitle.trim()

  // Strip trailing extension if present (e.g. "My Lesson.mp4" -> "My Lesson")
  title = title.replace(/\.(mp4|webm|mov|mkv|avi|m4v|3gp|flv|wmv)$/i, '').trim()

  // If the remaining string is a device filename or empty, return default title
  if (isDeviceFileName(title) || !title) {
    return defaultTitle
  }

  // If it's a legitimate title, return it clean
  return title
}
