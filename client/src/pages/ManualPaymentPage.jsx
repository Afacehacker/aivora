import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  ArrowLeft,
  Clock,
  Ban,
  Send,
  Upload,
  FileText,
  Image,
  X,
  Eye,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../components/common/SEO'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import PageLoader from '../components/common/PageLoader'
import CourseMediaPreview, { courseUsesVideoCover } from '../components/common/CourseMediaPreview'
import { formatPrice } from '../components/home/CourseCard'
import courseService from '../services/courseService'
import paymentService from '../services/paymentService'
import api from '../services/api'
import useAuthStore from '../store/authStore'

const ACCEPTED_NIGERIAN_BANKS = [
  'PalmPay',
  'Kuda Bank',
  'Moniepoint MFB',
  'UBA (United Bank for Africa)',
  'Access Bank',
  'FirstBank of Nigeria',
  'GTBank (Guaranty Trust Bank)',
  'Zenith Bank',
  'Fidelity Bank',
  'Stanbic IBTC Bank',
  'FCMB',
  'Union Bank',
  'Sterling Bank',
  'Wema Bank / ALAT',
  'Polaris Bank',
  'Keystone Bank',
  'Ecobank Nigeria',
  'Other Nigerian Bank (Not OPay)',
]

export default function ManualPaymentPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()

  const [course, setCourse] = useState(null)
  const [paymentAccounts, setPaymentAccounts] = useState([])
  const [paymentNotice, setPaymentNotice] = useState('')
  const [selectedAccountIdx, setSelectedAccountIdx] = useState(0)
  const [copiedAccountId, setCopiedAccountId] = useState(null)
  const [loading, setLoading] = useState(true)

  // Coupon state
  const [couponCode, setCouponCode] = useState(searchParams.get('coupon') || '')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  // Manual transfer submission form
  const [senderName, setSenderName] = useState(user?.name || '')
  const [senderBank, setSenderBank] = useState('PalmPay')
  const [customBankName, setCustomBankName] = useState('')
  const [transferNote, setTransferNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedReceipt, setSubmittedReceipt] = useState(null)

  // Local Payment Receipt File Upload State
  const receiptFileInputRef = useRef(null)
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptPreview, setReceiptPreview] = useState('')
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [receiptProgress, setReceiptProgress] = useState(0)

  const handleReceiptFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Receipt file is too large. Please select a picture or PDF under 15MB.')
      return
    }

    setReceiptFile(file)
    if (file.type.startsWith('image/')) {
      setReceiptPreview(URL.createObjectURL(file))
    } else {
      setReceiptPreview('')
    }

    setUploadingReceipt(true)
    setReceiptProgress(0)

    try {
      const res = await paymentService.uploadReceipt(file, (evt) => {
        if (evt.total) {
          setReceiptProgress(Math.round((evt.loaded * 100) / evt.total))
        }
      })
      const uploadedUrl = res?.data?.url || res?.url || res?.data?.data?.url || ''
      if (!uploadedUrl) {
        throw new Error('Could not upload receipt. Please try again.')
      }
      setReceiptUrl(uploadedUrl)
      toast.success('Payment receipt screenshot attached successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to upload receipt screenshot.')
    } finally {
      setUploadingReceipt(false)
      if (receiptFileInputRef.current) receiptFileInputRef.current.value = ''
    }
  }

  const handleRemoveReceipt = () => {
    setReceiptFile(null)
    setReceiptUrl('')
    setReceiptPreview('')
    if (receiptFileInputRef.current) receiptFileInputRef.current.value = ''
  }

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please sign in or create an account to complete payment.')
      navigate('/auth/login')
      return
    }

    let isMounted = true
    const loadPaymentData = async () => {
      setLoading(true)
      try {
        const [courseRes, accountsRes] = await Promise.all([
          courseService.getCourseBySlug(slug),
          paymentService.getPaymentAccounts(),
        ])

        if (!isMounted) return
        const courseData = courseRes.data
        setCourse(courseData)

        const accData = accountsRes?.data || {}
        setPaymentAccounts(accData.paymentAccounts || [])
        setPaymentNotice(
          accData.paymentNotice ||
            'Payments cannot be received from OPay because transfers from OPay are currently facing gateway problems. However, we accept payments from any other Nigerian bank such as PalmPay, Kuda, Moniepoint, UBA, Access Bank, FirstBank, or any other Nigerian bank (not OPay).'
        )

        // Check if already enrolled
        const enrRes = await courseService.checkEnrollment(courseData._id)
        if (enrRes?.data?.isEnrolled) {
          toast.success('You are already enrolled in this course!')
          navigate(`/dashboard/learn/${courseData._id}`)
        }
      } catch (err) {
        toast.error(err.message || 'Could not load checkout details')
        navigate('/courses')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadPaymentData()
    return () => {
      isMounted = false
    }
  }, [slug, isAuthenticated, navigate])

  if (loading) return <PageLoader />
  if (!course) return null

  const hasDiscount =
    course.discountPrice !== null &&
    course.discountPrice !== undefined &&
    course.discountPrice < course.price &&
    (!course.discountExpiry || new Date(course.discountExpiry) > new Date())

  const basePrice = hasDiscount ? course.discountPrice : course.price
  const finalPrice = Math.max(0, basePrice - couponDiscount)
  const selectedAccount = paymentAccounts[selectedAccountIdx] || paymentAccounts[0] || null

  const handleCopyAccount = (accountNumber, id) => {
    navigator.clipboard.writeText(accountNumber)
    setCopiedAccountId(id)
    toast.success('Account number copied to clipboard!')
    setTimeout(() => setCopiedAccountId(null), 2500)
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
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

  const resolvedSenderBank =
    senderBank === 'Other Nigerian Bank (Not OPay)' ? customBankName.trim() : senderBank

  const isOpayTyped =
    resolvedSenderBank.toLowerCase().includes('opay') ||
    customBankName.toLowerCase().includes('opay')

  const handleSubmitManualPayment = async (e) => {
    e.preventDefault()

    if (isOpayTyped) {
      toast.error(
        'Payments from OPay cannot be received due to gateway problems. Please use PalmPay, Kuda, Moniepoint, UBA, Access Bank, FirstBank, or another Nigerian bank.'
      )
      return
    }

    if (finalPrice > 0 && (!senderName.trim() || !resolvedSenderBank)) {
      toast.error('Please enter the sender name and select the Nigerian bank you transferred from.')
      return
    }

    setSubmitting(true)
    try {
      const res = await paymentService.initializePayment({
        courseId: course._id,
        couponCode: couponDiscount > 0 ? couponCode : undefined,
        senderName: senderName.trim(),
        senderBank: resolvedSenderBank,
        recipientBank: selectedAccount?.bankName || '',
        recipientAccountNumber: selectedAccount?.accountNumber || '',
        transferNote: transferNote.trim(),
        proofUrl: receiptUrl || undefined,
      })

      if (res.data?.enrolled) {
        toast.success('Successfully enrolled!')
        navigate(`/dashboard/learn/${course._id}`)
        return
      }

      setSubmittedReceipt(res.data)
      toast.success('Manual payment details submitted for verification!')
    } catch (err) {
      toast.error(err.message || 'Could not submit manual payment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <SEO
        title={`Manual Bank Transfer Payment — ${course.title}`}
        description={`Complete your manual bank transfer for ${course.title} on AIVORA.`}
      />

      <div className="pt-24 pb-24 bg-[#fff5f7] min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Back Link */}
          <div className="flex items-center justify-between">
            <Link
              to={`/courses/${course.slug}`}
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-pink-600 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Course Details</span>
            </Link>
            <Badge color="pink">Manual Bank Transfer Checkout</Badge>
          </div>

          {/* CRITICAL OPAY GATEWAY WARNING BANNER */}
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 sm:p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-display font-black text-slate-900">
                    Important Notice: Please Do Not Pay From OPay
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    <Ban className="w-3.5 h-3.5" /> OPay Gateway Unavailable
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {paymentNotice}
                </p>

                {/* Supported Banks Visual Pills */}
                <div className="pt-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">
                    Accepted Nigerian Banks (Fast Confirmation):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'PalmPay',
                      'Kuda',
                      'Moniepoint',
                      'UBA',
                      'Access Bank',
                      'FirstBank',
                      'GTBank',
                      'Zenith Bank',
                      'Any Other Nigerian Bank',
                    ].map((bank) => (
                      <span
                        key={bank}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {bank}
                      </span>
                    ))}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-700 line-through">
                      <Ban className="w-3.5 h-3.5 text-rose-500" />
                      OPay (Not Accepted)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {submittedReceipt ? (
            /* Payment Submitted Confirmation Card */
            <div className="bg-white rounded-3xl p-8 border border-emerald-200 text-center space-y-6 max-w-2xl mx-auto shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>

              <div className="space-y-2">
                <Badge color="success">Manual Transfer Submitted</Badge>
                <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900">
                  Payment Confirmation Received!
                </h1>
                <p className="text-sm text-slate-600 max-w-lg mx-auto">
                  We have received your manual transfer details for{' '}
                  <strong className="text-slate-900">{course.title}</strong>. An administrator will verify
                  your transfer and unlock your course access shortly.
                </p>
              </div>

              <div className="rounded-2xl bg-pink-50/50 border border-pink-100 p-5 text-left space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Reference:</span>
                  <span className="font-mono font-bold text-pink-600">
                    {submittedReceipt.reference}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Transferred:</span>
                  <span className="font-bold text-slate-900">{formatPrice(submittedReceipt.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sender Name:</span>
                  <span className="text-slate-800 font-medium">{senderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sender Bank:</span>
                  <span className="text-emerald-700 font-semibold">{resolvedSenderBank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verification Status:</span>
                  <Badge color="warning">Pending Admin Confirmation</Badge>
                </div>
                {receiptUrl && (
                  <div className="pt-2 border-t border-pink-100 flex items-center justify-between">
                    <span className="text-slate-500">Transfer Receipt:</span>
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-pink-600 hover:text-pink-700 underline inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Uploaded Receipt
                    </a>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link to="/dashboard/purchases">
                  <Button variant="primary">View Purchase Status</Button>
                </Link>
                <Link to="/courses">
                  <Button variant="secondary">Browse More Courses</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Admin Bank Transfer Details + Confirmation Form */}
              <div className="lg:col-span-7 space-y-6">
                {/* Step 1: Transfer to Admin Bank Account */}
                <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-pink-600">
                        Step 1 of 2
                      </span>
                      <h2 className="text-xl font-display font-bold text-slate-900 mt-0.5">
                        Transfer {formatPrice(finalPrice)} to Our Bank Account
                      </h2>
                    </div>
                    <Building2 className="w-6 h-6 text-pink-500" />
                  </div>

                  {paymentAccounts.length > 0 ? (
                    <div className="space-y-4">
                      {paymentAccounts.map((acc, idx) => {
                        const isSelected = idx === selectedAccountIdx
                        return (
                          <div
                            key={acc._id || idx}
                            onClick={() => setSelectedAccountIdx(idx)}
                            className={`rounded-2xl p-5 border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-pink-50/70 border-pink-500 shadow-sm'
                                : 'bg-white border-pink-200 hover:border-pink-300'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs uppercase tracking-wider font-semibold text-pink-600">
                                    {acc.bankName}
                                  </span>
                                  {paymentAccounts.length > 1 && (
                                    <Badge color={isSelected ? 'pink' : 'default'}>
                                      {isSelected ? 'Selected Account' : 'Click to Use'}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-2xl sm:text-3xl font-mono font-black text-slate-900 tracking-wider">
                                  {acc.accountNumber}
                                </p>
                                <p className="text-sm text-slate-600">
                                  Account Name:{' '}
                                  <strong className="text-slate-900">{acc.accountName}</strong>
                                </p>
                              </div>

                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopyAccount(acc.accountNumber, acc._id || idx)
                                }}
                                iconLeft={
                                  copiedAccountId === (acc._id || idx) ? (
                                    <Check className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )
                                }
                              >
                                {copiedAccountId === (acc._id || idx)
                                  ? 'Copied!'
                                  : 'Copy Account No.'}
                              </Button>
                            </div>

                            {acc.instructions && (
                              <p className="mt-3 pt-3 border-t border-pink-100 text-xs text-slate-600">
                                💡 {acc.instructions}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-sm text-amber-900">
                      Payment account details are currently being updated by the administrator. Please
                      check back shortly or contact support.
                    </div>
                  )}
                </div>

                {/* Step 2: Submit Transfer Details */}
                <form
                  onSubmit={handleSubmitManualPayment}
                  className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm space-y-5"
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-pink-600">
                      Step 2 of 2
                    </span>
                    <h2 className="text-xl font-display font-bold text-slate-900 mt-0.5">
                      Confirm Your Bank Transfer Details
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      After sending {formatPrice(finalPrice)}, fill in your transfer details below so
                      our team can immediately verify and unlock your course.
                    </p>
                  </div>

                  <Input
                    label="Sender Account Name (Name on the bank account you sent from)"
                    placeholder="e.g. Chukwudi Okafor"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    required
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Nigerian Bank You Transferred From (No OPay)
                    </label>
                    <select
                      value={senderBank}
                      onChange={(e) => setSenderBank(e.target.value)}
                      className="w-full rounded-xl bg-white border border-pink-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-pink-500"
                    >
                      {ACCEPTED_NIGERIAN_BANKS.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-amber-700">
                      * Remember: Transfers from <strong>OPay</strong> cannot be received due to
                      gateway issues. Use PalmPay, Kuda, Moniepoint, UBA, Access, FirstBank, or any
                      other Nigerian bank.
                    </p>
                  </div>

                  {senderBank === 'Other Nigerian Bank (Not OPay)' && (
                    <Input
                      label="Enter Your Nigerian Bank Name"
                      placeholder="e.g. Providus Bank, Jaiz Bank, TajBank, Lotus Bank..."
                      value={customBankName}
                      onChange={(e) => setCustomBankName(e.target.value)}
                      required
                    />
                  )}

                  {isOpayTyped && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 flex items-center gap-2">
                      <Ban className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>
                        Payments from <strong>OPay</strong> cannot be received due to gateway
                        problems. Please use another Nigerian bank (PalmPay, Kuda, Moniepoint, UBA,
                        Access Bank, FirstBank, etc.).
                      </span>
                    </div>
                  )}

                  <Input
                    label="Transfer Reference / Session ID / Narration (Optional)"
                    placeholder="e.g. Session ID or transfer time / remark"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                  />

                  {/* Payment Receipt / Screenshot Upload from Local Device */}
                  <div className="space-y-2.5 rounded-2xl bg-pink-50/70 border border-pink-200 p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-pink-600" />
                        Upload Payment Receipt / Transfer Screenshot
                      </label>
                      <span className="text-[11px] text-pink-600 font-semibold bg-pink-100 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Upload the bank transfer screenshot or receipt picture from your phone gallery or computer for faster automatic confirmation.
                    </p>

                    <input
                      ref={receiptFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                      onChange={handleReceiptFileChange}
                      className="hidden"
                    />

                    {uploadingReceipt && (
                      <div className="p-3 rounded-xl bg-white border border-pink-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700 flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-500" />
                            Uploading receipt from your device...
                          </span>
                          <span className="text-pink-600 font-bold">{receiptProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-pink-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300"
                            style={{ width: `${receiptProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {receiptUrl ? (
                      <div className="relative rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 flex items-center gap-3">
                        {receiptPreview ? (
                          <img
                            src={receiptPreview}
                            alt="Receipt Preview"
                            className="w-16 h-16 rounded-lg object-cover border border-emerald-300 flex-shrink-0 bg-white"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center flex-shrink-0 text-emerald-700">
                            <FileText className="w-7 h-7" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            Receipt Attached
                          </div>
                          <p className="text-xs text-slate-700 truncate font-medium mt-0.5">
                            {receiptFile?.name || 'receipt-image'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {receiptFile?.size ? `${Math.round(receiptFile.size / 1024)} KB` : 'Uploaded'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => receiptFileInputRef.current?.click()}
                            className="text-xs font-semibold text-pink-600 hover:text-pink-700 px-2.5 py-1 rounded-lg bg-white border border-pink-200 shadow-sm"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveReceipt}
                            className="text-xs text-rose-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50"
                            title="Remove receipt"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      !uploadingReceipt && (
                        <div
                          onClick={() => receiptFileInputRef.current?.click()}
                          className="rounded-xl border-2 border-dashed border-pink-300 hover:border-pink-500 bg-white p-5 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 group"
                        >
                          <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-800 block">
                              Click to select receipt picture from phone or computer
                            </span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              Supports JPG, PNG, WEBP, or PDF (Max 15MB)
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    loading={submitting}
                    disabled={isOpayTyped || paymentAccounts.length === 0}
                    iconLeft={<Send className="w-4 h-4" />}
                  >
                    I Have Sent {formatPrice(finalPrice)} — Submit Payment
                  </Button>
                </form>
              </div>

              {/* Right Column: Order Summary */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-3xl overflow-hidden border border-pink-100 shadow-xl space-y-5">
                  <div
                    className={
                      courseUsesVideoCover(course)
                        ? 'relative w-full bg-black flex items-center justify-center overflow-hidden'
                        : 'relative aspect-video bg-pink-50'
                    }
                  >
                    <CourseMediaPreview
                      course={course}
                      className="w-full h-full object-cover"
                      videoClassName="w-full h-auto max-h-[320px] object-contain block"
                    />
                  </div>

                  <div className="p-6 space-y-5">
                    <div>
                      <Badge color="pink">{course.category?.name || 'AI Course'}</Badge>
                      <h3 className="text-lg font-display font-bold text-slate-900 mt-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">{course.shortDescription}</p>
                    </div>

                    {/* Coupon Input */}
                    {basePrice > 0 && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Coupon code (optional)"
                          className="flex-1 px-3 py-2 rounded-xl bg-pink-50/50 border border-pink-200 text-xs text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-pink-500"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          loading={applyingCoupon}
                          onClick={handleApplyCoupon}
                        >
                          Apply
                        </Button>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="space-y-2.5 pt-4 border-t border-pink-100 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>Course Price:</span>
                        <span>{formatPrice(basePrice)}</span>
                      </div>
                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Coupon Discount:</span>
                          <span>-{formatPrice(couponDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-display font-black text-slate-900 pt-2 border-t border-pink-100">
                        <span>Total to Transfer:</span>
                        <span className="text-pink-600 text-xl">{formatPrice(finalPrice)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-pink-100 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Verified Manual Bank Transfer Enrollment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-pink-500 flex-shrink-0" />
                        <span>Lifetime access unlocked upon transfer confirmation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
