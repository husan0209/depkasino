import { http } from './client'
import type { Session, User } from '@/types'

export const usersApi = {
  updateMe: (payload: Partial<User>) => http.patch<User>('/users/me', payload),
  setActiveCurrency: (currency: string) => http.post<{ ok: boolean }>('/users/me/active-currency', { currency }),
  sessions: () => http.get<Session[]>('/users/me/sessions'),
  terminateSession: (id: string) => http.delete<{ ok: boolean }>(`/users/me/sessions/${id}`),
  terminateOthers: () => http.delete<{ ok: boolean }>('/users/me/sessions/others'),
  /** OAuth-аккаунт отвечает 409 oauth_account — профиль показывает пояснение вместо формы. */
  changePassword: (currentPassword: string, newPassword: string) =>
    http.post<{ ok: boolean }>('/users/me/password', { currentPassword, newPassword })
}
