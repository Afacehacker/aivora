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

  // Orders
  getAllOrders: (params) => get('/admin/orders', params),
  getOrderById: (id) => get(`/admin/orders/${id}`),

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
  getUploadedMedia: () => get('/admin/media'),
}

export default adminService
