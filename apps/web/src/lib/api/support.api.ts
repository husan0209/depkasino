import { http } from './client'
import type { Ticket, TicketCategory } from '@/types'

export const supportApi = {
  tickets: () => http.get<Ticket[]>('/support/tickets'),
  ticket: (id: string) => http.get<Ticket>(`/support/tickets/${id}`),
  create: (payload: { subject: string; category: TicketCategory; message: string }) =>
    http.post<Ticket>('/support/tickets', payload),
  reply: (id: string, text: string) => http.post<Ticket>(`/support/tickets/${id}/messages`, { text }),
  close: (id: string) => http.post<Ticket>(`/support/tickets/${id}/close`)
}
