'use client'

import { create } from 'zustand'
import { authApi } from '@/lib/api'
import { setTokens } from '@/lib/api/client'
import type { LoginCredentials, RegisterPayload, User } from '@/types'

interface AuthStore {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login(credentials: LoginCredentials): Promise<void>
  register(payload: RegisterPayload): Promise<void>
  oauth(provider: 'google' | 'telegram'): Promise<void>
  logout(): Promise<void>
  fetchMe(): Promise<void>
  updateUser(data: Partial<User>): void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  async login(credentials) {
    const user = await authApi.login(credentials)
    set({ user, isAuthenticated: true, isLoading: false })
  },

  async register(payload) {
    const user = await authApi.register(payload)
    set({ user, isAuthenticated: true, isLoading: false })
  },

  async oauth(provider) {
    const user = await authApi.oauth(provider)
    set({ user, isAuthenticated: true, isLoading: false })
  },

  async logout() {
    await authApi.logout()
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  async fetchMe() {
    set({ isLoading: true })
    try {
      const user = await authApi.me()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      setTokens(null, null)
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  updateUser(data) {
    set((state) => (state.user ? { user: { ...state.user, ...data } } : {}))
  }
}))
