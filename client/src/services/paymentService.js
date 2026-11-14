import { get, post } from './api'

export const paymentService = {
  getPaymentAccounts: () => get('/payments/accounts'),
  initializePayment: (data) => post('/payments/initialize', data),
  verifyPayment: (reference) => get(`/payments/verify/${reference}`),
  getMyPayments: () => get('/payments/my'),
}

export default paymentService
