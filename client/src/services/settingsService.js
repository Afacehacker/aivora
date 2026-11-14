import { get } from './api'

export const settingsService = {
  getSiteSettings: () => get('/settings'),
  getFaqs: () => get('/settings/faqs'),
  getTestimonials: () => get('/settings/testimonials'),
}

export default settingsService
