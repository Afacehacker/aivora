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
    <div className="group glass rounded-2xl overflow-hidden border border-white/10 hover:border-aivora-indigo/50 shadow-card hover:shadow-card-hover flex flex-col h-full transition-all md:hover:-translate-y-1">
      {/* Product Video Cover */}
      <div className="relative w-full overflow-hidden bg-black flex items-center justify-center min-h-[160px] max-h-[220px] sm:max-h-[300px] md:max-h-[360px]">
        <CourseMediaPreview
          course={course}
          className="w-full h-auto max-h-[220px] sm:max-h-[300px] md:max-h-[360px] object-contain block mx-auto"
          videoClassName="w-full h-auto max-h-[220px] sm:max-h-[300px] md:max-h-[360px] object-contain block mx-auto"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-aivora-dark/60 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {course.category?.name ? (
            <span className="px-2.5 py-1 rounded-full glass-dark text-[11px] font-medium text-slate-200">
              {course.category.name}
            </span>
          ) : <span />}
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-aivora-cyan text-[11px] font-semibold flex items-center gap-1">
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
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-dark border border-white/15 text-xs font-semibold text-white hover:bg-aivora-indigo transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Preview
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <Link to={`/courses/${course.slug}`}>
            <h3 className="text-base sm:text-lg font-display font-bold text-white group-hover:text-aivora-indigo transition-colors line-clamp-2">
              {course.title}
            </h3>
          </Link>

          <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">
            {course.shortDescription || course.description}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Instructor & Rating */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-aivora-indigo to-aivora-purple flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                {course.instructor?.name?.charAt(0) || 'A'}
              </div>
              <span className="truncate">{course.instructor?.name || 'AIVORA Studio'}</span>
            </div>

            {ratingCount > 0 ? (
              <div className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{ratingAvg.toFixed(1)}</span>
                <span className="text-slate-500">({ratingCount})</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-500">New Release</span>
            )}
          </div>

          {/* Meta: Tutorial Videos Added & Minute Long */}
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/5 pt-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <Video className="w-3.5 h-3.5 text-aivora-cyan flex-shrink-0" />
              {course.totalLessons || 0} {course.totalLessons === 1 ? 'Tutorial Video' : 'Tutorial Videos'}
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-aivora-indigo flex-shrink-0" />
              {formatMinutesLong(course.totalDuration)}
            </span>
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div>
              <span className="text-lg font-display font-black text-white">
                {formatPrice(displayPrice)}
              </span>
              {hasDiscount && (
                <span className="ml-2 text-xs text-slate-500 line-through">
                  {formatPrice(course.price)}
                </span>
              )}
            </div>

            <Link
              to={`/courses/${course.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-aivora-indigo to-aivora-purple text-xs font-semibold text-white hover:opacity-90 transition-opacity"
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
