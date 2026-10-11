import type { GameFilters } from '@/types'

/** Ключи TanStack Query (§18). */
export const queryKeys = {
  geo: ['geo'] as const,
  me: ['users', 'me'] as const,
  sessions: ['users', 'me', 'sessions'] as const,
  wallets: (userId?: string) => ['wallet', userId ?? 'guest'] as const,
  transactions: (userId: string | undefined, filters: Record<string, unknown>) =>
    ['wallet', 'transactions', userId ?? 'guest', filters] as const,
  games: (filters: GameFilters) => ['games', filters] as const,
  game: (slug: string) => ['games', slug] as const,
  providers: ['providers'] as const,
  provider: (slug: string) => ['providers', slug] as const,
  favorites: ['favorites'] as const,
  lastPlayed: ['history', 'last-played'] as const,
  feed: ['history', 'feed'] as const,
  bets: (filters: Record<string, unknown>) => ['history', 'bets', filters] as const,
  kyc: ['kyc', 'status'] as const,
  tickets: ['support', 'tickets'] as const,
  ticket: (id: string) => ['support', 'tickets', id] as const,
  referral: ['referral'] as const
}
