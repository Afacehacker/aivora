import { get, post, del } from './api'

export const reviewService = {
  createReview: (data) => post('/reviews', data),
  getCourseReviews: (courseId) => get(`/reviews/course/${courseId}`),
  deleteReview: (id) => del(`/reviews/${id}`),
}

export default reviewService
