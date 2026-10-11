import type { Provider } from '@/types'

/**
 * Провайдеры каталога. Логотипы — цветные тайлы (в проде подставляются реальные SVG провайдера).
 * `currencies` описывает, какие кошельки принимает провайдер — кросс-валютная игра запрещена (§2.7).
 */
export const MOCK_PROVIDERS: Provider[] = [
  { slug: 'pragmatic-play', name: 'Pragmatic Play', brandColor: '#D0021B', gamesCount: 9, currencies: ['RUB', 'UAH', 'KZT', 'UZS', 'USDT', 'BTC'] },
  { slug: 'playn-go', name: "Play'n GO", brandColor: '#00A3E0', gamesCount: 3, currencies: ['RUB', 'UAH', 'KZT', 'USDT', 'BTC'] },
  { slug: 'bgaming', name: 'BGaming', brandColor: '#7B61FF', gamesCount: 4, currencies: ['RUB', 'UAH', 'BYN', 'KZT', 'UZS', 'USDT', 'BTC'] },
  { slug: 'hacksaw-gaming', name: 'Hacksaw Gaming', brandColor: '#FF7A00', gamesCount: 4, currencies: ['RUB', 'UAH', 'KZT', 'USDT', 'BTC'] },
  { slug: 'nolimit-city', name: 'Nolimit City', brandColor: '#111827', gamesCount: 3, currencies: ['RUB', 'KZT', 'USDT', 'BTC'] },
  { slug: 'relax-gaming', name: 'Relax Gaming', brandColor: '#22C55E', gamesCount: 2, currencies: ['RUB', 'UAH', 'KZT', 'USDT', 'BTC'] },
  { slug: 'push-gaming', name: 'Push Gaming', brandColor: '#F59E0B', gamesCount: 3, currencies: ['RUB', 'UAH', 'KZT', 'USDT', 'BTC'] },
  { slug: 'playson', name: 'Playson', brandColor: '#EF4444', gamesCount: 2, currencies: ['RUB', 'UAH', 'BYN', 'KZT', 'UZS', 'USDT'] },
  { slug: 'three-oaks', name: '3 Oaks Gaming', brandColor: '#0EA5E9', gamesCount: 3, currencies: ['RUB', 'UAH', 'BYN', 'KZT', 'UZS', 'USDT', 'BTC'] },
  { slug: 'amusnet', name: 'Amusnet', brandColor: '#A855F7', gamesCount: 2, currencies: ['RUB', 'UAH', 'BYN', 'KZT', 'UZS', 'USDT'] },
  { slug: 'netent', name: 'NetEnt', brandColor: '#2563EB', gamesCount: 2, currencies: ['RUB', 'UAH', 'KZT', 'USDT', 'BTC'] },
  { slug: 'booming-games', name: 'Booming Games', brandColor: '#14B8A6', gamesCount: 2, currencies: ['RUB', 'UAH', 'KZT', 'UZS', 'USDT', 'BTC'] }
]

export function findProvider(slug: string): Provider | undefined {
  return MOCK_PROVIDERS.find((p) => p.slug === slug)
}
