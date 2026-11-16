import api, { get, post, patch, del } from './api'

export const adminService = {
  // Dashboard
  getDashboardStats: () => get('/admin/stats'),
  getRevenueChart: () => get('/admin/revenue-chart'),
  getRecentPurchases: () => get('/admin/recent-purchases'),
  getRecentStudents: () => get('/admin/recent-students'),

  // Courses
  getAllCourses: (params) => get('/admin/courses', params),
  createCourse: (data) => post('/admin/courses', data),
  updateCourse: (id, data) => patch(`/admin/courses/${id}`, data),
  deleteCourse: (id) => del(`/admin/courses/${id}`),
  toggleCoursePublish: (id) => patch(`/admin/courses/${id}/toggle-publish`),
  getCourseById: (id) => get(`/admin/courses/${id}`),

  // Students
  getAllStudents: (params) => get('/admin/students', params),
  getStudentById: (id) => get(`/admin/students/${id}`),
  updateStudentStatus: (id, data) => patch(`/admin/students/${id}/status`, data),

  // Orders & Manual Payments
  getAllOrders: (params) => get('/admin/orders', params),
  getOrderById: (id) => get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => patch(`/admin/orders/${id}/status`, data),

  // Payment Bank Accounts (Admin Add / Edit / Remove Payment Details)
  getPaymentAccounts: () => get('/admin/payment-accounts'),
  createPaymentAccount: (data) => post('/admin/payment-accounts', data),
  updatePaymentAccount: (id, data) => patch(`/admin/payment-accounts/${id}`, data),
  deletePaymentAccount: (id) => del(`/admin/payment-accounts/${id}`),

  // Reviews
  getAllReviews: (params) => get('/admin/reviews', params),
  updateReviewStatus: (id, data) => patch(`/admin/reviews/${id}/status`, data),
  deleteReview: (id) => del(`/admin/reviews/${id}`),

  // Settings
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
  getTicketById: (id) => get(`/admin/tickets/${id}`),
  replyToTicket: (id, data) => post(`/admin/tickets/${id}/reply`, data),
  updateTicketStatus: (id, data) => patch(`/admin/tickets/${id}/status`, data),

  // Coupons
  getAllCoupons: () => get('/admin/coupons'),
  createCoupon: (data) => post('/admin/coupons', data),
  updateCoupon: (id, data) => patch(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => del(`/admin/coupons/${id}`),

  // Categories
  getAllCategories: () => get('/admin/categories'),
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

  // Media Uploads (Images, Videos, Resources)
  uploadMedia: (file, onUploadProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
  },

  // Chunked Media Upload (Reliable for videos of ANY duration/size, bypasses Vercel 4.5MB limit)
  uploadMediaChunked: async (file, onProgress) => {
    // 2.5 MB chunk size (strictly below Vercel's 4.5 MB serverless limit)
    const CHUNK_SIZE = 2.5 * 1024 * 1024
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
      formData.append('folder', file.type.startsWith('image/') ? 'images' : 'videos')
      formData.append('mimeType', file.type || 'video/mp4')
      formData.append('originalName', file.name)
      formData.append('totalSize', String(file.size))

      let retries = 3
      while (retries > 0) {
        try {
          const res = await api.post('/admin/upload-chunk', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          finalResponse = res
          break
        } catch (err) {
          retries--
          if (retries === 0) {
            throw new Error(
              err.response?.data?.message ||
                err.message ||
                `Failed uploading video chunk ${chunkIndex + 1} of ${totalChunks}`
            )
          }
          await new Promise((r) => setTimeout(r, 1200))
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
