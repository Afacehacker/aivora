import { useState, useEffect } from 'react'
import { Send } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import adminService from '../../services/adminService'

export default function AdminSupport() {
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await adminService.getAllTickets()
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

  const openTicket = async (id) => {
    try {
      const res = await adminService.getTicketById(id)
      setSelected(res.data)
    } catch (err) {
      toast.error(err.message || 'Could not load ticket')
    }
  }

  const handleReply = async (e) => {
    e.preventDefault()
    if (!reply.trim() || !selected) return
    try {
      await adminService.replyToTicket(selected._id, { message: reply })
      setReply('')
      const updated = await adminService.getTicketById(selected._id)
      setSelected(updated.data)
      fetchTickets()
      toast.success('Reply sent to student!')
    } catch (err) {
      toast.error(err.message || 'Failed to send reply')
    }
  }

  const handleStatusChange = async (status) => {
    if (!selected) return
    try {
      await adminService.updateTicketStatus(selected._id, { status })
      setSelected({ ...selected, status })
      fetchTickets()
      toast.success('Ticket status updated')
    } catch (err) {
      toast.error(err.message || 'Could not update status')
    }
  }

  return (
    <>
      <SEO title="Support Management — AIVORA Admin" />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Support Ticket Management</h1>
          <p className="text-sm text-slate-400">
            Respond to student inquiries and update support ticket statuses.
          </p>
        </div>

        {loading ? (
          <div className="h-48 rounded-2xl glass animate-pulse" />
        ) : tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t._id}
                onClick={() => openTicket(t._id)}
                className="glass rounded-2xl p-5 border border-white/10 hover:border-aivora-indigo/40 cursor-pointer flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-base font-semibold text-white">{t.subject}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    From: {t.student?.name} ({t.student?.email}) • Category: {t.category}
                  </p>
                </div>
                <Badge color={t.status === 'resolved' ? 'success' : 'info'} className="capitalize">
                  {t.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-10 text-center border border-white/10 text-slate-400 text-sm">
            No support tickets open right now.
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.subject || 'Ticket'}
        maxWidth="max-w-2xl"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs text-slate-400">
                Student: <strong className="text-white">{selected.student?.name}</strong>
              </span>
              <select
                value={selected.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded-lg bg-aivora-navy border border-white/10 px-3 py-1 text-xs text-white"
              >
                <option value="open">Open</option>
                <option value="inProgress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3">
              {selected.messages?.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl text-sm ${
                    m.sender?.role === 'admin'
                      ? 'bg-aivora-indigo/20 border border-aivora-indigo/30 text-white'
                      : 'bg-white/5 text-slate-200'
                  }`}
                >
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{m.sender?.name || 'User'}</span>
                    <span>{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <p>{m.message}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleReply} className="flex gap-2 pt-2 border-t border-white/10">
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type an official support response..."
                className="flex-1 rounded-xl bg-aivora-navy border border-white/10 px-4 py-2 text-sm text-white"
              />
              <Button type="submit" size="sm" iconLeft={<Send className="w-4 h-4" />}>
                Send
              </Button>
            </form>
          </div>
        )}
      </Modal>
    </>
  )
}
