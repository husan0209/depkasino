import axios, { AxiosError, type AxiosInstance } from 'axios'
import { clientApiBase } from '@/lib/env'
import { syncSessionHint } from '@/lib/session-hint'
import type { ApiErrorShape } from '@/types'

/**
 * HTTP-клиент (§18): baseURL, Bearer, refresh на 401, парсинг ошибок.
 * Токены храним в памяти + localStorage, чтобы «активная валюта и сессия переживали reload» (§23 блок I).
 */

const ACCESS_KEY = 'dk_access_token'
const REFRESH_KEY = 'dk_refresh_token'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACCESS_KEY)
}

export function setTokens(access: string | null, refresh?: string | null): void {
  if (typeof window === 'undefined') return
  if (access) window.localStorage.setItem(ACCESS_KEY, access)
  else window.localStorage.removeItem(ACCESS_KEY)
  if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh)
  else if (refresh === null) window.localStorage.removeItem(REFRESH_KEY)
  syncSessionHint(Boolean(access))
}

export class ApiError extends Error {
  code: string
  status: number
  details?: Record<string, string[]>

  constructor(shape: ApiErrorShape) {
    super(shape.message)
    this.name = 'ApiError'
    this.code = shape.code
    this.status = shape.status ?? 0
    this.details = shape.details
  }
}

export const api: AxiosInstance = axios.create({
  baseURL: clientApiBase(),
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Ошибки кассы, запуска и профиля не схлопываются в один toast — каждый слой читает ApiError.code. */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorShape>) => {
    const status = error.response?.status
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined

    if (status === 401 && original && !original._retry) {
      original._retry = true
      try {
        const { data } = await axios.post(`${clientApiBase()}/auth/refresh`, null, {
          headers: { 'X-Refresh-Token': window.localStorage.getItem(REFRESH_KEY) ?? '' }
        })
        const access = (data as { accessToken?: string }).accessToken
        if (access) {
          setTokens(access)
          original.headers = original.headers ?? {}
          original.headers.Authorization = `Bearer ${access}`
          return api.request(original)
        }
      } catch {
        setTokens(null, null)
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('dk:unauthorized'))
      }
    }

    const payload = error.response?.data
    return Promise.reject(
      new ApiError({
        code: payload?.code ?? (status === 401 ? 'unauthorized' : 'network_error'),
        message: payload?.message ?? 'Сеть недоступна. Попробуйте ещё раз',
        status,
        details: payload?.details
      })
    )
  }
)

/** Тонкие обёртки, чтобы доменные API-файлы не повторяли одну и ту же сигнатуру. */
export const http = {
  get: <T>(url: string, params?: Record<string, unknown>) => api.get<T>(url, { params }).then((r) => r.data),
  post: <T>(url: string, body?: unknown) => api.post<T>(url, body).then((r) => r.data),
  patch: <T>(url: string, body?: unknown) => api.patch<T>(url, body).then((r) => r.data),
  delete: <T>(url: string) => api.delete<T>(url).then((r) => r.data)
}
