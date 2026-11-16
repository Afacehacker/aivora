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
            <h1 className="text-2xl font-display font-bold text-slate-900">Course Management</h1>
            <p className="text-sm text-slate-600">
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
          <div className="h-64 rounded-2xl bg-white border border-pink-100 animate-pulse shadow-sm" />
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-pink-100 space-y-3 shadow-sm">
            <p className="text-slate-700 font-medium">No courses in the catalog yet.</p>
            <Link to="/admin/courses/create">
              <Button size="sm" iconLeft={<Plus className="w-4 h-4" />}>
                Create Your First Course
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile Cards (Phones / small tablets) */}
            <div className="block md:hidden space-y-4">
              {courses.map((c) => (
                <div
                  key={c._id}
                  className="bg-white rounded-2xl p-4 border border-pink-100 space-y-3.5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <CourseMediaPreview
                      course={c}
                      className="w-20 h-14 rounded-xl object-cover flex-shrink-0 bg-black"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <Badge color={c.isPublished ? 'success' : 'warning'}>
                          {c.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                        {c.isFeatured && (
                          <span className="text-[10px] text-pink-600 font-semibold">
                            ★ Featured
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 text-sm truncate">{c.title}</h3>
                      <p className="text-xs text-slate-500 truncate">{c.category?.name || 'General'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-pink-100">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Price</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatPrice(c.discountPrice || c.price)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-pink-600">
                        {c.totalLessons || 0} Video Tutorials
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {formatMinutesLong(c.totalDuration)}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-pink-100">
                    <Link
                      to={`/admin/courses/${c._id}/edit`}
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 text-[11px] font-semibold"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(c._id)}
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-[11px] font-semibold"
                    >
                      {c.isPublished ? <EyeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                      <span>{c.isPublished ? 'Unpublish' : 'Publish'}</span>
                    </button>
                    <Link
                      to={`/courses/${c.slug}`}
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-[11px] font-semibold"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(c._id, c.title)}
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-semibold"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-pink-100 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-pink-50/70 border-b border-pink-100 text-xs uppercase text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Course</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Tutorial Videos</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100 text-slate-700">
                  {courses.map((c) => (
                    <tr key={c._id} className="hover:bg-pink-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <CourseMediaPreview
                            course={c}
                            className="w-14 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate max-w-xs">{c.title}</p>
                            {c.isFeatured && (
                              <span className="text-[10px] text-pink-600 font-semibold">
                                ★ Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium">{c.category?.name || '—'}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatPrice(c.discountPrice || c.price)}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-semibold text-slate-900">{c.totalLessons || 0} Videos</span>
                        <span className="block text-[11px] text-slate-500">{formatMinutesLong(c.totalDuration)}</span>
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
                            className="p-2 rounded-lg hover:bg-pink-50 text-slate-500 hover:text-slate-900"
                            title="View Public Page"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleTogglePublish(c._id)}
                            className="p-2 rounded-lg hover:bg-pink-50 text-slate-500 hover:text-pink-600"
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
                            className="p-2 rounded-lg hover:bg-pink-50 text-slate-500 hover:text-pink-600"
                            title="Edit Course & Video Tutorials"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(c._id, c.title)}
                            className="p-2 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600"
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
          </>
        )}
      </div>
    </>
  )
}
