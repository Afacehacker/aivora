import { get, post } from './api'

export const courseService = {
  getAllCourses: (filters = {}) => get('/courses', filters),
  getCourseBySlug: (slug) => get(`/courses/${slug}`),
  getFeaturedCourses: () => get('/courses/featured'),
  getMyEnrollments: () => get('/enrollments/my'),
  checkEnrollment: (courseId) => get(`/enrollments/check/${courseId}`),
  enrollCourse: (courseId) => post('/enrollments', { courseId }),
  getCategories: () => get('/categories'),
}

export default courseService
