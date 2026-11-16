import api, { get, post } from './api'

export const paymentService = {
  getPaymentAccounts: () => get('/payments/accounts'),
  initializePayment: (data) => post('/payments/initialize', data),
  verifyPayment: (reference) => get(`/payments/verify/${reference}`),
  getMyPayments: () => get('/payments/my'),

  // Upload payment receipt picture or document from local file
  uploadReceipt: (file, onUploadProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/payments/upload-receipt', formData, {
      onUploadProgress,
    })
  },
}

export default paymentService
