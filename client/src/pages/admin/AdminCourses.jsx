import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye, Globe, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import CourseMediaPreview from '../../components/common/CourseMediaPreview'
import { formatPrice, formatMinutesLong } from '../../components/home/CourseCard'
import adminService from '../../services/adminService'

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const res = await adminService.getAllCourses({ limit: 50 })
      setCourses(res?.data || [])
    } catch (err) {
      toast.error(err.message || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const handleTogglePublish = async (id) => {
    try {
      const res = await adminService.toggleCoursePublish(id)
      toast.success(res.message || 'Status updated')
      fetchCourses()
    } catch (err) {
      toast.error(err.message || 'Failed to update status')
    }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return
    try {
      await adminService.deleteCourse(id)
      toast.success('Course deleted')
      fetchCourses()
    } catch (err) {
      toast.error(err.message || 'Could not delete course')
    }
  }

  return (
    <>
      <SEO title="Manage Courses — AIVORA Admin" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Course Management</h1>
            <p className="text-sm text-slate-400">
              Create, edit, publish, and manage video tutorials for all courses.
            </p>
          </div>
          <Link to="/admin/courses/create">
            <Button size="sm" iconLeft={<Plus className="w-4 h-4" />}>
              New Course
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="h-64 rounded-2xl glass animate-pulse" />
        ) : (
          <div className="glass rounded-2xl border border-white/10 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Level</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Tutorial Videos</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {courses.map((c) => (
                  <tr key={c._id} className="hover:bg-white/5">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <CourseMediaPreview
                          course={c}
                          className="w-14 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-xs">{c.title}</p>
                          {c.isFeatured && (
                            <span className="text-[10px] text-aivora-cyan font-semibold">
                              ★ Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">{c.category?.name || '—'}</td>
                    <td className="py-3.5 px-4 capitalize text-xs">{c.level}</td>
                    <td className="py-3.5 px-4 font-semibold">
                      {formatPrice(c.discountPrice || c.price)}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-semibold text-white">{c.totalLessons || 0} Videos</span>
                      <span className="block text-[11px] text-slate-400">{formatMinutesLong(c.totalDuration)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge color={c.isPublished ? 'success' : 'warning'}>
                        {c.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/courses/${c.slug}`}
                          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                          title="View Public Page"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleTogglePublish(c._id)}
                          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-aivora-cyan"
                          title={c.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {c.isPublished ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Globe className="w-4 h-4" />
                          )}
                        </button>
                        <Link
                          to={`/admin/courses/${c._id}/edit`}
                          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-aivora-indigo"
                          title="Edit Course & Video Tutorials"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(c._id, c.title)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
