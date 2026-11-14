import { get, post } from './api'

export const supportService = {
  createTicket: (data) => post('/tickets', data),
  getMyTickets: () => get('/tickets/my'),
  getTicketById: (id) => get(`/tickets/${id}`),
  replyToTicket: (id, data) => post(`/tickets/${id}/reply`, data),
}

export default supportService
