/** Конфигурация окружения. Мок-режим по умолчанию — фронт можно смотреть без бэкенда. */

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
const apiMode = process.env.NEXT_PUBLIC_API_MODE ?? (apiUrl ? 'live' : 'mock')

export const env = {
  apiUrl,
  apiMode: apiMode === 'live' ? 'live' : 'mock',
  siteName: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Depkasino',
  referralHost: process.env.NEXT_PUBLIC_REFERRAL_HOST ?? '',
  /** Домен для абсолютных ссылок в RSC/OG. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? ''
} as const

export const isMock = env.apiMode === 'mock'

/** База API на клиенте. В live-режиме обязателен NEXT_PUBLIC_API_URL. */
export function clientApiBase(): string {
  if (env.apiUrl) return env.apiUrl.replace(/\/$/, '')
  return '/api/v1'
}
