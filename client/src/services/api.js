import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
})

// Request interceptor — attach token and format Content-Type
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // CRITICAL: When sending FormData, delete Content-Type so Axios/browser automatically
    // generates the boundary parameter: "multipart/form-data; boundary=----WebKitFormBoundary..."
    const isFormData =
      config.data instanceof FormData ||
      (typeof FormData !== 'undefined' && config.data instanceof FormData) ||
      Object.prototype.toString.call(config.data) === '[object FormData]'

    if (isFormData) {
      delete config.headers['Content-Type']
      delete config.headers['content-type']
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 and extract data
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized request (401).')
    }
    return Promise.reject(
      error.response?.data || {
        message: error.message || 'An unexpected error occurred',
        status: error.response?.status,
      }
    )
  }
)

export const get = (url, params) => api.get(url, { params })
export const post = (url, data) => api.post(url, data)
export const put = (url, data) => api.put(url, data)
export const patch = (url, data) => api.patch(url, data)
export const del = (url) => api.delete(url)

export default api
