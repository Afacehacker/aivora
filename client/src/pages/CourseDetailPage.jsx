import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import {
  Play, CheckCircle2, Clock, Video, Globe, Award, Lock,
  ChevronDown, Star, ShieldCheck, Tag, Users
} from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../components/common/SEO'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import StarRating from '../components/ui/StarRating'
import Modal from '../components/ui/Modal'
import PageLoader from '../components/common/PageLoader'
import CourseMediaPreview, { courseUsesVideoCover } from '../components/common/CourseMediaPreview'
import { formatDuration, formatPrice, formatMinutesLong } from '../components/home/CourseCard'
import courseService from '../services/courseService'
import paymentService from '../services/paymentService'
import reviewService from '../services/reviewService'
import api from '../services/api'
import useAuthStore from '../store/authStore'

export default function CourseDetailPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [reviews, setReviews] = useState([])
  const [openModuleId, setOpenModuleId] = useState(null)

  // Coupon & Checkout state
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  // Preview video modal
  const [previewUrl, setPreviewUrl] = useState(null)

  // Review form
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // Load course details
  useEffect(() => {
    let isMounted = true
    const loadCourse = async () => {
      setLoading(true)
      try {
        const res = await courseService.getCourseBySlug(slug)
        const courseData = res.data
        if (!isMounted) return
        setCourse(courseData)
        if (courseData.modules?.[0]) {
          setOpenModuleId(courseData.modules[0]._id)
        }

        // Load approved reviews
        const revRes = await reviewService.getCourseReviews(courseData._id)
        if (isMounted) setReviews(revRes?.data || [])

        // Check enrollment if logged in
        if (isAuthenticated) {
          const enrRes = await courseService.checkEnrollment(courseData._id)
          if (isMounted) setIsEnrolled(!!enrRes?.data?.isEnrolled)
        }
      } catch (err) {
        toast.error(err.message || 'Course not found')
        navigate('/courses')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadCourse()
    return () => {
      isMounted = false
    }
  }, [slug, isAuthenticated, navigate])

  // Auto-verify payment if returning from Paystack callback (?reference=xxx)
  useEffect(() => {
    const ref = searchParams.get('reference') || searchParams.get('trxref')
    if (ref && isAuthenticated) {
      paymentService
        .verifyPayment(ref)
        .then(() => {
          toast.success('Payment verified! Course unlocked.')
          setIsEnrolled(true)
        })
        .catch((err) => {
          toast.error(err.message || 'Could not verify payment reference.')
        })
    }
  }, [searchParams, isAuthenticated])

  if (loading) return <PageLoader />
  if (!course) return null

  const hasDiscount =
    course.discountPrice !== null &&
    course.discountPrice !== undefined &&
    course.discountPrice < course.price &&
    (!course.discountExpiry || new Date(course.discountExpiry) > new Date())

  const basePrice = hasDiscount ? course.discountPrice : course.price
  const finalPrice = Math.max(0, basePrice - couponDiscount)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    if (!isAuthenticated) {
      toast.error('Please sign in to apply a coupon code.')
      return
    }
    setApplyingCoupon(true)
    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode,
        courseId: course._id,
        amount: basePrice,
      })
      setCouponDiscount(res.data.discount || 0)
      toast.success(`Coupon applied! You saved ${formatPrice(res.data.discount)}`)
    } catch (err) {
      setCouponDiscount(0)
      toast.error(err.message || 'Invalid coupon code')
    } finally {
      setApplyingCoupon(false)
    }
  }

  const handleEnrollOrBuy = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in or create an account to enroll.')
      navigate('/auth/login')
      return
    }

    if (isEnrolled) {
      navigate(`/dashboard/learn/${course._id}`)
      return
    }

    // If course is free (₦0), enroll immediately
    if (finalPrice === 0) {
      setProcessingPayment(true)
      try {
        const res = await paymentService.initializePayment({
          courseId: course._id,
          couponCode: couponDiscount > 0 ? couponCode : undefined,
        })
        if (res.data?.enrolled) {
          toast.success('Successfully enrolled!')
          navigate(`/dashboard/learn/${course._id}`)
          return
        }
      } catch (err) {
        toast.error(err.message || 'Failed to enroll.')
      } finally {
        setProcessingPayment(false)
      }
      return
    }

    // Navigate to Manual Bank Transfer Payment Page
    const query = couponDiscount > 0 && couponCode ? `?coupon=${encodeURIComponent(couponCode)}` : ''
    navigate(`/checkout/${course.slug}${query}`)
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!reviewComment.trim()) return
    setSubmittingReview(true)
    try {
      await reviewService.createReview({
        courseId: course._id,
        rating: reviewRating,
        comment: reviewComment,
      })
      toast.success('Review submitted for approval!')
      setReviewComment('')
    } catch (err) {
      toast.error(err.message || 'Could not submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <>
      <SEO
        title={course.title}
        description={course.shortDescription || course.description}
        image={course.thumbnail}
        url={`/courses/${course.slug}`}
      />

      <div className="pt-24 pb-24 bg-[#fff5f7] min-h-screen">
        {/* Top Banner */}
        <div className="bg-hero-gradient border-b border-pink-100 py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left Info */}
              <div className="lg:col-span-8 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  {course.category?.name && (
                    <Badge color="pink">{course.category.name}</Badge>
                  )}
                  <Badge color="pink">Video Tutorial</Badge>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-slate-900 leading-tight">
                  {course.title}
                </h1>

                <p className="text-slate-700 text-base sm:text-lg leading-relaxed">
                  {course.shortDescription}
                </p>

                <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm text-slate-700 pt-2 font-medium">
                  {course.rating?.count > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>{course.rating.avg.toFixed(1)}</span>
                      <span className="text-slate-400">({course.rating.count} reviews)</span>
                    </div>
                  )}
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Video className="w-4 h-4 text-pink-500" />
                    {course.totalLessons || 0} {course.totalLessons === 1 ? 'Tutorial Video' : 'Tutorial Videos'}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-4 h-4 text-pink-500" />
                    {formatMinutesLong(course.totalDuration)}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Globe className="w-4 h-4 text-pink-500" />
                    {course.language || 'English'}
                  </span>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    {course.instructor?.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Instructor</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {course.instructor?.name || 'AIVORA Studio'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content + Sticky Checkout Sidebar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
            {/* On mobile (< lg): render Checkout & Video Preview card first so students see price & media immediately */}
            <div className="lg:col-span-4 lg:order-last">
              <div className="sticky top-20 sm:top-24 bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-pink-100 shadow-xl">
                {/* Product Video Cover */}
                <div className="relative w-full bg-black flex items-center justify-center overflow-hidden min-h-[180px] max-h-[240px] sm:max-h-[320px] lg:max-h-[420px]">
                  <CourseMediaPreview
                    course={course}
                    className="w-full h-auto max-h-[240px] sm:max-h-[320px] lg:max-h-[420px] object-contain block mx-auto"
                    videoClassName="w-full h-auto max-h-[240px] sm:max-h-[320px] lg:max-h-[420px] object-contain block mx-auto"
                  />
                  {course.previewVideo && (
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(course.previewVideo)}
                      className="absolute bottom-3 right-3 inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/90 backdrop-blur-sm border border-pink-200 text-xs font-semibold text-slate-800 hover:bg-pink-500 hover:text-white transition-colors shadow-lg"
                    >
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-600 fill-pink-600 hover:text-white hover:fill-white" />
                      <span>Preview With Sound</span>
                    </button>
                  )}
                </div>

                <div className="p-5 sm:p-6 space-y-5 sm:space-y-6">
                  {/* Pricing */}
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl sm:text-3xl font-display font-black text-slate-900">
                        {formatPrice(finalPrice)}
                      </span>
                      {(hasDiscount || couponDiscount > 0) && (
                        <span className="text-sm sm:text-base text-slate-400 line-through">
                          {formatPrice(course.price)}
                        </span>
                      )}
                    </div>
                    {couponDiscount > 0 && (
                      <p className="text-xs text-emerald-600 font-semibold mt-1">
                        Coupon discount applied (-{formatPrice(couponDiscount)})
                      </p>
                    )}
                  </div>

                  {/* Primary Action Button */}
                  <Button
                    fullWidth
                    size="lg"
                    loading={processingPayment}
                    onClick={handleEnrollOrBuy}
                  >
                    {isEnrolled ? 'Continue Learning' : 'Proceed to Bank Transfer Payment'}
                  </Button>

                  {!isEnrolled && finalPrice > 0 && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed">
                      <strong className="text-amber-800">Payment Notice:</strong> Transfers from{' '}
                      <strong>OPay</strong> cannot be received due to gateway problems. We accept
                      transfers from any other Nigerian bank (PalmPay, Kuda, Moniepoint, UBA,
                      Access Bank, FirstBank, etc.).
                    </div>
                  )}

                  {/* Coupon Box */}
                  {!isEnrolled && basePrice > 0 && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon code (e.g. WELCOME10)"
                        className="flex-1 px-3 py-2 rounded-xl bg-pink-50/50 border border-pink-200 text-xs text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-pink-500"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={applyingCoupon}
                        onClick={handleApplyCoupon}
                      >
                        Apply
                      </Button>
                    </div>
                  )}

                  {/* Trust guarantees */}
                  <div className="pt-2 border-t border-pink-100 space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-pink-500 flex-shrink-0" />
                      <span>Instant automatic access after bank transfer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-pink-500 flex-shrink-0" />
                      <span>Lifetime access to all video tutorials</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-pink-500 flex-shrink-0" />
                      <span>Verifiable Certificate of Completion included</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Details */}
            <div className="lg:col-span-8 space-y-8 sm:space-y-12">
              {/* What You Will Learn */}
              {course.objectives?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-pink-100 shadow-sm">
                  <h2 className="text-xl font-display font-bold text-slate-900 mb-5">
                    What You&apos;ll Learn
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {course.objectives.map((obj, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Description */}
              {(course.shortDescription || course.description) && (
                <div className="space-y-4">
                  <h2 className="text-xl font-display font-bold text-slate-900">Course Overview</h2>
                  <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line bg-white rounded-2xl p-6 border border-pink-100 shadow-sm">
                    {course.shortDescription || course.description}
                  </div>
                </div>
              )}

              {/* Course Video Tutorials */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                    <Video className="w-5 h-5 text-pink-500" />
                    Video Tutorials
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    {course.totalLessons || 0} Tutorial {course.totalLessons === 1 ? 'Video' : 'Videos'} • {formatMinutesLong(course.totalDuration)}
                  </span>
                </div>

                {course.modules?.length > 0 ? (
                  <div className="space-y-3">
                    {course.modules.map((mod) => {
                      const isOpen = openModuleId === mod._id
                      return (
                        <div
                          key={mod._id}
                          className="bg-white rounded-2xl border border-pink-100 overflow-hidden shadow-sm"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenModuleId(isOpen ? null : mod._id)}
                            className="w-full flex items-center justify-between p-5 text-left hover:bg-pink-50/50 transition-colors"
                          >
                            <div>
                              <h3 className="text-base font-display font-bold text-slate-900">
                                {mod.title}
                              </h3>
                              {mod.description && (
                                <p className="text-xs text-slate-600 mt-0.5">{mod.description}</p>
                              )}
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 text-slate-500 transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {isOpen && mod.lessons?.length > 0 && (
                            <div className="border-t border-pink-100 divide-y divide-pink-100">
                              {mod.lessons.map((lesson) => (
                                <div
                                  key={lesson._id}
                                  className="px-5 py-3.5 flex items-center justify-between gap-4 text-sm"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {lesson.isPreview || isEnrolled ? (
                                      <Play className="w-4 h-4 text-pink-500 flex-shrink-0" />
                                    ) : (
                                      <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                    )}
                                    <span className="text-slate-800 truncate font-medium">{lesson.title}</span>
                                    {lesson.isPreview ? (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 flex-shrink-0">
                                        Free Preview
                                      </span>
                                    ) : !isEnrolled ? (
                                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex-shrink-0">
                                        Requires Payment
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex-shrink-0">
                                        Unlocked
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    {lesson.isPreview && lesson.videoUrl && (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewUrl(lesson.videoUrl)}
                                        className="text-xs font-semibold text-pink-600 hover:underline"
                                      >
                                        Watch Preview
                                      </button>
                                    )}
                                    <span className="text-xs text-slate-500">
                                      {formatMinutesLong(lesson.videoDuration)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Video tutorials are being updated.</p>
                )}
              </div>

              {/* Requirements & Audience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {course.requirements?.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm">
                    <h3 className="text-base font-display font-bold text-slate-900 mb-3">
                      Requirements
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
                      {course.requirements.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {course.targetAudience?.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm">
                    <h3 className="text-base font-display font-bold text-slate-900 mb-3">
                      Who This Course Is For
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
                      {course.targetAudience.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Student Reviews */}
              <div className="space-y-6">
                <h2 className="text-xl font-display font-bold text-slate-900">Student Reviews</h2>

                {isEnrolled && (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm space-y-4"
                  >
                    <h3 className="text-base font-semibold text-slate-900">Leave a Review</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-600">Your Rating:</span>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="rounded-lg bg-pink-50/50 border border-pink-200 px-3 py-1.5 text-sm text-slate-900 focus:bg-white"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} Stars
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your honest experience with this course..."
                      className="w-full rounded-xl bg-pink-50/50 border border-pink-200 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-pink-500"
                      required
                    />
                    <Button type="submit" size="sm" loading={submittingReview}>
                      Submit Review
                    </Button>
                  </form>
                )}

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((rev) => (
                      <div
                        key={rev._id}
                        className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-900">
                            {rev.student?.name || 'Verified Student'}
                          </span>
                          <StarRating rating={rev.rating} />
                        </div>
                        <p className="text-sm text-slate-700">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No student reviews published for this course yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Video Modal */}
      <Modal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title="Course Video Preview"
        maxWidth="max-w-3xl"
      >
        {previewUrl && (
          <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center">
            <video
              src={previewUrl}
              controls
              autoPlay
              className="w-full h-auto max-h-[75vh] object-contain"
            />
          </div>
        )}
      </Modal>
    </>
  )
}
