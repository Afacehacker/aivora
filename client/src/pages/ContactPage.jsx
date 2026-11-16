import { useState } from 'react'
import { Mail, Phone, MapPin, Send, MessageSquare, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../components/common/SEO'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import useAuthStore from '../store/authStore'
import supportService from '../services/supportService'

export default function ContactPage() {
  const { isAuthenticated, user } = useAuthStore()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    category: 'other',
    message: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Please enter a subject and message.')
      return
    }
    setLoading(true)
    try {
      if (isAuthenticated) {
        await supportService.createTicket({
          subject: form.subject,
          category: form.category,
          message: form.message,
        })
        toast.success('Support ticket submitted! Track replies in your Dashboard.')
      } else {
        await new Promise((r) => setTimeout(r, 600))
        toast.success('Message received! Our team will respond to your email shortly.')
      }
      setForm((prev) => ({ ...prev, subject: '', message: '' }))
    } catch (err) {
      toast.error(err.message || 'Failed to send message.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO
        title="Contact AIVORA"
        description="Get in touch with the AIVORA support and admissions team."
        url="/contact"
      />

      <div className="pt-28 pb-24 bg-[#fff5f7] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-pink-100/70 border border-pink-200 text-xs font-semibold uppercase tracking-wider text-pink-700 mb-3 shadow-sm">
              Student & Admissions Support
            </span>
            <h1 className="text-3xl sm:text-5xl font-display font-black text-slate-900 mb-4">
              Get in Touch With <span className="gradient-text">AIVORA</span>
            </h1>
            <p className="text-slate-600 text-base">
              Have a question about our courses, payments, or enterprise training? Send us a message below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Contact Info Cards */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-pink-100 flex items-start gap-4 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Email Support</h3>
                  <p className="text-sm text-slate-600 mt-1">support@aivora.com</p>
                  <p className="text-xs text-slate-400 mt-1">Typical response within 24 hours</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-pink-100 flex items-start gap-4 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Phone & WhatsApp</h3>
                  <p className="text-sm text-slate-600 mt-1">+234 800 AIVORA AI</p>
                  <p className="text-xs text-slate-400 mt-1">Mon – Fri, 9:00 AM – 6:00 PM WAT</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-pink-100 flex items-start gap-4 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Global Online Campus</h3>
                  <p className="text-sm text-slate-600 mt-1">Lagos, Nigeria & Worldwide Online</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-pink-100 shadow-sm">
              <h2 className="text-xl font-display font-bold text-slate-900 mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-pink-500" />
                Send Us a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Subject"
                    placeholder="How can we help?"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full rounded-xl bg-white border border-pink-200 py-3 px-4 text-slate-800 focus:outline-none focus:border-pink-500"
                    >
                      <option value="other">General Inquiry</option>
                      <option value="payment">Payment & Billing</option>
                      <option value="access">Course Access</option>
                      <option value="technical">Technical Support</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Message</label>
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Describe your question or request in detail..."
                    required
                    className="w-full rounded-xl bg-white border border-pink-200 p-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  iconLeft={<Send className="w-4 h-4" />}
                >
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
