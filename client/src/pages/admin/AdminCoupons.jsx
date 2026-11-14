import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import adminService from '../../services/adminService'

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState({
    code: '',
    type: 'percentage',
    value: 10,
    maxUses: 100,
    minOrderAmount: 0,
  })

  const fetchCoupons = async () => {
    try {
      const res = await adminService.getAllCoupons()
      setCoupons(res?.data || [])
    } catch {
      setCoupons([])
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.code) return
    try {
      await adminService.createCoupon({
        ...form,
        value: Number(form.value),
        maxUses: Number(form.maxUses),
        minOrderAmount: Number(form.minOrderAmount),
      })
      toast.success('Coupon created!')
      setForm({ code: '', type: 'percentage', value: 10, maxUses: 100, minOrderAmount: 0 })
      fetchCoupons()
    } catch (err) {
      toast.error(err.message || 'Could not create coupon')
    }
  }

  const handleDelete = async (id) => {
    try {
      await adminService.deleteCoupon(id)
      toast.success('Coupon deleted')
      fetchCoupons()
    } catch (err) {
      toast.error(err.message || 'Could not delete coupon')
    }
  }

  return (
    <>
      <SEO title="Discount Coupons — AIVORA Admin" />

      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Discount Codes & Coupons</h1>
          <p className="text-sm text-slate-400">
            Create and manage promotional discount codes for courses.
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="glass rounded-2xl p-6 border border-white/10 grid grid-cols-1 sm:grid-cols-5 gap-4 items-end"
        >
          <Input
            label="Coupon Code"
            placeholder="WELCOME10"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-xl bg-aivora-navy border border-white/10 py-3 px-3 text-sm text-white"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (₦)</option>
            </select>
          </div>
          <Input
            label="Value"
            type="number"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            required
          />
          <Input
            label="Max Uses"
            type="number"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
          />
          <Button type="submit" iconLeft={<Plus className="w-4 h-4" />}>
            Create
          </Button>
        </form>

        <div className="glass rounded-2xl border border-white/10 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Discount</th>
                <th className="py-3.5 px-4">Usage</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td className="py-3.5 px-4 font-mono font-bold text-aivora-cyan">{c.code}</td>
                  <td className="py-3.5 px-4">
                    {c.type === 'percentage' ? `${c.value}%` : `₦${c.value}`}
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    {c.usedCount || 0} / {c.maxUses || '∞'}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge color={c.isActive ? 'success' : 'default'}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
