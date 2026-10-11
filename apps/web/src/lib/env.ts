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

/**
 * Опасная конфигурация: режим live без адреса API.
 * Клиент в этом случае уходит на собственный `/api/v1`, где в сборке живёт мок — на продакшене
 * это выглядело бы как настоящие балансы и платежи. Громко предупреждаем на сервере при старте.
 */
if (!isMock && !env.apiUrl && typeof window === 'undefined') {
  console.warn(
    '[env] NEXT_PUBLIC_API_MODE=live, но NEXT_PUBLIC_API_URL пуст: запросы уйдут на /api/v1 (мок-данные). ' +
      'Укажите адрес API или верните mock-режим.'
  )
}

/**
 * Абсолютный адрес сайта для метаданных, sitemap и robots.
 * В продакшене задаётся NEXT_PUBLIC_SITE_URL; локально достаточно localhost.
 */
export function siteUrl(): string {
  return (env.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
}

/** База API на клиенте. В live-режиме обязателен NEXT_PUBLIC_API_URL. */
export function clientApiBase(): string {
  if (env.apiUrl) return env.apiUrl.replace(/\/$/, '')
  return '/api/v1'
}
