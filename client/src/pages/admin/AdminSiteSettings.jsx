import { useState, useEffect } from 'react'
import { Save, Plus, Trash2, Building2, Send, RotateCcw } from 'lucide-react'
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
    paymentNotice: '',
    announcementBanner: { text: '', isActive: false, color: '#6366f1' },
    telegramChannelUrl: '',
    telegramPopup: {
      enabled: true,
      channelUrl: '',
      title: 'Join our Telegram Channel! 🚀',
      description:
        'Be the first to get exclusive AI video prompts, course drops, free tutorials, and direct support from fellow creators.',
      buttonText: 'Join Telegram Channel',
      additionalLinks: [],
    },
  })
  const [paymentAccounts, setPaymentAccounts] = useState([])
  const [newPaymentAcc, setNewPaymentAcc] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    instructions: '',
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
        paymentNotice:
          data.paymentNotice ||
          'Payments cannot be received from OPay because transfers from OPay are currently facing gateway problems. However, we accept payments from any other Nigerian bank such as PalmPay, Kuda, Moniepoint, UBA, Access Bank, FirstBank, or any other Nigerian bank (not OPay).',
        announcementBanner: data.announcementBanner || {
          text: '',
          isActive: false,
          color: '#6366f1',
        },
        telegramChannelUrl: data.telegramChannelUrl || data.telegramPopup?.channelUrl || '',
        telegramPopup: {
          enabled: data.telegramPopup?.enabled !== false,
          channelUrl: data.telegramPopup?.channelUrl || data.telegramChannelUrl || '',
          title: data.telegramPopup?.title || 'Join our Telegram Channel! 🚀',
          description:
            data.telegramPopup?.description ||
            'Be the first to get exclusive AI video prompts, course drops, free tutorials, and direct support from fellow creators.',
          buttonText: data.telegramPopup?.buttonText || 'Join Telegram Channel',
          additionalLinks: Array.isArray(data.telegramPopup?.additionalLinks)
            ? data.telegramPopup.additionalLinks
            : [],
        },
      })
      setPaymentAccounts(data.paymentAccounts || [])
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

  const handleAddTelegramLink = () => {
    const currentLinks = settings.telegramPopup?.additionalLinks || []
    setSettings({
      ...settings,
      telegramPopup: {
        ...settings.telegramPopup,
        additionalLinks: [...currentLinks, { label: '', url: '' }],
      },
    })
  }

  const handleUpdateTelegramLink = (index, field, value) => {
    const currentLinks = [...(settings.telegramPopup?.additionalLinks || [])]
    if (currentLinks[index]) {
      currentLinks[index] = { ...currentLinks[index], [field]: value }
      setSettings({
        ...settings,
        telegramPopup: {
          ...settings.telegramPopup,
          additionalLinks: currentLinks,
        },
      })
    }
  }

  const handleRemoveTelegramLink = (index) => {
    const currentLinks = [...(settings.telegramPopup?.additionalLinks || [])]
    currentLinks.splice(index, 1)
    setSettings({
      ...settings,
      telegramPopup: {
        ...settings.telegramPopup,
        additionalLinks: currentLinks,
      },
    })
  }

  const handleReset2HourTimer = () => {
    try {
      localStorage.removeItem('aivora_hide_telegram_popup_until')
      toast.success('2-hour snooze timer cleared! The popup will show on homepage reload.')
    } catch {
      toast.success('Timer cleared!')
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

  const handleAddPaymentAccount = async (e) => {
    e.preventDefault()
    if (
      !newPaymentAcc.bankName.trim() ||
      !newPaymentAcc.accountName.trim() ||
      !newPaymentAcc.accountNumber.trim()
    ) {
      return
    }
    try {
      const res = await adminService.createPaymentAccount(newPaymentAcc)
      setPaymentAccounts(res.data || [])
      setNewPaymentAcc({ bankName: '', accountName: '', accountNumber: '', instructions: '' })
      toast.success('New payment details added!')
    } catch (err) {
      toast.error(err.message || 'Could not add payment details')
    }
  }

  const handleDeletePaymentAccount = async (id) => {
    try {
      const res = await adminService.deletePaymentAccount(id)
      setPaymentAccounts(res.data || [])
      toast.success('Payment details removed!')
    } catch (err) {
      toast.error(err.message || 'Could not remove payment details')
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

        {/* Telegram Community & Homepage Pop-up Card Management */}
        <div className="glass rounded-2xl p-6 border border-white/10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-white">
                  Telegram Channel & Homepage Pop-up Card
                </h2>
                <p className="text-xs text-slate-400">
                  Configure the card that pops up on the homepage encouraging visitors to join your Telegram. You can change your channel link or add another link anytime.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset2HourTimer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-xs font-semibold text-pink-300 self-start sm:self-auto transition-colors"
              title="Clears any active 2-hour snooze so the popup will immediately appear when you reload the homepage"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset 2hr Snooze (For Testing)</span>
            </button>
          </div>

          <form onSubmit={handleSaveGeneral} className="space-y-4">
            {/* Pop-up Toggle */}
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.telegramPopup?.enabled !== false}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    telegramPopup: {
                      ...settings.telegramPopup,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="rounded border-white/20 bg-aivora-navy text-aivora-indigo"
              />
              <span>Enable Homepage Pop-up Encouraging Users to Join Telegram</span>
            </label>

            {/* Primary Channel Link */}
            <div className="space-y-1.5">
              <Input
                label="Primary Telegram Channel Link"
                placeholder="e.g. https://t.me/your_telegram_channel or https://t.me/aivora_official"
                value={settings.telegramChannelUrl || settings.telegramPopup?.channelUrl || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setSettings({
                    ...settings,
                    telegramChannelUrl: val,
                    telegramPopup: {
                      ...settings.telegramPopup,
                      channelUrl: val,
                    },
                  })
                }}
              />
              <p className="text-[11px] text-slate-400">
                This is the main link that opens when users click the &ldquo;Join Telegram Channel&rdquo; button.
              </p>
            </div>

            {/* Additional Community Links */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Additional Telegram / Community Links</h3>
                  <p className="text-[11px] text-slate-400">
                    Add another link you feel like adding (e.g. Discussion Group, VIP Channel, Backup Group, WhatsApp).
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleAddTelegramLink}
                  iconLeft={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Another Link
                </Button>
              </div>

              {(!settings.telegramPopup?.additionalLinks || settings.telegramPopup.additionalLinks.length === 0) ? (
                <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-white/5 border border-dashed border-white/10">
                  No additional links added yet. Click &ldquo;Add Another Link&rdquo; if you want to include extra links (like a discussion group or secondary channel).
                </p>
              ) : (
                <div className="space-y-2.5">
                  {settings.telegramPopup.additionalLinks.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="w-full sm:w-1/3">
                        <Input
                          placeholder="Link Label (e.g. Discussion Group)"
                          value={item.label || ''}
                          onChange={(e) => handleUpdateTelegramLink(idx, 'label', e.target.value)}
                        />
                      </div>
                      <div className="w-full sm:flex-1">
                        <Input
                          placeholder="Link URL (e.g. https://t.me/+groupInviteCode)"
                          value={item.url || ''}
                          onChange={(e) => handleUpdateTelegramLink(idx, 'url', e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTelegramLink(idx)}
                        className="p-2.5 rounded-xl hover:bg-red-500/20 text-slate-400 hover:text-red-300 self-end sm:self-auto transition-colors"
                        title="Remove Link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Pop-up Texts */}
            <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Pop-up Title"
                placeholder="e.g. Join our Telegram Channel! 🚀"
                value={settings.telegramPopup?.title || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    telegramPopup: {
                      ...settings.telegramPopup,
                      title: e.target.value,
                    },
                  })
                }
              />
              <Input
                label="Primary Button Text"
                placeholder="e.g. Join Telegram Channel"
                value={settings.telegramPopup?.buttonText || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    telegramPopup: {
                      ...settings.telegramPopup,
                      buttonText: e.target.value,
                    },
                  })
                }
              />
              <div className="sm:col-span-2">
                <Input
                  label="Pop-up Description"
                  placeholder="e.g. Be the first to get exclusive AI video prompts, course drops, and creator support."
                  value={settings.telegramPopup?.description || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      telegramPopup: {
                        ...settings.telegramPopup,
                        description: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>

            <Button
              type="submit"
              loading={saving}
              iconLeft={<Save className="w-4 h-4" />}
            >
              Save Telegram Settings
            </Button>
          </form>
        </div>

        {/* Manual Bank Payment Details Management */}
        <div className="glass rounded-2xl p-6 border border-white/10 space-y-5">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-aivora-cyan" />
            <div>
              <h2 className="text-lg font-display font-bold text-white">
                Manual Payment Bank Accounts (Add / Remove Payment Details)
              </h2>
              <p className="text-xs text-slate-400">
                Manage the bank accounts displayed on the student checkout page. You can remove any bank account or add new ones anytime.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {paymentAccounts.map((acc) => (
              <div
                key={acc._id || acc.accountNumber}
                className="flex items-center justify-between gap-4 p-4 rounded-xl bg-aivora-navy/80 border border-white/10 text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold uppercase text-aivora-cyan">{acc.bankName}</span>
                  <p className="text-base font-mono font-bold text-white">{acc.accountNumber}</p>
                  <p className="text-slate-300">Account Name: {acc.accountName}</p>
                  {acc.instructions && <p className="text-slate-400">{acc.instructions}</p>}
                </div>
                {acc._id && (
                  <button
                    type="button"
                    onClick={() => handleDeletePaymentAccount(acc._id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-semibold text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleAddPaymentAccount} className="space-y-3 pt-3 border-t border-white/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Add Another Payment Account
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Bank Name"
                placeholder="e.g. Moniepoint, Kuda, PalmPay, UBA, Access, FirstBank"
                value={newPaymentAcc.bankName}
                onChange={(e) => setNewPaymentAcc({ ...newPaymentAcc, bankName: e.target.value })}
                required
              />
              <Input
                label="Account Number"
                placeholder="e.g. 8012345678"
                value={newPaymentAcc.accountNumber}
                onChange={(e) =>
                  setNewPaymentAcc({ ...newPaymentAcc, accountNumber: e.target.value })
                }
                required
              />
              <Input
                label="Account Name"
                placeholder="e.g. AIVORA Creative Hub"
                value={newPaymentAcc.accountName}
                onChange={(e) =>
                  setNewPaymentAcc({ ...newPaymentAcc, accountName: e.target.value })
                }
                required
              />
            </div>
            <Input
              label="Transfer Instructions (Optional)"
              placeholder="e.g. Use your registered email as transfer narration"
              value={newPaymentAcc.instructions}
              onChange={(e) =>
                setNewPaymentAcc({ ...newPaymentAcc, instructions: e.target.value })
              }
            />
            <Button type="submit" size="sm" iconLeft={<Plus className="w-4 h-4" />}>
              Add Payment Details
            </Button>
          </form>
        </div>

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
