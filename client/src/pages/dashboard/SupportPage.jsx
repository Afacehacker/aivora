import { useState, useEffect } from 'react'
import { Headphones, Plus, Send, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import supportService from '../../services/supportService'

const statusBadge = {
  open: 'info',
  inProgress: 'warning',
  resolved: 'success',
  closed: 'default',
}

export default function SupportPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    subject: '',
    category: 'access',
    message: '',
  })

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await supportService.getMyTickets()
      setTickets(res?.data || [])
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) return
    setSubmitting(true)
    try {
      await supportService.createTicket(form)
      toast.success('Support ticket created!')
      setForm({ subject: '', category: 'access', message: '' })
      setCreateOpen(false)
      fetchTickets()
    } catch (err) {
      toast.error(err.message || 'Could not create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenThread = async (id) => {
    try {
      const res = await supportService.getTicketById(id)
      setSelectedTicket(res.data)
    } catch (err) {
      toast.error(err.message || 'Could not load ticket messages')
    }
  }

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedTicket) return
    setSubmitting(true)
    try {
      await supportService.replyToTicket(selectedTicket._id, { message: replyText })
      setReplyText('')
      const updated = await supportService.getTicketById(selectedTicket._id)
      setSelectedTicket(updated.data)
      toast.success('Reply sent!')
    } catch (err) {
      toast.error(err.message || 'Failed to send reply')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <SEO title="Support & Help — AIVORA" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Support & Help Center</h1>
            <p className="text-sm text-slate-400">
              Need assistance with a payment or course? Open a ticket and our team will assist you.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            iconLeft={<Plus className="w-4 h-4" />}
          >
            New Ticket
          </Button>
        </div>

        {loading ? (
          <div className="h-48 rounded-2xl glass animate-pulse" />
        ) : tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t._id}
                onClick={() => handleOpenThread(t._id)}
                className="glass rounded-2xl p-5 border border-white/10 hover:border-aivora-indigo/40 cursor-pointer flex items-center justify-between gap-4 transition-all"
              >
                <div>
                  <h3 className="text-base font-semibold text-white">{t.subject}</h3>
                  <p className="text-xs text-slate-400 mt-1 capitalize">
                    Category: {t.category} • Created {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge color={statusBadge[t.status] || 'default'} className="capitalize">
                  {t.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-12 text-center border border-white/10">
            <Headphones className="w-10 h-10 text-aivora-indigo mx-auto mb-3" />
            <h3 className="text-lg font-display font-bold text-white">No Support Tickets</h3>
            <p className="text-sm text-slate-400 mt-1 mb-5">
              You haven&apos;t opened any support requests yet.
            </p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              Create Support Ticket
            </Button>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Open a Support Ticket"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Subject"
            placeholder="Brief summary of your issue"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl bg-aivora-navy border border-white/10 py-3 px-4 text-sm text-white"
            >
              <option value="access">Course Access</option>
              <option value="payment">Payment Verification</option>
              <option value="technical">Video / Technical Issue</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Message</label>
            <textarea
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Provide details or payment reference if applicable..."
              required
              className="w-full rounded-xl bg-aivora-navy border border-white/10 p-3.5 text-sm text-white"
            />
          </div>
          <Button type="submit" fullWidth loading={submitting}>
            Submit Ticket
          </Button>
        </form>
      </Modal>

      {/* Ticket Conversation Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket?.subject || 'Ticket Conversation'}
        maxWidth="max-w-2xl"
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {selectedTicket.messages?.map((m, idx) => {
                const isAdmin = m.sender?.role === 'admin'
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl text-sm ${
                      isAdmin
                        ? 'bg-aivora-indigo/20 border border-aivora-indigo/30 text-white'
                        : 'bg-white/5 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-semibold text-white">
                        {m.sender?.name || (isAdmin ? 'AIVORA Support' : 'You')}
                      </span>
                      <span>{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <p>{m.message}</p>
                  </div>
                )
              })}
            </div>

            {selectedTicket.status !== 'closed' && (
              <form onSubmit={handleReply} className="flex gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 rounded-xl bg-aivora-navy border border-white/10 px-4 py-2.5 text-sm text-white"
                />
                <Button
                  type="submit"
                  size="sm"
                  loading={submitting}
                  iconLeft={<Send className="w-4 h-4" />}
                >
                  Reply
                </Button>
              </form>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
