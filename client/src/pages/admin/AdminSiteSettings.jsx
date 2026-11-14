import { useState, useEffect } from 'react'
import { Save, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import adminService from '../../services/adminService'

export default function AdminSiteSettings() {
  const [settings, setSettings] = useState({
    heroHeadline: '',
    heroSubHeadline: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    footerText: '',
    announcementBanner: { text: '', isActive: false, color: '#6366f1' },
  })
  const [faqs, setFaqs] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' })
  const [newTesti, setNewTesti] = useState({ name: '', role: '', rating: 5, comment: '' })
  const [saving, setSaving] = useState(false)

  const loadSettings = async () => {
    try {
      const res = await adminService.getSiteSettings()
      const data = res?.data || {}
      setSettings({
        heroHeadline: data.heroHeadline || '',
        heroSubHeadline: data.heroSubHeadline || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        contactAddress: data.contactAddress || '',
        footerText: data.footerText || '',
        announcementBanner: data.announcementBanner || {
          text: '',
          isActive: false,
          color: '#6366f1',
        },
      })
      setFaqs(data.faqs || [])
      setTestimonials(data.testimonials || [])
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSaveGeneral = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminService.updateSiteSettings(settings)
      toast.success('Website settings updated!')
    } catch (err) {
      toast.error(err.message || 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const handleAddFaq = async (e) => {
    e.preventDefault()
    if (!newFaq.question || !newFaq.answer) return
    try {
      const res = await adminService.createFaq(newFaq)
      setFaqs(res.data || [])
      setNewFaq({ question: '', answer: '' })
      toast.success('FAQ added!')
    } catch (err) {
      toast.error(err.message || 'Could not add FAQ')
    }
  }

  const handleDeleteFaq = async (id) => {
    try {
      const res = await adminService.deleteFaq(id)
      setFaqs(res.data || [])
      toast.success('FAQ deleted')
    } catch (err) {
      toast.error(err.message || 'Could not delete FAQ')
    }
  }

  const handleAddTestimonial = async (e) => {
    e.preventDefault()
    if (!newTesti.name || !newTesti.comment) return
    try {
      const res = await adminService.createTestimonial(newTesti)
      setTestimonials(res.data || [])
      setNewTesti({ name: '', role: '', rating: 5, comment: '' })
      toast.success('Verified testimonial added!')
    } catch (err) {
      toast.error(err.message || 'Could not add testimonial')
    }
  }

  const handleDeleteTestimonial = async (id) => {
    try {
      const res = await adminService.deleteTestimonial(id)
      setTestimonials(res.data || [])
      toast.success('Testimonial removed')
    } catch (err) {
      toast.error(err.message || 'Could not remove testimonial')
    }
  }

  return (
    <>
      <SEO title="Website & CMS Settings — AIVORA Admin" />

      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">
            Website & Content Management
          </h1>
          <p className="text-sm text-slate-400">
            Update homepage headlines, promotional banners, FAQs, verified testimonials, and contact info without editing code.
          </p>
        </div>

        {/* General & Hero Form */}
        <form
          onSubmit={handleSaveGeneral}
          className="glass rounded-2xl p-6 border border-white/10 space-y-5"
        >
          <h2 className="text-lg font-display font-bold text-white">
            Homepage Hero & Contact Information
          </h2>

          <Input
            label="Hero Headline"
            value={settings.heroHeadline}
            onChange={(e) => setSettings({ ...settings, heroHeadline: e.target.value })}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Hero Supporting Headline</label>
            <textarea
              rows={3}
              value={settings.heroSubHeadline}
              onChange={(e) => setSettings({ ...settings, heroSubHeadline: e.target.value })}
              className="w-full rounded-xl bg-aivora-navy border border-white/10 p-3.5 text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Contact Email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
            />
            <Input
              label="Contact Phone"
              value={settings.contactPhone}
              onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
            />
            <Input
              label="Address"
              value={settings.contactAddress}
              onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
            />
          </div>

          <div className="pt-2 border-t border-white/10 space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.announcementBanner?.isActive || false}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcementBanner: {
                      ...settings.announcementBanner,
                      isActive: e.target.checked,
                    },
                  })
                }
                className="rounded border-white/20 bg-aivora-navy text-aivora-indigo"
              />
              <span>Enable Top Promotional Announcement Banner</span>
            </label>

            <Input
              label="Announcement Banner Text"
              placeholder="e.g. Use code WELCOME10 for 10% off your first AI course!"
              value={settings.announcementBanner?.text || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  announcementBanner: {
                    ...settings.announcementBanner,
                    text: e.target.value,
                  },
                })
              }
            />
          </div>

          <Button type="submit" loading={saving} iconLeft={<Save className="w-4 h-4" />}>
            Save Website Settings
          </Button>
        </form>

        {/* FAQ Management */}
        <div className="glass rounded-2xl p-6 border border-white/10 space-y-5">
          <h2 className="text-lg font-display font-bold text-white">Manage Homepage FAQs</h2>

          <form onSubmit={handleAddFaq} className="space-y-3">
            <Input
              label="Question"
              value={newFaq.question}
              onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
              required
            />
            <Input
              label="Answer"
              value={newFaq.answer}
              onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
              required
            />
            <Button type="submit" size="sm" iconLeft={<Plus className="w-4 h-4" />}>
              Add FAQ
            </Button>
          </form>

          <div className="space-y-2 pt-3 border-t border-white/10">
            {faqs.map((f) => (
              <div
                key={f._id || f.question}
                className="flex items-start justify-between gap-4 p-3 rounded-xl bg-white/5 text-xs"
              >
                <div>
                  <p className="font-semibold text-white">{f.question}</p>
                  <p className="text-slate-400 mt-0.5">{f.answer}</p>
                </div>
                {f._id && (
                  <button
                    onClick={() => handleDeleteFaq(f._id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Management */}
        <div className="glass rounded-2xl p-6 border border-white/10 space-y-5">
          <h2 className="text-lg font-display font-bold text-white">
            Manage Verified Student Testimonials
          </h2>

          <form onSubmit={handleAddTestimonial} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Student Name"
                value={newTesti.name}
                onChange={(e) => setNewTesti({ ...newTesti, name: e.target.value })}
                required
              />
              <Input
                label="Role / Title"
                placeholder="e.g. Filmmaker & YouTuber"
                value={newTesti.role}
                onChange={(e) => setNewTesti({ ...newTesti, role: e.target.value })}
              />
            </div>
            <Input
              label="Review Comment"
              value={newTesti.comment}
              onChange={(e) => setNewTesti({ ...newTesti, comment: e.target.value })}
              required
            />
            <Button type="submit" size="sm" iconLeft={<Plus className="w-4 h-4" />}>
              Publish Testimonial
            </Button>
          </form>

          <div className="space-y-2 pt-3 border-t border-white/10">
            {testimonials.map((t) => (
              <div
                key={t._id || t.name}
                className="flex items-start justify-between gap-4 p-3 rounded-xl bg-white/5 text-xs"
              >
                <div>
                  <p className="font-semibold text-white">
                    {t.name} <span className="text-slate-400">({t.role})</span>
                  </p>
                  <p className="text-slate-300 mt-0.5">&ldquo;{t.comment}&rdquo;</p>
                </div>
                {t._id && (
                  <button
                    onClick={() => handleDeleteTestimonial(t._id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
