import api, { get, post, patch, del } from './api'

export const adminService = {
  // Dashboard & Analytics
  getDashboardStats: () => get('/admin/stats'),
  getStats: () => get('/admin/stats'),
  getRevenueChart: (period) => get('/admin/revenue-chart', { period }),
  getEnrollmentChart: (period) => get('/admin/enrollment-chart', { period }),
  getRecentPurchases: (limit) => get('/admin/recent-purchases', { limit }),
  getRecentStudents: (limit) => get('/admin/recent-students', { limit }),
  getActivityLogs: (params) => get('/admin/activity-logs', params),

  // Courses
  getAllCourses: (params) => get('/admin/courses', params),
  getCourses: (params) => get('/admin/courses', params),
  getCourse: (id) => get(`/admin/courses/${id}`),
  getCourseById: (id) => get(`/admin/courses/${id}`),
  createCourse: (data) => post('/admin/courses', data),
  updateCourse: (id, data) => patch(`/admin/courses/${id}`, data),
  deleteCourse: (id) => del(`/admin/courses/${id}`),
  toggleCoursePublish: (id) => patch(`/admin/courses/${id}/toggle-publish`),
  togglePublishCourse: (id) => patch(`/admin/courses/${id}/toggle-publish`),

  // Students & Users
  getAllStudents: (params) => get('/admin/students', params),
  getStudents: (params) => get('/admin/students', params),
  getStudentById: (id) => get(`/admin/students/${id}`),
  updateStudentStatus: (id, data) => patch(`/admin/students/${id}/status`, data),
  getUsers: (params) => get('/admin/users', params),
  getUser: (id) => get(`/admin/users/${id}`),
  updateUserRole: (id, role) => patch(`/admin/users/${id}/role`, { role }),
  toggleUserStatus: (id) => patch(`/admin/users/${id}/toggle-status`),
  deleteUser: (id) => del(`/admin/users/${id}`),

  // Orders & Manual Payments
  getAllOrders: (params) => get('/admin/orders', params),
  getOrders: (params) => get('/admin/orders', params),
  getOrderById: (id) => get(`/admin/orders/${id}`),
  getOrder: (id) => get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) =>
    patch(
      `/admin/orders/${id}/status`,
      typeof data === 'string' ? { status: data } : data
    ),

  // Payment Bank Accounts (Admin Add / Edit / Remove Payment Details)
  getPaymentAccounts: () => get('/admin/payment-accounts'),
  createPaymentAccount: (data) => post('/admin/payment-accounts', data),
  updatePaymentAccount: (id, data) => patch(`/admin/payment-accounts/${id}`, data),
  deletePaymentAccount: (id) => del(`/admin/payment-accounts/${id}`),

  // Reviews
  getAllReviews: (params) => get('/admin/reviews', params),
  getReviews: (params) => get('/admin/reviews', params),
  updateReviewStatus: (id, data) => patch(`/admin/reviews/${id}/status`, data),
  deleteReview: (id) => del(`/admin/reviews/${id}`),

  // Site Settings
  getSiteSettings: () => get('/admin/settings'),
  updateSiteSettings: (data) => patch('/admin/settings', data),

  // FAQs
  getAllFaqs: () => get('/admin/faqs'),
  createFaq: (data) => post('/admin/faqs', data),
  updateFaq: (id, data) => patch(`/admin/faqs/${id}`, data),
  deleteFaq: (id) => del(`/admin/faqs/${id}`),

  // Testimonials
  getAllTestimonials: () => get('/admin/testimonials'),
  createTestimonial: (data) => post('/admin/testimonials', data),
  updateTestimonial: (id, data) => patch(`/admin/testimonials/${id}`, data),
  deleteTestimonial: (id) => del(`/admin/testimonials/${id}`),

  // Support Tickets
  getAllTickets: (params) => get('/admin/tickets', params),
  getSupportTickets: (params) => get('/admin/tickets', params),
  getTicketById: (id) => get(`/admin/tickets/${id}`),
  replyToTicket: (id, data) => post(`/admin/tickets/${id}/reply`, data),
  updateTicketStatus: (id, data) => patch(`/admin/tickets/${id}/status`, data),
  updateSupportTicket: (id, data) => patch(`/admin/tickets/${id}/status`, data),

  // Coupons
  getAllCoupons: (params) => get('/admin/coupons', params),
  getCoupons: (params) => get('/admin/coupons', params),
  createCoupon: (data) => post('/admin/coupons', data),
  updateCoupon: (id, data) => patch(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => del(`/admin/coupons/${id}`),

  // Categories
  getAllCategories: () => get('/admin/categories'),
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

  // Media Uploads (Single-part direct upload with progress, 10 min timeout, zero chunking)
  uploadMedia: (file, onUploadProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/admin/upload', formData, {
      timeout: 600000,
      onUploadProgress,
    })
  },

  // Fast Chunked Media Upload (< 5 minutes guaranteed for HD video tutorials)
  uploadMediaChunked: async (file, onProgress) => {
    // 8 MB chunk size for 4x faster upload speed and minimal roundtrips
    const CHUNK_SIZE = 8 * 1024 * 1024
    const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE))
    const uploadId = `upl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Generate opaque safe filename with original extension (never exposes device file names)
    const dotIdx = file.name.lastIndexOf('.')
    const ext = (dotIdx > 0 ? file.name.substring(dotIdx) : '.mp4').toLowerCase()
    const randomToken = Math.random().toString(36).substring(2, 10)
    const isImage = file.type?.startsWith('image/')
    const prefix = isImage ? 'img' : 'vid'
    const filename = `${prefix}-${Date.now()}-${randomToken}${ext}`

    let finalResponse = null

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunkBlob = file.slice(start, end)

      const formData = new FormData()
      formData.append('chunk', chunkBlob, filename)
      formData.append('uploadId', uploadId)
      formData.append('chunkIndex', String(chunkIndex))
      formData.append('totalChunks', String(totalChunks))
      formData.append('filename', filename)
      formData.append('folder', isImage ? 'images' : 'videos')
      formData.append('mimeType', file.type || 'video/mp4')
      formData.append('originalName', filename)
      formData.append('totalSize', String(file.size))

      let retries = 3
      while (retries > 0) {
        try {
          const res = await api.post('/admin/upload-chunk', formData, {
            timeout: 120000,
          })
          finalResponse = res
          break
        } catch (err) {
          retries--
          if (retries === 0) {
            const msg =
              err?.message ||
              err?.data?.message ||
              `Failed uploading video part ${chunkIndex + 1} of ${totalChunks}`
            throw new Error(msg)
          }
          await new Promise((r) => setTimeout(r, 800))
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
