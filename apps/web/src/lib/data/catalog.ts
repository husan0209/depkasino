import { isMock } from '@/lib/env'
import { MOCK_GAMES } from '@/mocks/games'
import { deckOrder } from '@/mocks/server'
import { MOCK_PROVIDERS } from '@/mocks/providers'
import { resolveGeo } from '@/mocks/geo'
import { getState } from '@/mocks/state'
import type { Currency, Game, GameFilters, Paginated, Provider } from '@/types'

/**
 * Серверные данные витрины (SSR/ISR). В мок-режиме читаем каталог напрямую,
 * в live-режиме — fetch к API каталога Части 4 с ревалидацией.
 * Персонализация (кошелёк, избранное, last played) остаётся клиентской.
 */

export const CATALOG_REVALIDATE = 60

function toPaginated<T>(items: T[], page = 1, pageSize = items.length): Paginated<T> {
  return { items, page, pageSize, total: items.length, hasMore: false }
}

function applyFilters(games: Game[], filters: GameFilters): Game[] {
  let rows = [...games]
  if (filters.q) {
    const q = filters.q.toLowerCase()
    rows = rows.filter((g) => g.title.toLowerCase().includes(q) || g.provider.name.toLowerCase().includes(q))
  }
  if (filters.category === 'new') rows = rows.filter((g) => g.categories.includes('new'))
  if (filters.category === 'popular') rows = rows.filter((g) => g.categories.includes('popular'))
  if (filters.provider) rows = rows.filter((g) => g.provider.slug === filters.provider)

  if (filters.sort === 'new') rows.sort((a, b) => +new Date(b.releasedAt) - +new Date(a.releasedAt))
  else if (filters.sort === 'az') rows.sort((a, b) => a.title.localeCompare(b.title, 'ru'))
  else rows.sort((a, b) => Number(b.categories.includes('popular')) - Number(a.categories.includes('popular')))
  return rows
}

async function liveFetch<T>(path: string): Promise<T> {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')
  const response = await fetch(`${base}${path}`, { next: { revalidate: CATALOG_REVALIDATE } })
  if (!response.ok) throw new Error(`Каталог недоступен: ${response.status}`)
  return (await response.json()) as T
}

export async function getGames(filters: GameFilters = {}): Promise<Paginated<Game>> {
  if (isMock) {
    // Страницы считаем так же, как API: SSR каталога должен совпадать с первой страницей клиента.
    const rows = applyFilters(MOCK_GAMES, filters)
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? rows.length
    const start = (page - 1) * pageSize
    const items = rows.slice(start, start + pageSize)
    return { items, page, pageSize, total: rows.length, hasMore: start + items.length < rows.length }
  }
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '' && v !== 'all') as [string, string][]
  )
  return liveFetch<Paginated<Game>>(`/games?${query.toString()}`)
}

export async function getPopularGames(limit = 12): Promise<Game[]> {
  const { items } = await getGames({ sort: 'popular', category: 'popular' })
  return items.slice(0, limit)
}

export async function getNewGames(limit = 12): Promise<Game[]> {
  const { items } = await getGames({ sort: 'new', category: 'new' })
  return items.slice(0, limit)
}

export async function getGame(slug: string): Promise<{ game: Game; similar: Game[] } | null> {
  if (isMock) {
    const game = MOCK_GAMES.find((g) => g.slug === slug)
    if (!game) return null
    const similar = MOCK_GAMES.filter((g) => g.slug !== slug && g.provider.slug === game.provider.slug)
      .concat(MOCK_GAMES.filter((g) => g.slug !== slug && g.categories.includes('popular')))
      .slice(0, 6)
    return { game, similar }
  }
  try {
    return await liveFetch<{ game: Game; similar: Game[] }>(`/games/${slug}`)
  } catch {
    return null
  }
}

/** Колода главной: то же наполнение, что отдаёт API (deck=true), но уже в HTML. */
export async function getDeckGames(limit = 8): Promise<Game[]> {
  if (isMock) {
    const state = getState()
    return deckOrder(MOCK_GAMES, state.lastPlayed, state.favorites).slice(0, limit)
  }
  const { items } = await liveFetch<Paginated<Game>>('/games?deck=true&pageSize=' + limit)
  return items.slice(0, limit)
}

export async function getProviders(): Promise<Provider[]> {
  if (isMock) return MOCK_PROVIDERS
  return liveFetch<Provider[]>('/providers')
}

export async function getProvider(slug: string): Promise<{ provider: Provider; games: Game[] } | null> {
  if (isMock) {
    const provider = MOCK_PROVIDERS.find((p) => p.slug === slug)
    if (!provider) return null
    return { provider, games: MOCK_GAMES.filter((g) => g.provider.slug === slug) }
  }
  try {
    return await liveFetch<{ provider: Provider; games: Game[] }>(`/providers/${slug}`)
  } catch {
    return null
  }
}

/** Все слаги для generateStaticParams. */
export function allGameSlugs(): string[] {
  return MOCK_GAMES.map((g) => g.slug)
}

export function allProviderSlugs(): string[] {
  return MOCK_PROVIDERS.map((p) => p.slug)
}

/** Гео для серверного рендера футера и метаданных. */
export function getGeoConfig(hostname?: string) {
  const host = hostname ?? (process.env.NEXT_PUBLIC_SITE_HOST ?? 'localhost')
  return resolveGeo(host)
}

/** Активная валюта по умолчанию для SSR-блока цен (гость). */
export function defaultCurrencyForHost(hostname?: string): Currency {
  return getGeoConfig(hostname).defaultCurrency
}

/** «Сейчас играют / крупные выигрыши» — простая полка, не live ticker (§16.2). */
export function getRecentWins() {
  return isMock ? getState().recentWins : []
}
