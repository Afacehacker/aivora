import { get, post, patch } from './api'

export const authService = {
  register: (data) => post('/auth/register', data),
  login: (data) => post('/auth/login', data),
  logout: () => post('/auth/logout'),
  forgotPassword: (email) => post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => get(`/auth/verify-email/${token}`),
  getMe: () => get('/auth/me'),
  updateProfile: (data) => patch('/auth/update-profile', data),
  changePassword: (data) => patch('/auth/change-password', data),
}

export default authService
