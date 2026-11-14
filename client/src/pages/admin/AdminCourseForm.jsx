import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Save, Plus, Trash2, ArrowLeft, Video, Layers, Upload,
  Image as ImageIcon, Film, CheckCircle2, FileText, Loader2, Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import adminService from '../../services/adminService'

export default function AdminCourseForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const thumbnailInputRef = useRef(null)
  const previewVideoInputRef = useRef(null)
  const lessonVideoInputRef = useRef(null)
  const lessonResourceInputRef = useRef(null)

  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [courseId, setCourseId] = useState(id || null)

  // Upload progress indicators
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [uploadingPreview, setUploadingPreview] = useState(false)
  const [previewProgress, setPreviewProgress] = useState(0)
  const [uploadingLessonVideo, setUploadingLessonVideo] = useState(false)
  const [lessonVideoProgress, setLessonVideoProgress] = useState(0)
  const [uploadingResource, setUploadingResource] = useState(false)

  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    description: '',
    category: '',
    level: 'beginner',
    price: 35000,
    discountPrice: '',
    thumbnail: '',
    previewVideo: '',
    objectivesText: '',
    requirementsText: '',
    audienceText: '',
    isFeatured: true,
    isPublished: true,
  })

  // Curriculum state (Modules & Lessons) — works BEFORE and AFTER saving the course!
  const [modules, setModules] = useState([
    {
      _id: 'temp-mod-1',
      isTemp: true,
      title: 'Module 1: Introduction & Core Workflow',
      order: 1,
      lessons: [],
    },
  ])
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [lessonForm, setLessonForm] = useState({
    moduleId: 'temp-mod-1',
    title: '',
    description: '',
    videoUrl: '',
    videoDuration: 600,
    isPreview: false,
    resourceTitle: '',
    resourceUrl: '',
  })

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
            shortDescription: c.shortDescription || '',
            description: c.description || '',
            category: c.category?._id || c.category || '',
            level: c.level || 'beginner',
            price: c.price ?? 0,
            discountPrice: c.discountPrice ?? '',
            thumbnail: c.thumbnail || '',
            previewVideo: c.previewVideo || '',
            objectivesText: (c.objectives || []).join('\n'),
            requirementsText: (c.requirements || []).join('\n'),
            audienceText: (c.targetAudience || []).join('\n'),
            isFeatured: Boolean(c.isFeatured),
            isPublished: Boolean(c.isPublished),
          })
          const loadedModules = c.modules || []
          setModules(loadedModules)
          if (loadedModules[0]) {
            setLessonForm((prev) => ({ ...prev, moduleId: loadedModules[0]._id }))
          }
        })
        .catch((err) => toast.error(err.message || 'Could not load course'))
    }
  }, [id, isEditing])

  // Upload handlers for Pictures & Videos
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingThumb(true)
    try {
      const res = await adminService.uploadMedia(file)
      setForm((prev) => ({ ...prev, thumbnail: res.data.url }))
      toast.success('Course thumbnail image uploaded!')
    } catch (err) {
      toast.error(err.message || 'Image upload failed')
    } finally {
      setUploadingThumb(false)
      e.target.value = ''
    }
  }

  const handlePreviewVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPreview(true)
    setPreviewProgress(0)
    try {
      const res = await adminService.uploadMedia(file, (evt) => {
        if (evt.total) {
          setPreviewProgress(Math.round((evt.loaded * 100) / evt.total))
        }
      })
      setForm((prev) => ({ ...prev, previewVideo: res.data.url }))
      toast.success('Course preview video uploaded!')
    } catch (err) {
      toast.error(err.message || 'Video upload failed')
    } finally {
      setUploadingPreview(false)
      e.target.value = ''
    }
  }

  const handleLessonVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLessonVideo(true)
    setLessonVideoProgress(0)
    try {
      const res = await adminService.uploadMedia(file, (evt) => {
        if (evt.total) {
          setLessonVideoProgress(Math.round((evt.loaded * 100) / evt.total))
        }
      })
      setLessonForm((prev) => ({
        ...prev,
        videoUrl: res.data.url,
        videoDuration: res.data.duration ? Math.round(res.data.duration) : prev.videoDuration,
      }))
      toast.success('Lesson video file uploaded!')
    } catch (err) {
      toast.error(err.message || 'Lesson video upload failed')
    } finally {
      setUploadingLessonVideo(false)
      e.target.value = ''
    }
  }

  const handleResourceUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingResource(true)
    try {
      const res = await adminService.uploadMedia(file)
      setLessonForm((prev) => ({
        ...prev,
        resourceUrl: res.data.url,
        resourceTitle: prev.resourceTitle || file.name,
      }))
      toast.success('Resource file uploaded!')
    } catch (err) {
      toast.error(err.message || 'Resource upload failed')
    } finally {
      setUploadingResource(false)
      e.target.value = ''
    }
  }

  const refreshCurriculum = async (cId = courseId) => {
    if (!cId) return
    const res = await adminService.getCourseById(cId)
    const loaded = res.data?.modules || []
    setModules(loaded)
    if (loaded.length > 0 && (!lessonForm.moduleId || lessonForm.moduleId.startsWith('temp-'))) {
      setLessonForm((prev) => ({ ...prev, moduleId: loaded[0]._id }))
    }
  }

  // Add Module (works before posting or after posting)
  const handleAddModule = async (e) => {
    e.preventDefault()
    if (!newModuleTitle.trim()) return

    if (!courseId) {
      const tempId = `temp-mod-${Date.now()}`
      const newMod = {
        _id: tempId,
        isTemp: true,
        title: newModuleTitle.trim(),
        order: modules.length + 1,
        lessons: [],
      }
      const nextModules = [...modules, newMod]
      setModules(nextModules)
      setLessonForm((prev) => ({ ...prev, moduleId: tempId }))
      setNewModuleTitle('')
      toast.success('Module staged for publishing!')
      return
    }

    try {
      const res = await adminService.createModule(courseId, {
        title: newModuleTitle,
        order: modules.length + 1,
      })
      setNewModuleTitle('')
      setLessonForm((prev) => ({ ...prev, moduleId: res.data._id }))
      await refreshCurriculum()
      toast.success('Module added!')
    } catch (err) {
      toast.error(err.message || 'Could not add module')
    }
  }

  const handleDeleteModule = async (modId) => {
    if (String(modId).startsWith('temp-')) {
      const remaining = modules.filter((m) => m._id !== modId)
      setModules(remaining)
      if (lessonForm.moduleId === modId) {
        setLessonForm((prev) => ({ ...prev, moduleId: remaining[0]?._id || '' }))
      }
      toast.success('Staged module removed')
      return
    }

    try {
      await adminService.deleteModule(modId)
      await refreshCurriculum()
      toast.success('Module deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete module')
    }
  }

  // Add Lesson (works before posting or after posting)
  const handleAddLesson = async (e) => {
    e.preventDefault()
    if (!lessonForm.moduleId || !lessonForm.title.trim()) {
      toast.error('Please select a module and enter a lesson title.')
      return
    }

    const resources =
      lessonForm.resourceTitle && lessonForm.resourceUrl
        ? [{ title: lessonForm.resourceTitle, url: lessonForm.resourceUrl, type: 'pdf' }]
        : []

    if (!courseId || String(lessonForm.moduleId).startsWith('temp-')) {
      const newLesson = {
        _id: `temp-les-${Date.now()}`,
        isTemp: true,
        title: lessonForm.title.trim(),
        description: lessonForm.description,
        videoUrl: lessonForm.videoUrl,
        videoDuration: Number(lessonForm.videoDuration) || 600,
        isPreview: lessonForm.isPreview,
        resources,
      }

      setModules((prev) =>
        prev.map((m) =>
          m._id === lessonForm.moduleId
            ? { ...m, lessons: [...(m.lessons || []), newLesson] }
            : m
        )
      )

      setLessonForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        videoUrl: '',
        resourceTitle: '',
        resourceUrl: '',
      }))
      toast.success('Lesson & video staged! It will be published with the course.')
      return
    }

    try {
      await adminService.createLesson(lessonForm.moduleId, {
        courseId,
        title: lessonForm.title,
        description: lessonForm.description,
        videoUrl: lessonForm.videoUrl,
        videoDuration: Number(lessonForm.videoDuration) || 600,
        isPreview: lessonForm.isPreview,
        isPublished: true,
        resources,
      })
      setLessonForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        videoUrl: '',
        resourceTitle: '',
        resourceUrl: '',
      }))
      await refreshCurriculum()
      toast.success('Lesson added to module!')
    } catch (err) {
      toast.error(err.message || 'Could not add lesson')
    }
  }

  const handleDeleteLesson = async (modId, lesId) => {
    if (String(lesId).startsWith('temp-')) {
      setModules((prev) =>
        prev.map((m) =>
          m._id === modId
            ? { ...m, lessons: (m.lessons || []).filter((l) => l._id !== lesId) }
            : m
        )
      )
      toast.success('Staged lesson removed')
      return
    }

    try {
      await adminService.deleteLesson(lesId)
      await refreshCurriculum()
      toast.success('Lesson removed')
    } catch (err) {
      toast.error(err.message || 'Could not delete lesson')
    }
  }

  // Save & Post Course (including all pre-staged pictures, preview video, modules, and lesson videos)
  const handleSaveCourse = async (e) => {
    e.preventDefault()
    if (!form.title || !form.category) {
      toast.error('Course title and category are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        shortDescription: form.shortDescription,
        description: form.description,
        category: form.category,
        level: form.level,
        price: Number(form.price),
        discountPrice: form.discountPrice !== '' ? Number(form.discountPrice) : null,
        thumbnail: form.thumbnail,
        previewVideo: form.previewVideo,
        objectives: form.objectivesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        requirements: form.requirementsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        targetAudience: form.audienceText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        isFeatured: form.isFeatured,
        isPublished: form.isPublished,
      }

      if (courseId) {
        await adminService.updateCourse(courseId, payload)
        toast.success('Course updated successfully!')
      } else {
        // Attach pre-built modules & lessons so they are posted together in one go
        payload.modules = modules.filter((m) => m.title?.trim())
        const res = await adminService.createCourse(payload)
        const createdId = res.data._id
        setCourseId(createdId)
        await refreshCurriculum(createdId)
        toast.success('Course, media, and lessons published successfully!')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save course')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SEO title={isEditing ? 'Edit Course — AIVORA Admin' : 'Create Course — AIVORA Admin'} />

      <div className="space-y-8 max-w-6xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/courses')}
              className="p-2 rounded-xl glass text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">
                {courseId ? 'Edit Course, Media & Curriculum' : 'Create & Post New Course'}
              </h1>
              <p className="text-sm text-slate-400">
                Upload course pictures, preview videos, and full lesson videos before or after publishing.
              </p>
            </div>
          </div>

          <Button
            onClick={handleSaveCourse}
            loading={saving}
            iconLeft={<Save className="w-4 h-4" />}
          >
            {courseId ? 'Save All Course Changes' : 'Publish Course Now'}
          </Button>
        </div>

        {/* STEP 1: Course Media Studio (Upload Pictures AND Videos Before Posting) */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-aivora-indigo/30 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-aivora-cyan">
                Step 1 • Visual & Video Assets
              </span>
              <h2 className="text-lg font-display font-bold text-white mt-0.5">
                Course Thumbnail Picture & Promo Preview Video
              </h2>
            </div>
            <Badge color="indigo">Supports Direct File Upload or URL</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Thumbnail Picture Uploader */}
            <div className="rounded-2xl bg-aivora-navy/80 border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-aivora-indigo" />
                  Course Cover Picture (Thumbnail)
                </span>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={uploadingThumb}
                  onClick={() => thumbnailInputRef.current?.click()}
                  iconLeft={<Upload className="w-3.5 h-3.5" />}
                >
                  Upload Picture
                </Button>
              </div>

              {form.thumbnail ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
                  <img
                    src={form.thumbnail}
                    alt="Course Thumbnail Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, thumbnail: '' })}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 text-xs text-red-400 hover:bg-black"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="aspect-video rounded-xl border-2 border-dashed border-white/15 hover:border-aivora-indigo/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors p-4 text-center"
                >
                  <ImageIcon className="w-8 h-8 text-slate-500" />
                  <p className="text-xs font-medium text-slate-300">
                    Click to upload a picture from your computer (JPG, PNG, WEBP)
                  </p>
                  <p className="text-[11px] text-slate-500">Or paste an image URL below</p>
                </div>
              )}

              <Input
                placeholder="Or paste image URL (https://...)"
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
              />
            </div>

            {/* Preview Video Uploader */}
            <div className="rounded-2xl bg-aivora-navy/80 border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-aivora-cyan" />
                  Course Promo / Preview Video
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
                  {uploadingPreview ? `Uploading ${previewProgress}%` : 'Upload Video'}
                </Button>
              </div>

              {form.previewVideo ? (
                <div className="relative rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                  <video
                    src={form.previewVideo}
                    controls
                    className="w-full h-auto max-h-[420px] object-contain block"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, previewVideo: '' })}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 text-xs text-red-400 hover:bg-black"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => previewVideoInputRef.current?.click()}
                  className="aspect-video rounded-xl border-2 border-dashed border-white/15 hover:border-aivora-cyan/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors p-4 text-center"
                >
                  <Film className="w-8 h-8 text-slate-500" />
                  <p className="text-xs font-medium text-slate-300">
                    Click to upload a preview video from your computer (MP4, MOV, WEBM)
                  </p>
                  <p className="text-[11px] text-slate-500">Or paste a video stream URL below</p>
                </div>
              )}

              <Input
                placeholder="Or paste video URL (https://...)"
                value={form.previewVideo}
                onChange={(e) => setForm({ ...form, previewVideo: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* STEP 2: Course Information & Pricing */}
        <form
          onSubmit={handleSaveCourse}
          className="glass rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6"
        >
          <div className="border-b border-white/10 pb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-aivora-indigo">
              Step 2 • Course Details & Pricing
            </span>
            <h2 className="text-lg font-display font-bold text-white mt-0.5">
              Course Information, Objectives & Naira Pricing
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Course Title"
              placeholder="e.g. Cinematic AI Video Production Masterclass"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl bg-aivora-navy border border-white/10 py-3 px-4 text-sm text-white"
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

          <Input
            label="Short Description (Card Summary)"
            placeholder="Concise 1-2 sentence summary..."
            value={form.shortDescription}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Full Course Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Comprehensive course overview..."
              required
              className="w-full rounded-xl bg-aivora-navy border border-white/10 p-3.5 text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Skill Level</label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="w-full rounded-xl bg-aivora-navy border border-white/10 py-3 px-4 text-sm text-white"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

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
              placeholder="e.g. 25000"
              value={form.discountPrice}
              onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">
                What Students Will Learn (1 per line)
              </label>
              <textarea
                rows={4}
                value={form.objectivesText}
                onChange={(e) => setForm({ ...form, objectivesText: e.target.value })}
                className="w-full rounded-xl bg-aivora-navy border border-white/10 p-3 text-xs text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Requirements (1 per line)
              </label>
              <textarea
                rows={4}
                value={form.requirementsText}
                onChange={(e) => setForm({ ...form, requirementsText: e.target.value })}
                className="w-full rounded-xl bg-aivora-navy border border-white/10 p-3 text-xs text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Intended Audience (1 per line)
              </label>
              <textarea
                rows={4}
                value={form.audienceText}
                onChange={(e) => setForm({ ...form, audienceText: e.target.value })}
                className="w-full rounded-xl bg-aivora-navy border border-white/10 p-3 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="rounded border-white/20 bg-aivora-navy text-aivora-indigo"
              />
              <span>Publish Immediately</span>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="rounded border-white/20 bg-aivora-navy text-aivora-indigo"
              />
              <span>Feature on Homepage</span>
            </label>
          </div>
        </form>

        {/* STEP 3: Curriculum & Lesson Videos Builder (Always visible before AND after posting!) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Modules & Lessons List */}
          <div className="lg:col-span-6 glass rounded-2xl p-6 border border-white/10 space-y-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-aivora-purple">
                Step 3 • Course Modules
              </span>
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2 mt-0.5">
                <Layers className="w-5 h-5 text-aivora-indigo" />
                Curriculum Structure ({modules.length} Modules)
              </h2>
            </div>

            <form onSubmit={handleAddModule} className="flex gap-2">
              <input
                type="text"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="New module title (e.g. Module 2: Voice Cloning)"
                className="flex-1 rounded-xl bg-aivora-navy border border-white/10 px-3.5 py-2 text-sm text-white"
              />
              <Button type="submit" size="sm" iconLeft={<Plus className="w-4 h-4" />}>
                Add Module
              </Button>
            </form>

            <div className="space-y-4">
              {modules.map((mod) => (
                <div
                  key={mod._id}
                  className="rounded-xl border border-white/10 bg-aivora-navy/60 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{mod.title}</h3>
                      {mod.isTemp && (
                        <Badge color="cyan" className="text-[10px]">
                          Ready
                        </Badge>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteModule(mod._id)}
                      className="text-xs text-red-400 hover:underline flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>

                  {mod.lessons?.length > 0 ? (
                    <div className="space-y-2">
                      {mod.lessons.map((les) => (
                        <div
                          key={les._id}
                          className="flex items-center justify-between gap-2 text-xs bg-white/5 px-3 py-2.5 rounded-lg"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Video className="w-3.5 h-3.5 text-aivora-cyan flex-shrink-0" />
                            <span className="text-slate-200 truncate font-medium">{les.title}</span>
                            {les.videoUrl && (
                              <span className="text-[10px] text-emerald-400">(Video Attached)</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteLesson(mod._id, les._id)}
                            className="text-slate-400 hover:text-red-400 flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      No lessons added yet. Use the Lesson Video Uploader on the right →
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Add Lesson & Upload Video Form */}
          <div className="lg:col-span-6 glass rounded-2xl p-6 border border-white/10 space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-aivora-cyan">
                Lesson Video & Resource Uploader
              </span>
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2 mt-0.5">
                <Video className="w-5 h-5 text-aivora-cyan" />
                Add Video Lesson to Module
              </h2>
            </div>

            <form onSubmit={handleAddLesson} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300">Target Module</label>
                <select
                  value={lessonForm.moduleId}
                  onChange={(e) => setLessonForm({ ...lessonForm, moduleId: e.target.value })}
                  className="w-full rounded-xl bg-aivora-navy border border-white/10 py-2.5 px-3 text-sm text-white"
                  required
                >
                  <option value="">Select Module</option>
                  {modules.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Lesson Title"
                placeholder="e.g. Lesson 1: Generating Cinematic AI Scenes"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                required
              />

              {/* Direct Video Upload Box for Lesson */}
              <div className="p-4 rounded-xl bg-aivora-navy border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-aivora-cyan" />
                    Lesson Video File or Stream URL
                  </span>
                  <input
                    ref={lessonVideoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    onChange={handleLessonVideoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={uploadingLessonVideo}
                    onClick={() => lessonVideoInputRef.current?.click()}
                    iconLeft={<Upload className="w-3.5 h-3.5" />}
                  >
                    {uploadingLessonVideo
                      ? `Uploading ${lessonVideoProgress}%`
                      : 'Upload Video File'}
                  </Button>
                </div>

                {lessonForm.videoUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black border border-white/10">
                    <video
                      src={lessonForm.videoUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <Input
                  placeholder="Or paste lesson video URL (https://...)"
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Duration (seconds)"
                  type="number"
                  value={lessonForm.videoDuration}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, videoDuration: e.target.value })
                  }
                />
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lessonForm.isPreview}
                      onChange={(e) =>
                        setLessonForm({ ...lessonForm, isPreview: e.target.checked })
                      }
                      className="rounded border-white/20 bg-aivora-navy text-aivora-indigo"
                    />
                    <span>Allow Free Preview</span>
                  </label>
                </div>
              </div>

              {/* Resource File Uploader */}
              <div className="p-3.5 rounded-xl bg-aivora-navy/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">
                    Downloadable PDF / Resource (Optional)
                  </span>
                  <input
                    ref={lessonResourceInputRef}
                    type="file"
                    accept=".pdf,.zip,image/*"
                    onChange={handleResourceUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => lessonResourceInputRef.current?.click()}
                    className="text-xs font-semibold text-aivora-indigo hover:underline flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingResource ? 'Uploading...' : 'Upload PDF/File'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="Resource title (e.g. Prompt Guide)"
                    value={lessonForm.resourceTitle}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, resourceTitle: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Resource URL"
                    value={lessonForm.resourceUrl}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, resourceUrl: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button type="submit" fullWidth size="sm" iconLeft={<Plus className="w-4 h-4" />}>
                Add Video Lesson to Module
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Publish Bar */}
        <div className="glass rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Ready to publish? All uploaded pictures, preview videos, modules, and video lessons will be saved together.
          </div>
          <Button
            size="lg"
            loading={saving}
            onClick={handleSaveCourse}
            iconLeft={<Save className="w-4 h-4" />}
          >
            {courseId ? 'Save All Course Changes' : 'Publish Course & All Videos'}
          </Button>
        </div>
      </div>
    </>
  )
}
