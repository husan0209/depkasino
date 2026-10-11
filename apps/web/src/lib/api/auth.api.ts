import { http, setTokens } from './client'
import type { LoginCredentials, RegisterPayload, User } from '@/types'

interface AuthResponse {
  user: User
  accessToken: string
  refreshToken?: string
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<User> {
    const data = await http.post<AuthResponse>('/auth/login', credentials)
    setTokens(data.accessToken, data.refreshToken ?? null)
    return data.user
  },

  async register(payload: RegisterPayload): Promise<User> {
    const data = await http.post<AuthResponse>('/auth/register', payload)
    setTokens(data.accessToken, data.refreshToken ?? null)
    return data.user
  },

  async oauth(provider: 'google' | 'telegram'): Promise<User> {
    const data = await http.post<AuthResponse>('/auth/oauth', { provider })
    setTokens(data.accessToken, data.refreshToken ?? null)
    return data.user
  },

  async logout(): Promise<void> {
    try {
      await http.post('/auth/logout')
    } finally {
      setTokens(null, null)
    }
  },

  me: () => http.get<User>('/users/me'),

  forgotPassword: (email: string) => http.post<{ ok: boolean }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    http.post<{ ok: boolean }>('/auth/reset-password', { token, password }),

  verifyEmail: (token: string) => http.post<{ ok: boolean }>('/auth/verify-email', { token }),

  resendVerification: (email: string) =>
    http.post<{ ok: boolean; email: string }>('/auth/resend-verification', { email })
}
