import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import adminService from '../../services/adminService'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' })

  const fetchCategories = async () => {
    try {
      const res = await adminService.getAllCategories()
      setCategories(res?.data || [])
    } catch {
      setCategories([])
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name) return
    try {
      await adminService.createCategory(form)
      toast.success('Category created!')
      setForm({ name: '', description: '', color: '#6366f1' })
      fetchCategories()
    } catch (err) {
      toast.error(err.message || 'Could not create category')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return
    try {
      await adminService.deleteCategory(id)
      toast.success('Category deleted')
      fetchCategories()
    } catch (err) {
      toast.error(err.message || 'Could not delete category')
    }
  }

  return (
    <>
      <SEO title="Course Categories — AIVORA Admin" />

      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-display font-black text-slate-900">AI Learning Categories</h1>
          <p className="text-sm text-slate-600 font-medium">
            Organize courses into structured AI creative specialization tracks.
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl p-6 border border-pink-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
        >
          <Input
            label="Category Name"
            placeholder="e.g. AI Video Creation"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="sm:col-span-2">
            <Input
              label="Description"
              placeholder="Short description of this specialization..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <Button type="submit" iconLeft={<Plus className="w-4 h-4" />}>
            Add Category
          </Button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="bg-white rounded-2xl p-5 border border-pink-200 shadow-sm flex items-start justify-between gap-4"
            >
              <div>
                <h3 className="text-base font-display font-black text-slate-900">{cat.name}</h3>
                <p className="text-xs text-pink-600 font-mono font-bold mt-0.5">/{cat.slug}</p>
                {cat.description && (
                  <p className="text-xs text-slate-600 font-medium mt-2">{cat.description}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(cat._id)}
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
