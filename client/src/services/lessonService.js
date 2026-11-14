import { get, patch } from './api'

export const lessonService = {
  getLessons: (courseId) => get(`/courses/${courseId}/lessons`),
  getLesson: (lessonId) => get(`/lessons/${lessonId}`),
  updateProgress: (lessonId, data) => patch(`/progress/${lessonId}`, data),
  getCourseProgress: (courseId) => get(`/progress/${courseId}`),
}

export default lessonService
