import { get, post } from './api'

export const paymentService = {
  initializePayment: (data) => post('/payments/initialize', data),
  verifyPayment: (reference) => get(`/payments/verify/${reference}`),
  getMyPayments: () => get('/payments/my'),
}

export default paymentService
