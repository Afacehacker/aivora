import api, { get, post, patch, del } from './api'

export const adminService = {
  // Courses
  getCourses: (params) => get('/admin/courses', params),
  getCourse: (id) => get(`/admin/courses/${id}`),
  createCourse: (data) => post('/admin/courses', data),
  updateCourse: (id, data) => patch(`/admin/courses/${id}`, data),
  deleteCourse: (id) => del(`/admin/courses/${id}`),
  togglePublishCourse: (id) => patch(`/admin/courses/${id}/toggle-publish`),

  // Users
  getUsers: (params) => get('/admin/users', params),
  getUser: (id) => get(`/admin/users/${id}`),
  updateUserRole: (id, role) => patch(`/admin/users/${id}/role`, { role }),
  toggleUserStatus: (id) => patch(`/admin/users/${id}/toggle-status`),
  deleteUser: (id) => del(`/admin/users/${id}`),

  // Analytics & Stats
  getDashboardStats: () => get('/admin/dashboard'),
  getStats: () => get('/admin/stats'),
  getRevenueChart: (period) => get('/admin/revenue-chart', { period }),
  getEnrollmentChart: (period) => get('/admin/enrollment-chart', { period }),
  getRecentPurchases: (limit) => get('/admin/recent-purchases', { limit }),
  getRecentStudents: (limit) => get('/admin/recent-students', { limit }),
  getActivityLogs: (params) => get('/admin/activity-logs', params),

  // Orders / Payments
  getOrders: (params) => get('/admin/orders', params),
  getOrder: (id) => get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => patch(`/admin/orders/${id}/status`, { status }),

  // Reviews
  getReviews: (params) => get('/admin/reviews', params),
  deleteReview: (id) => del(`/admin/reviews/${id}`),

  // Coupons
  getCoupons: (params) => get('/admin/coupons', params),
  createCoupon: (data) => post('/admin/coupons', data),
  updateCoupon: (id, data) => patch(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => del(`/admin/coupons/${id}`),

  // Site Settings
  getSiteSettings: () => get('/admin/settings'),
  updateSiteSettings: (data) => patch('/admin/settings', data),

  // Support
  getSupportTickets: (params) => get('/admin/support', params),
  updateSupportTicket: (id, data) => patch(`/admin/support/${id}`, data),

  // Categories
  getCategories: () => get('/admin/categories'),
  createCategory: (data) => post('/admin/categories', data),
  updateCategory: (id, data) => patch(`/admin/categories/${id}`, data),
  deleteCategory: (id) => del(`/admin/categories/${id}`),

  // Modules & Lessons
  createModule: (courseId, data) => post(`/admin/courses/${courseId}/modules`, data),
  updateModule: (moduleId, data) => patch(`/admin/modules/${moduleId}`, data),
  deleteModule: (moduleId) => del(`/admin/modules/${moduleId}`),
  createLesson: (moduleId, data) => post(`/admin/modules/${moduleId}/lessons`, data),
  updateLesson: (lessonId, data) => patch(`/admin/lessons/${lessonId}`, data),
  deleteLesson: (lessonId) => del(`/admin/lessons/${lessonId}`),

  // Standard Media Upload
  uploadMedia: (file, onUploadProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/admin/upload', formData, {
      onUploadProgress,
    })
  },

  // Chunked Media Upload (Reliable for videos of ANY duration/size, bypasses Vercel 4.5MB limit)
  uploadMediaChunked: async (file, onProgress) => {
    // 2 MB chunk size for safety on mobile networks and Vercel serverless
    const CHUNK_SIZE = 2 * 1024 * 1024
    const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE))
    const uploadId = `upl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Generate safe clean filename with original extension
    const dotIdx = file.name.lastIndexOf('.')
    const ext = (dotIdx > 0 ? file.name.substring(dotIdx) : '.mp4').toLowerCase()
    const rawBase = dotIdx > 0 ? file.name.substring(0, dotIdx) : file.name
    const safeBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40)
    const filename = `${Date.now()}-${safeBase}${ext}`

    let finalResponse = null

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunkBlob = file.slice(start, end)

      const formData = new FormData()
      formData.append('chunk', chunkBlob, file.name)
      formData.append('uploadId', uploadId)
      formData.append('chunkIndex', String(chunkIndex))
      formData.append('totalChunks', String(totalChunks))
      formData.append('filename', filename)
      formData.append('folder', file.type?.startsWith('image/') ? 'images' : 'videos')
      formData.append('mimeType', file.type || 'video/mp4')
      formData.append('originalName', file.name)
      formData.append('totalSize', String(file.size))

      let retries = 3
      while (retries > 0) {
        try {
          const res = await api.post('/admin/upload-chunk', formData)
          finalResponse = res
          break
        } catch (err) {
          retries--
          if (retries === 0) {
            const msg =
              err?.message ||
              err?.data?.message ||
              `Failed uploading video chunk ${chunkIndex + 1} of ${totalChunks}`
            throw new Error(msg)
          }
          await new Promise((r) => setTimeout(r, 1000))
        }
      }

      if (typeof onProgress === 'function') {
        const pct = Math.round(((chunkIndex + 1) / totalChunks) * 100)
        onProgress({
          chunkIndex,
          totalChunks,
          percent: pct,
          loaded: end,
          total: file.size,
        })
      }
    }

    return finalResponse
  },
  getUploadedMedia: () => get('/admin/media'),
}

export default adminService
