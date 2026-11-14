import { clsx } from 'clsx'

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|mkv|avi|m4v)(\?.*)?$/i

export function isVideoUrl(url = '') {
  if (!url || typeof url !== 'string') return false
  return VIDEO_EXTENSIONS.test(url) || url.includes('/uploads/videos/')
}

export function courseUsesVideoCover(course) {
  const thumb = course?.thumbnail
  const previewVid = course?.previewVideo
  return Boolean((!thumb && previewVid) || isVideoUrl(thumb))
}

/**
 * Renders a course's cover media seamlessly whether the admin uploaded:
 * 1) A picture (`course.thumbnail`), OR
 * 2) Only a video (`course.previewVideo`), OR
 * 3) A video URL inside `course.thumbnail`
 * Ensures the full height, width, and length of the video are visible without cropping.
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
  const thumb = course?.thumbnail
  const previewVid = course?.previewVideo

  // If there is no picture thumbnail (or thumbnail itself is a video) and a video exists, render <video> directly
  const shouldRenderVideo = courseUsesVideoCover(course)
  const videoSrc = isVideoUrl(thumb) ? thumb : previewVid

  if (shouldRenderVideo && videoSrc) {
    // Replace object-cover with object-contain so the full height and width of the video are never cropped
    const resolvedVideoClass =
      videoClassName ||
      className
        .replace(/\bobject-cover\b/g, 'object-contain')
        .replace(/\bgroup-hover:scale-105\b/g, '')

    return (
      <video
        src={videoSrc}
        muted={muted}
        loop={loop}
        autoPlay={autoPlay}
        playsInline
        controls={controls}
        preload="auto"
        className={clsx('bg-black', resolvedVideoClass)}
      />
    )
  }

  return (
    <img
      src={
        thumb ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
      }
      alt={course?.title || 'AIVORA Course'}
      loading="lazy"
      className={clsx(className)}
    />
  )
}
