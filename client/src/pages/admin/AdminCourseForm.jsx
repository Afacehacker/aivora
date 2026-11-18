import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Save, Plus, Trash2, ArrowLeft, Video, Upload,
  Image as ImageIcon, Film, CheckCircle2, FileText, Loader2, Eye,
  Lock, Unlock, Clock, AlertCircle, ChevronUp, ChevronDown, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import adminService from '../../services/adminService'
import { formatMinutesLong } from '../../components/home/CourseCard'
import { cleanLessonTitle } from '../../utils/lessonTitle'
import CourseMediaPreview, { normalizeMediaUrl } from '../../components/common/CourseMediaPreview'

const getVideoDurationFromFile = (file) => {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(300), 2000)
    try {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        clearTimeout(timer)
        try {
          window.URL.revokeObjectURL(video.src)
        } catch {}
        resolve(Math.round(video.duration) || 300)
      }
      video.onerror = () => {
        clearTimeout(timer)
        resolve(300)
      }
      video.src = URL.createObjectURL(file)
    } catch {
      clearTimeout(timer)
      resolve(300)
    }
  })
}

export default function AdminCourseForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const previewVideoInputRef = useRef(null)
  const multiVideoInputRef = useRef(null)
  const singleVideoInputRef = useRef(null)
  const activeSingleIndexRef = useRef(null)

  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [courseId, setCourseId] = useState(id || null)

  // Upload progress indicators
  const [uploadingPreview, setUploadingPreview] = useState(false)
  const [previewProgress, setPreviewProgress] = useState(0)
  const [previewStatus, setPreviewStatus] = useState('')

  // Batch multi-video upload state
  const [uploadingBatch, setUploadingBatch] = useState(false)
  const [batchStatus, setBatchStatus] = useState('')
  const [batchProgress, setBatchProgress] = useState(0)

  // Individual video upload
  const [uploadingSingleIndex, setUploadingSingleIndex] = useState(null)
  const [singleProgress, setSingleProgress] = useState(0)

  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    category: '',
    price: 35000,
    discountPrice: '',
    previewVideo: '',
    isFeatured: true,
    isPublished: true,
  })

  // List of Video Tutorials attached to this course/product
  const [tutorials, setTutorials] = useState([])

  useEffect(() => {
    adminService
      .getAllCategories()
      .then((res) => {
        const list = res?.data || []
        setCategories(list)
        if (!isEditing && list[0]) {
          setForm((prev) => ({ ...prev, category: list[0]._id }))
        }
      })
      .catch(() => {})

    if (isEditing) {
      adminService
        .getCourseById(id)
        .then((res) => {
          const c = res.data
          setCourseId(c._id)
          setForm({
            title: c.title || '',
            shortDescription: c.shortDescription || c.description || '',
            category: c.category?._id || c.category || '',
            price: c.price ?? 0,
            discountPrice: c.discountPrice ?? '',
            previewVideo: c.previewVideo || '',
            isFeatured: Boolean(c.isFeatured),
            isPublished: Boolean(c.isPublished),
          })

          // Extract all tutorial videos from modules (guaranteeing no device filenames)
          const loadedModules = c.modules || []
          const initialTutorials = []
          loadedModules.forEach((m) => {
            (m.lessons || []).forEach((l, idx) => {
              initialTutorials.push({
                _id: l._id,
                title: cleanLessonTitle(l.title, idx),
                description: l.description || '',
                videoUrl: l.videoUrl || '',
                videoDuration: Number(l.videoDuration) || 0,
                isPreview: Boolean(l.isPreview),
                resources: l.resources || [],
              })
            })
          })
          setTutorials(initialTutorials)
        })
        .catch((err) => toast.error(err.message || 'Could not load course'))
    }
  }, [id, isEditing])

  // Upload Preview / Promo Video Handler (The Product Cover) - Single Direct Upload
  const handlePreviewVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPreview(true)
    setPreviewProgress(0)
    setPreviewStatus('Uploading video...')
    try {
      const res = await adminService.uploadMedia(file, (progressEvent) => {
        const pct = progressEvent.total
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 0
        setPreviewProgress(pct)
        setPreviewStatus(`Uploading video ${pct}%...`)
      })
      const uploadedUrl = res?.data?.url || res?.url || res?.data?.data?.url || ''
      if (!uploadedUrl) {
        throw new Error('Upload finished but no video URL was returned. Please try again.')
      }
      setForm((prev) => ({ ...prev, previewVideo: uploadedUrl }))
      toast.success('Course preview video uploaded!')
    } catch (err) {
      console.error('Preview video upload error:', err)
      toast.error(err?.message || err?.data?.message || 'Video upload failed')
    } finally {
      setUploadingPreview(false)
      setPreviewStatus('')
      e.target.value = ''
    }
  }

  // Batch Multi-Video Upload Handler (Direct single upload per video file)
  const handleMultipleVideosUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploadingBatch(true)
    setBatchProgress(0)

    try {
      const addedTutorials = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setBatchStatus(`Uploading video ${i + 1} of ${files.length}...`)

        // Extract duration from video file metadata
        const duration = await getVideoDurationFromFile(file)

        // Upload video file directly in 1 piece
        const res = await adminService.uploadMedia(file, (progressEvent) => {
          const filePct = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          const overallPct = Math.round(((i + filePct / 100) / files.length) * 100)
          setBatchProgress(overallPct)
          setBatchStatus(
            `Uploading video ${i + 1} of ${files.length} (${filePct}%)...`
          )
        })

        const videoUrl = res?.data?.url || res?.url || res?.data?.data?.url || ''

        // Never display or store device filenames. Use clean professional tutorial title.
        const defaultTitle = `Video Tutorial ${tutorials.length + i + 1}`

        addedTutorials.push({
          _id: `tut-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          title: defaultTitle,
          description: '',
          videoUrl: videoUrl,
          videoDuration: duration || res?.data?.duration || res?.data?.data?.duration || 300,
          isPreview: false, // Access unlocked only after payment!
          resources: [],
        })
      }

      setTutorials((prev) => [...prev, ...addedTutorials])
      toast.success(`${files.length} tutorial video${files.length > 1 ? 's' : ''} uploaded and added!`)
    } catch (err) {
      console.error('Batch video upload error:', err)
      toast.error(err?.message || err?.data?.message || 'Failed to upload videos')
    } finally {
      setUploadingBatch(false)
      setBatchStatus('')
      setBatchProgress(0)
      if (multiVideoInputRef.current) multiVideoInputRef.current.value = ''
    }
  }

  // Single Video File Upload / Replace for a specific tutorial item - Direct single upload
  const handleSingleVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    const index = activeSingleIndexRef.current
    if (!file || index === null || index === undefined) return

    setUploadingSingleIndex(index)
    setSingleProgress(0)

    try {
      const duration = await getVideoDurationFromFile(file)
      const res = await adminService.uploadMedia(file, (progressEvent) => {
        const pct = progressEvent.total
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 0
        setSingleProgress(pct)
      })

      const videoUrl = res?.data?.url || res?.url || res?.data?.data?.url || ''

      setTutorials((prev) => {
        const next = [...prev]
        if (next[index]) {
          next[index] = {
            ...next[index],
            videoUrl: videoUrl || next[index].videoUrl,
            videoDuration: duration || res?.data?.duration || res?.data?.data?.duration || next[index].videoDuration || 300,
            title: cleanLessonTitle(next[index].title, index),
          }
        }
        return next
      })

      toast.success('Tutorial video uploaded!')
    } catch (err) {
      console.error('Single video upload error:', err)
      toast.error(err?.message || err?.data?.message || 'Upload failed')
    } finally {
      setUploadingSingleIndex(null)
      setSingleProgress(0)
      activeSingleIndexRef.current = null
      if (singleVideoInputRef.current) singleVideoInputRef.current.value = ''
    }
  }

  // Trigger file replacement for a specific tutorial
  const triggerSingleUpload = (index) => {
    activeSingleIndexRef.current = index
    singleVideoInputRef.current?.click()
  }

  // Add an empty Video Tutorial row manually
  const handleAddManualTutorial = () => {
    setTutorials((prev) => [
      ...prev,
      {
        _id: `tut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: `Video Tutorial ${prev.length + 1}`,
        description: '',
        videoUrl: '',
        videoDuration: 300,
        isPreview: false, // Access unlocked only after payment
        resources: [],
      },
    ])
  }

  // Update tutorial field
  const updateTutorialField = (index, field, value) => {
    setTutorials((prev) => {
      const next = [...prev]
      if (next[index]) {
        next[index] = { ...next[index], [field]: value }
      }
      return next
    })
  }

  // Move tutorial Up or Down
  const moveTutorial = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= tutorials.length) return
    setTutorials((prev) => {
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  // Delete tutorial
  const deleteTutorial = (index) => {
    setTutorials((prev) => prev.filter((_, i) => i !== index))
  }

  // Save Course & All Video Tutorials
  const handleSaveCourse = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!form.title || !form.category) {
      toast.error('Course title and category are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        shortDescription: form.shortDescription,
        description: form.shortDescription || form.title,
        category: form.category,
        level: 'beginner',
        price: Number(form.price),
        discountPrice: form.discountPrice !== '' ? Number(form.discountPrice) : null,
        thumbnail: null,
        previewVideo: form.previewVideo,
        objectives: [],
        requirements: [],
        targetAudience: [],
        isFeatured: form.isFeatured,
        isPublished: form.isPublished,
        tutorials: tutorials.map((t, idx) => ({
          title: cleanLessonTitle(t.title?.trim(), idx),
          description: t.description || '',
          videoUrl: t.videoUrl || null,
          videoDuration: Number(t.videoDuration) || 0,
          isPreview: Boolean(t.isPreview),
          order: idx + 1,
          resources: t.resources || [],
        })),
      }

      if (courseId) {
        await adminService.updateCourse(courseId, payload)
        toast.success('Course and video tutorials updated successfully!')
      } else {
        const res = await adminService.createCourse(payload)
        const createdId = res.data._id
        setCourseId(createdId)
        toast.success('Course and all tutorial videos published successfully!')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save course')
    } finally {
      setSaving(false)
    }
  }

  // Delete entire course handler
  const handleDeleteCourse = async () => {
    if (!courseId) return
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${form.title || 'this course'}"? This cannot be undone.`
      )
    ) {
      return
    }
    setSaving(true)
    try {
      await adminService.deleteCourse(courseId)
      toast.success('Course deleted permanently')
      navigate('/admin/courses')
    } catch (err) {
      toast.error(err.message || 'Could not delete course')
      setSaving(false)
    }
  }

  // Calculate live counters
  const totalVideoCount = tutorials.length
  const totalDurationSeconds = tutorials.reduce(
    (sum, t) => sum + (Number(t.videoDuration) || 0),
    0
  )
  const paidVideosCount = tutorials.filter((t) => !t.isPreview).length
  const freePreviewsCount = tutorials.filter((t) => t.isPreview).length

  return (
    <>
      <SEO title={isEditing ? 'Edit Course — AIVORA Admin' : 'Create Course — AIVORA Admin'} />

      {/* Hidden file inputs */}
      <input
        ref={multiVideoInputRef}
        type="file"
        multiple
        accept="video/mp4,video/webm,video/quicktime,video/*"
        onChange={handleMultipleVideosUpload}
        className="hidden"
      />
      <input
        ref={singleVideoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        onChange={handleSingleVideoUpload}
        className="hidden"
      />

      <div className="space-y-8 max-w-6xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/courses')}
              className="p-2 rounded-xl bg-white border border-pink-200 text-slate-700 hover:text-pink-600 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900">
                {courseId ? 'Edit Product & Video Tutorials' : 'Create & Upload New Product'}
              </h1>
              <p className="text-sm text-slate-600">
                Upload product pictures, preview video, and attach multiple video tutorials with payment-protected access.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {courseId && (
              <button
                type="button"
                onClick={handleDeleteCourse}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
                title="Permanently Delete This Course"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete Course</span>
              </button>
            )}
            <Button
              onClick={handleSaveCourse}
              loading={saving}
              iconLeft={<Save className="w-4 h-4" />}
            >
              {courseId ? 'Save Changes' : 'Publish Product'}
            </Button>
          </div>
        </div>

        {/* STEP 1: Product Cover Video */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-pink-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-pink-100 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-pink-600">
                Step 1 • Product Cover Video
              </span>
              <h2 className="text-lg font-display font-bold text-slate-900 mt-0.5">
                Product Cover Video (Free Teaser / Promo)
              </h2>
            </div>
            <Badge color="pink">Video Only Cover</Badge>
          </div>

          <div className="rounded-2xl bg-pink-50/50 border border-pink-100 p-5 space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Film className="w-4 h-4 text-pink-500" />
                Product Cover Video
              </span>
              <input
                ref={previewVideoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                onChange={handlePreviewVideoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={uploadingPreview}
                onClick={() => previewVideoInputRef.current?.click()}
                iconLeft={<Upload className="w-3.5 h-3.5" />}
              >
                {uploadingPreview ? `Uploading ${previewProgress}%` : 'Upload Video File'}
              </Button>
            </div>

            {uploadingPreview && (
              <div className="p-3 rounded-xl bg-pink-100/70 border border-pink-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{previewStatus}</span>
                  <span className="text-pink-600 font-bold">{previewProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-pink-200 overflow-hidden">
                  <div
                    className="h-full bg-pink-500 transition-all duration-300"
                    style={{ width: `${previewProgress}%` }}
                  />
                </div>
              </div>
            )}

            {form.previewVideo ? (
              <div className="relative rounded-xl overflow-hidden bg-black border border-pink-200 flex items-center justify-center">
                <CourseMediaPreview
                  course={{ previewVideo: form.previewVideo }}
                  className="w-full h-auto max-h-[360px] object-contain block"
                  autoPlay={false}
                  muted={false}
                  controls={true}
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, previewVideo: '' })}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 text-xs text-rose-400 hover:bg-black z-10"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                onClick={() => previewVideoInputRef.current?.click()}
                className="aspect-video rounded-xl border-2 border-dashed border-pink-300 hover:border-pink-500 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors p-4 text-center bg-white"
              >
                <Film className="w-8 h-8 text-pink-400" />
                <p className="text-xs font-medium text-slate-700">
                  Click to upload the product cover video (MP4, MOV, WEBM)
                </p>
                <p className="text-[11px] text-slate-500">Or paste a video stream URL below</p>
              </div>
            )}

            <Input
              placeholder="Or paste video stream URL (https://...)"
              value={form.previewVideo}
              onChange={(e) => setForm({ ...form, previewVideo: e.target.value })}
            />
          </div>
        </div>

        {/* STEP 2: Product Information & Pricing */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-pink-100 shadow-sm space-y-6">
          <div className="border-b border-pink-100 pb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-pink-600">
              Step 2 • Product Details & Pricing
            </span>
            <h2 className="text-lg font-display font-bold text-slate-900 mt-0.5">
              Product Information & Naira Pricing
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product Title"
              placeholder="e.g. IMAGE to VIDEO"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl bg-white border border-pink-200 py-3 px-4 text-sm text-slate-800 focus:outline-none focus:border-pink-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Product Description</label>
            <textarea
              rows={3}
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              placeholder="Learn how to change image to a talking video in less than 5 minutes..."
              className="w-full rounded-xl bg-white border border-pink-200 p-3.5 text-sm text-slate-800 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Regular Price (NGN ₦)"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />

            <Input
              label="Discounted Price (Optional ₦)"
              type="number"
              placeholder="e.g. 10000"
              value={form.discountPrice}
              onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="rounded border-slate-300 text-pink-600 focus:ring-pink-500"
              />
              <span>Publish Immediately</span>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="rounded border-pink-300 text-pink-600 focus:ring-pink-500/20"
              />
              <span>Feature on Homepage</span>
            </label>
          </div>
        </div>

        {/* STEP 3: Video Tutorials Studio (Upload One or Multiple Videos, Payment-Protected Access) */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-pink-200 shadow-sm space-y-6">
          {/* Header & Live Summary Badge */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-pink-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-pink-600">
                  Step 3 • Video Tutorials
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold flex items-center gap-1 border border-emerald-200">
                  <Lock className="w-3 h-3" /> Unlocks After Payment
                </span>
              </div>
              <h2 className="text-xl font-display font-bold text-slate-900 mt-1 flex items-center gap-2">
                <Video className="w-6 h-6 text-pink-500" />
                Add & Manage Course Video Tutorials
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Select one or more videos to add. By default, users only get access to stream these video tutorials after making a payment for this course.
              </p>
            </div>

            {/* Live Product Card Stats Preview */}
            <div className="rounded-xl bg-pink-50/70 border border-pink-100 p-3.5 flex items-center gap-4 flex-shrink-0">
              <div className="text-center px-2 border-r border-pink-200">
                <span className="block text-xs text-slate-500 font-medium">Display on Card</span>
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 justify-center mt-0.5">
                  <Video className="w-4 h-4 text-pink-500" />
                  {totalVideoCount} {totalVideoCount === 1 ? 'Tutorial Video' : 'Tutorial Videos'}
                </span>
              </div>
              <div className="text-center px-2 border-r border-pink-200">
                <span className="block text-xs text-slate-500 font-medium">Minute Long</span>
                <span className="text-sm font-bold text-pink-600 flex items-center gap-1.5 justify-center mt-0.5">
                  <Clock className="w-4 h-4 text-pink-500" />
                  {formatMinutesLong(totalDurationSeconds)}
                </span>
              </div>
              <div className="text-center px-2">
                <span className="block text-xs text-slate-500 font-medium">Paid Protected</span>
                <span className="text-xs font-semibold text-emerald-700 block mt-0.5">
                  {paidVideosCount} Paid / {freePreviewsCount} Preview
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar: Select More Than One Video / Add Video */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-pink-50/40 border border-pink-100">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => multiVideoInputRef.current?.click()}
                loading={uploadingBatch}
                iconLeft={<Upload className="w-4 h-4" />}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
              >
                Select & Upload Videos (Multiple Allowed)
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddManualTutorial}
                iconLeft={<Plus className="w-4 h-4" />}
              >
                Add Video Tutorial by URL
              </Button>
            </div>

            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 text-pink-500 flex-shrink-0" />
              You can select multiple MP4 / MOV videos at once from your computer.
            </span>
          </div>

          {/* Batch Upload Progress Indicator */}
          {uploadingBatch && (
            <div className="p-4 rounded-xl bg-pink-50/70 border border-pink-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                  {batchStatus}
                </span>
                <span className="text-pink-600 font-bold">{batchProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-pink-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300"
                  style={{ width: `${batchProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* List of Tutorial Videos */}
          <div className="space-y-4">
            {tutorials.length === 0 ? (
              <div
                onClick={() => multiVideoInputRef.current?.click()}
                className="p-10 rounded-2xl border-2 border-dashed border-pink-300 hover:border-pink-500 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-3 bg-pink-50/30"
              >
                <div className="w-14 h-14 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600">
                  <Video className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">No Video Tutorials Added Yet</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                    Click here to select more than one video from your computer. They will be automatically uploaded and staged for payment-protected access.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  iconLeft={<Upload className="w-4 h-4" />}
                >
                  Select Video Files (MP4, MOV, WEBM)
                </Button>
              </div>
            ) : (
              tutorials.map((tut, index) => {
                const durationMinutes = Math.round((Number(tut.videoDuration) || 0) / 60)
                const isUploadingThis = uploadingSingleIndex === index

                return (
                  <div
                    key={tut._id || index}
                    className="rounded-2xl border border-pink-100 bg-pink-50/30 p-5 space-y-4 transition-all hover:border-pink-300 shadow-sm"
                  >
                    {/* Top Row: Index, Title, Access Toggle, Reorder, Delete */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-100 pb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-pink-500 text-xs font-bold text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-pink-600 uppercase tracking-wider block">
                            Tutorial Video #{index + 1}
                          </span>
                          <span className="text-sm font-bold text-slate-900 truncate block">
                            {tut.title || `Video Tutorial ${index + 1}`}
                          </span>
                        </div>
                      </div>

                      {/* Access Badge & Controls */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {/* Access Setting (Paid Only vs Free Preview) */}
                        <button
                          type="button"
                          onClick={() => updateTutorialField(index, 'isPreview', !tut.isPreview)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            tut.isPreview
                              ? 'bg-pink-100 text-pink-700 border border-pink-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                          title={
                            tut.isPreview
                              ? 'Click to lock: buyers only get access after payment'
                              : 'Click to allow free sample preview'
                          }
                        >
                          {tut.isPreview ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Free Sample Preview</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>🔒 Paid Only (Locked Until Payment)</span>
                            </>
                          )}
                        </button>

                        {/* Move Up / Down */}
                        <div className="flex items-center rounded-lg bg-white border border-pink-200 shadow-sm">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveTutorial(index, -1)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move Up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={index === tutorials.length - 1}
                            onClick={() => moveTutorial(index, 1)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed border-l border-pink-200"
                            title="Move Down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => deleteTutorial(index)}
                          className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                          title="Remove this video tutorial"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Video Stream / Player & Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* Video Player / Upload Box */}
                      <div className="lg:col-span-5 space-y-2">
                        {tut.videoUrl ? (
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-pink-200">
                            <CourseMediaPreview
                              course={{ previewVideo: tut.videoUrl }}
                              className="w-full h-full object-contain"
                              autoPlay={false}
                              muted={false}
                              controls={true}
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white font-medium flex items-center gap-1 z-10">
                              <Video className="w-3 h-3 text-pink-400" />
                              Video Attached
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => triggerSingleUpload(index)}
                            className="aspect-video rounded-xl border border-dashed border-pink-300 hover:border-pink-500 bg-white flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors"
                          >
                            <Film className="w-6 h-6 text-pink-400 mb-1" />
                            <span className="text-xs text-slate-700 font-medium">Click to upload video file</span>
                            <span className="text-[10px] text-slate-500">MP4, MOV, WEBM</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            loading={isUploadingThis}
                            onClick={() => triggerSingleUpload(index)}
                            iconLeft={<Upload className="w-3.5 h-3.5" />}
                            className="text-xs py-1.5"
                          >
                            {tut.videoUrl ? 'Replace Video File' : 'Upload Video File'}
                          </Button>
                          {tut.videoUrl && (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                              ✓ Video ready
                            </span>
                          )}
                        </div>

                        {isUploadingThis && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-600">
                              <span>Uploading...</span>
                              <span>{singleProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-pink-200 overflow-hidden">
                              <div
                                className="h-full bg-pink-500 transition-all"
                                style={{ width: `${singleProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Video Tutorial Metadata Form */}
                      <div className="lg:col-span-7 space-y-3">
                        <Input
                          label="Tutorial Video Title"
                          placeholder="e.g. Tutorial 1: Getting Started with Prompt Engineering"
                          value={tut.title}
                          onChange={(e) => updateTutorialField(index, 'title', e.target.value)}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Duration input in minutes */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-700 flex items-center justify-between">
                              <span>Duration (minutes long)</span>
                              <span className="text-[11px] text-pink-600 font-semibold">
                                {Number(tut.videoDuration) || 0} seconds
                              </span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                value={durationMinutes}
                                onChange={(e) => {
                                  const mins = Number(e.target.value) || 0
                                  updateTutorialField(index, 'videoDuration', mins * 60)
                                }}
                                className="w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-white border border-pink-200 text-sm text-slate-800 focus:outline-none focus:border-pink-500"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                                mins
                              </span>
                            </div>
                          </div>

                          {/* Access Mode Selector */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-700">Access Permission</label>
                            <select
                              value={tut.isPreview ? 'preview' : 'paid'}
                              onChange={(e) =>
                                updateTutorialField(index, 'isPreview', e.target.value === 'preview')
                              }
                              className="w-full px-3 py-2.5 rounded-xl bg-white border border-pink-200 text-xs text-slate-800 focus:outline-none focus:border-pink-500"
                            >
                              <option value="paid">🔒 Paid Only (Locked Until Payment)</option>
                              <option value="preview">🎁 Free Sample Preview</option>
                            </select>
                          </div>
                        </div>

                        {/* Video URL direct paste */}
                        <Input
                          label="Video Stream / Direct URL"
                          placeholder="https://... (or leave uploaded URL above)"
                          value={tut.videoUrl}
                          onChange={(e) => updateTutorialField(index, 'videoUrl', e.target.value)}
                        />

                        {/* Access explanation note */}
                        <div className="p-2.5 rounded-xl bg-white border border-pink-200 flex items-start gap-2 text-[11px] text-slate-700 shadow-sm">
                          {tut.isPreview ? (
                            <>
                              <Unlock className="w-4 h-4 text-pink-600 flex-shrink-0 mt-0.5" />
                              <span>
                                This video is marked as a <strong>Free Preview</strong>. Potential buyers can watch it before purchasing.
                              </span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span>
                                <strong>Paid Protection Active:</strong> A user only gets access to watch this video after making a payment and getting enrolled in this course.
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Bottom Bar inside Step 3 */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => multiVideoInputRef.current?.click()}
                iconLeft={<Upload className="w-4 h-4" />}
              >
                + Add More Videos (Select Multiple)
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddManualTutorial}
                iconLeft={<Plus className="w-4 h-4" />}
              >
                + Add Video Tutorial by URL
              </Button>
            </div>

            <div className="text-xs text-slate-600">
              Total: <strong className="text-slate-900 font-semibold">{totalVideoCount} Tutorial Videos</strong> •{' '}
              <strong className="text-pink-600 font-bold">{formatMinutesLong(totalDurationSeconds)}</strong>
            </div>
          </div>
        </div>

        {/* Bottom Publish Bar */}
        <div className="bg-white rounded-2xl p-5 border border-pink-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            Ready to publish? All uploaded pictures, preview promo video, and payment-protected video tutorials will be saved together.
          </div>
          <Button
            size="lg"
            loading={saving}
            onClick={handleSaveCourse}
            iconLeft={<Save className="w-4 h-4" />}
          >
            {courseId ? 'Save All Course Changes' : 'Publish Course & All Video Tutorials'}
          </Button>
        </div>
      </div>
    </>
  )
}
