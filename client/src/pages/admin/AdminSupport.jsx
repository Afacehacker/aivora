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
          <h1 className="text-2xl font-display font-bold text-slate-900">Support Ticket Management</h1>
          <p className="text-sm text-slate-600">
            Respond to student inquiries and update support ticket statuses.
          </p>
        </div>

        {loading ? (
          <div className="h-48 rounded-2xl bg-white border border-pink-100 shadow-sm animate-pulse" />
        ) : tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t._id}
                onClick={() => openTicket(t._id)}
                className="bg-white rounded-2xl p-5 border border-pink-200/80 shadow-sm hover:border-pink-400 hover:shadow-md cursor-pointer flex items-center justify-between gap-4 transition-all"
              >
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{t.subject}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    From: <span className="font-medium text-slate-700">{t.student?.name}</span> ({t.student?.email}) • Category: <span className="font-medium text-slate-700">{t.category}</span>
                  </p>
                </div>
                <Badge color={t.status === 'resolved' ? 'success' : 'info'} className="capitalize">
                  {t.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center border border-pink-200/80 shadow-sm text-slate-500 text-sm">
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
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs text-slate-600">
                Student: <strong className="text-slate-900">{selected.student?.name}</strong>
              </span>
              <select
                value={selected.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm"
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
                      ? 'bg-pink-50 border border-pink-200 text-slate-900'
                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700">{m.sender?.name || 'User'}</span>
                    <span>{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="leading-relaxed">{m.message}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleReply} className="flex gap-2 pt-2 border-t border-slate-200">
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type an official support response..."
                className="flex-1 rounded-xl bg-white border border-slate-300 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm"
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
