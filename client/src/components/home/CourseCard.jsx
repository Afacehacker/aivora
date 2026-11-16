import { Link } from 'react-router-dom'
import { Play, Clock, Video, Star, ArrowRight } from 'lucide-react'
import Badge from '../ui/Badge'
import CourseMediaPreview, { courseUsesVideoCover } from '../common/CourseMediaPreview'

const levelBadgeColor = {
  beginner: 'cyan',
  intermediate: 'indigo',
  advanced: 'purple',
}

export function formatMinutesLong(seconds = 0) {
  if (!seconds || seconds <= 0) return 'Self-paced'
  const totalMins = Math.round(seconds / 60)
  if (totalMins < 60) {
    return `${totalMins} min${totalMins === 1 ? '' : 's'} long`
  }
  const hours = Math.floor(totalMins / 60)
  const remMins = totalMins % 60
  return remMins > 0 ? `${hours}h ${remMins}m long` : `${hours}h long`
}

export function formatDuration(seconds = 0) {
  if (!seconds) return 'Self-paced'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
  return `${minutes}m`
}

export function formatPrice(amount = 0) {
  if (amount === 0) return 'Free'
  return `₦${Number(amount).toLocaleString()}`
}

export default function CourseCard({ course, onPreview }) {
  const hasDiscount =
    course.discountPrice !== null &&
    course.discountPrice !== undefined &&
    course.discountPrice < course.price &&
    (!course.discountExpiry || new Date(course.discountExpiry) > new Date())

  const displayPrice = hasDiscount ? course.discountPrice : course.price
  const ratingAvg = course.rating?.avg || 0
  const ratingCount = course.rating?.count || 0
  const isVideoCover = courseUsesVideoCover(course)

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-pink-100 hover:border-pink-300 shadow-card hover:shadow-card-hover flex flex-col h-full transition-all md:hover:-translate-y-1">
      {/* Product Video Cover */}
      <div className="relative w-full overflow-hidden bg-black flex items-center justify-center min-h-[160px] max-h-[220px] sm:max-h-[300px] md:max-h-[360px]">
        <CourseMediaPreview
          course={course}
          className="w-full h-auto max-h-[220px] sm:max-h-[300px] md:max-h-[360px] object-contain block mx-auto"
          videoClassName="w-full h-auto max-h-[220px] sm:max-h-[300px] md:max-h-[360px] object-contain block mx-auto"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {course.category?.name ? (
            <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[11px] font-medium text-slate-800 shadow-sm border border-pink-100">
              {course.category.name}
            </span>
          ) : <span />}
          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm">
            <Video className="w-3 h-3" /> Video Tutorial
          </span>
        </div>

        {/* Preview Button Overlay */}
        {course.previewVideo && onPreview && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              onPreview(course)
            }}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-sm border border-pink-200 text-xs font-semibold text-slate-800 hover:bg-pink-500 hover:text-white transition-colors shadow-md"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Preview
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <Link to={`/courses/${course.slug}`}>
            <h3 className="text-base sm:text-lg font-display font-bold text-slate-900 group-hover:text-pink-600 transition-colors line-clamp-2">
              {course.title}
            </h3>
          </Link>

          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
            {course.shortDescription || course.description}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Instructor & Rating */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-sm">
                {course.instructor?.name?.charAt(0) || 'A'}
              </div>
              <span className="truncate text-slate-700 font-medium">{course.instructor?.name || 'AIVORA Studio'}</span>
            </div>

            {ratingCount > 0 ? (
              <div className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{ratingAvg.toFixed(1)}</span>
                <span className="text-slate-400">({ratingCount})</span>
              </div>
            ) : (
              <span className="text-[11px] text-pink-600 font-medium">New Release</span>
            )}
          </div>

          {/* Meta: Tutorial Videos Added & Minute Long */}
          <div className="flex items-center justify-between text-xs text-slate-600 border-t border-pink-100 pt-3">
            <span className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Video className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />
              {course.totalLessons || 0} {course.totalLessons === 1 ? 'Tutorial Video' : 'Tutorial Videos'}
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
              {formatMinutesLong(course.totalDuration)}
            </span>
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-2 border-t border-pink-100">
            <div>
              <span className="text-lg font-display font-black text-slate-900">
                {formatPrice(displayPrice)}
              </span>
              {hasDiscount && (
                <span className="ml-2 text-xs text-slate-400 line-through">
                  {formatPrice(course.price)}
                </span>
              )}
            </div>

            <Link
              to={`/courses/${course.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-xs font-semibold text-white hover:opacity-95 transition-opacity shadow-sm"
            >
              <span>Enroll Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
