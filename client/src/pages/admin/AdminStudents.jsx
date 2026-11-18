import { useState, useEffect } from 'react'
import { Search, UserCheck, UserX, KeyRound, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import adminService from '../../services/adminService'
import api from '../../services/api'

export default function AdminStudents() {
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentDetails, setStudentDetails] = useState(null)
  const [grantCourseId, setGrantCourseId] = useState('')

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await adminService.getAllStudents({ search })
      setStudents(res?.data || [])
    } catch {
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [search])

  useEffect(() => {
    adminService
      .getAllCourses({ limit: 50 })
      .then((res) => {
        const list = res?.data || []
        setCourses(list)
        if (list[0]) setGrantCourseId(list[0]._id)
      })
      .catch(() => {})
  }, [])

  const handleToggleStatus = async (student) => {
    try {
      await adminService.updateStudentStatus(student._id, { isActive: !student.isActive })
      toast.success(`Student ${student.isActive ? 'suspended' : 'reactivated'}`)
      fetchStudents()
    } catch (err) {
      toast.error(err.message || 'Could not update status')
    }
  }

  const handleViewStudent = async (student) => {
    setSelectedStudent(student)
    try {
      const res = await adminService.getStudentById(student._id)
      setStudentDetails(res.data)
    } catch {
      setStudentDetails(null)
    }
  }

  const handleGrantAccess = async () => {
    if (!selectedStudent || !grantCourseId) return
    try {
      await api.post(`/admin/students/${selectedStudent._id}/grant-access`, {
        courseId: grantCourseId,
      })
      toast.success('Course access granted and logged in audit trail!')
      handleViewStudent(selectedStudent)
    } catch (err) {
      toast.error(err.message || 'Could not grant access')
    }
  }

  const handleRevokeAccess = async (courseId) => {
    if (!selectedStudent) return
    try {
      await api.delete(`/admin/students/${selectedStudent._id}/revoke-access`, {
        data: { courseId },
      })
      toast.success('Course access revoked!')
      handleViewStudent(selectedStudent)
    } catch (err) {
      toast.error(err.message || 'Could not revoke access')
    }
  }

  return (
    <>
      <SEO title="Student Management — AIVORA Admin" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Student Management</h1>
            <p className="text-sm text-slate-600">
              View student profiles, manage account status, and grant or revoke course access with audit logging.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-pink-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="h-64 rounded-2xl bg-white border border-pink-100 shadow-sm animate-pulse" />
        ) : (
          <div className="bg-white rounded-2xl border border-pink-200/80 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-pink-50/50 border-b border-pink-100 text-xs uppercase font-semibold text-slate-600">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-100/60 text-slate-700">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-pink-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{s.name}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{s.email}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge color={s.isActive ? 'success' : 'error'}>
                        {s.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleViewStudent(s)}
                          className="p-2 rounded-lg hover:bg-pink-50 text-slate-600 hover:text-pink-600 border border-transparent hover:border-pink-200 transition-colors"
                          title="Manage Enrollments & Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(s)}
                          className="p-2 rounded-lg hover:bg-amber-50 text-slate-600 hover:text-amber-600 border border-transparent hover:border-amber-200 transition-colors"
                          title={s.isActive ? 'Suspend Account' : 'Reactivate Account'}
                        >
                          {s.isActive ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
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

      {/* Student Detail & Course Access Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => {
          setSelectedStudent(null)
          setStudentDetails(null)
        }}
        title={selectedStudent ? `Student Profile: ${selectedStudent.name}` : 'Student Profile'}
        maxWidth="max-w-2xl"
      >
        {selectedStudent && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedStudent.email}</p>
                <p className="text-xs text-slate-500">
                  Joined {new Date(selectedStudent.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge color={selectedStudent.isActive ? 'success' : 'error'}>
                {selectedStudent.isActive ? 'Active' : 'Suspended'}
              </Badge>
            </div>

            {/* Manual Course Access Grant */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Manually Grant Course Access (Audited)
              </label>
              <div className="flex gap-2">
                <select
                  value={grantCourseId}
                  onChange={(e) => setGrantCourseId(e.target.value)}
                  className="flex-1 rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <Button size="sm" onClick={handleGrantAccess}>
                  Grant Access
                </Button>
              </div>
            </div>

            {/* Enrolled Courses */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-900">Enrolled Courses</h4>
              {studentDetails?.enrollments?.length > 0 ? (
                <div className="space-y-2">
                  {studentDetails.enrollments.map((enr) => (
                    <div
                      key={enr._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <span className="font-medium text-slate-900">
                        {enr.course?.title || 'Course'} ({enr.progress || 0}%)
                      </span>
                      <button
                        onClick={() => handleRevokeAccess(enr.course?._id)}
                        className="text-red-600 hover:text-red-700 font-semibold hover:underline"
                      >
                        Revoke Access
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No active course enrollments.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
