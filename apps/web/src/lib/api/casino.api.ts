import { http } from './client'
import type { Currency, Game, GameFilters, LaunchResult, Paginated, Provider } from '@/types'

export interface GameDetail {
  game: Game
  similar: Game[]
  favorite: boolean
}

export interface LastPlayedEntry {
  game: Game
  lastPlayedAt: string
}

export interface FeedWin {
  slug: string
  title: string
  amount: number
  currency: Currency
  at: string
}

export const casinoApi = {
  games: (filters: GameFilters & { page?: number; pageSize?: number; deck?: boolean }) =>
    http.get<Paginated<Game>>('/games', filters as Record<string, unknown>),
  game: (slug: string) => http.get<GameDetail>(`/games/${slug}`),
  providers: () => http.get<Provider[]>('/providers'),
  provider: (slug: string) => http.get<{ provider: Provider; games: Game[] }>(`/providers/${slug}`),
  favorites: () => http.get<{ items: Game[]; slugs: string[] }>('/favorites'),
  toggleFavorite: (slug: string, favorite: boolean) =>
    favorite ? http.post<{ slugs: string[] }>(`/favorites/${slug}`) : http.delete<{ slugs: string[] }>(`/favorites/${slug}`),
  lastPlayed: () => http.get<LastPlayedEntry[]>('/history/last-played'),
  feed: () => http.get<FeedWin[]>('/history/feed'),
  launch: (payload: { slug: string; currency?: Currency; demo?: boolean }) =>
    http.post<LaunchResult>('/launch', payload)
}
