import type { Currency, Game } from '@/types'
import { MOCK_PROVIDERS } from './providers'

/**
 * Каталог игр для мок-режима (Часть 4 через API отдаёт те же поля).
 * `currencies` намеренно неполные у части игр — это рабочий кейс «провайдер не принимает валюту» (§8.2 п.5).
 */

const ALL_FIAT: Currency[] = ['RUB', 'UAH', 'BYN', 'KZT', 'UZS']
const FIAT_CRYPTO: Currency[] = [...ALL_FIAT, 'USDT', 'BTC']
const NO_UZS_BYN: Currency[] = ['RUB', 'UAH', 'KZT', 'USDT', 'BTC']

interface Seed {
  slug: string
  title: string
  provider: string
  badge?: 'NEW' | 'HOT'
  categories?: Array<'new' | 'popular'>
  rtp: number
  volatility: 'low' | 'medium' | 'high'
  minBet: number
  currencies?: Currency[]
  releasedAt: string
  deckReason?: Game['deckReason']
}

const SEEDS: Seed[] = [
  { slug: 'sweet-bonanza', title: 'Sweet Bonanza', provider: 'pragmatic-play', badge: 'HOT', categories: ['popular'], rtp: 96.48, volatility: 'high', minBet: 10, currencies: FIAT_CRYPTO, releasedAt: '2019-06-25', deckReason: 'Хайп' },
  { slug: 'gates-of-olympus', title: 'Gates of Olympus', provider: 'pragmatic-play', badge: 'HOT', categories: ['popular'], rtp: 96.5, volatility: 'high', minBet: 10, currencies: NO_UZS_BYN, releasedAt: '2021-02-15', deckReason: 'Хайп' },
  { slug: 'big-bass-bonanza', title: 'Big Bass Bonanza', provider: 'pragmatic-play', categories: ['popular'], rtp: 96.71, volatility: 'high', minBet: 10, releasedAt: '2020-12-01' },
  { slug: 'the-dog-house-megaways', title: 'The Dog House Megaways', provider: 'pragmatic-play', badge: 'NEW', categories: ['new', 'popular'], rtp: 96.55, volatility: 'high', minBet: 20, releasedAt: '2025-08-19', deckReason: 'Новинка' },
  { slug: 'sugar-rush', title: 'Sugar Rush', provider: 'pragmatic-play', categories: ['popular'], rtp: 96.5, volatility: 'high', minBet: 20, releasedAt: '2022-05-12' },
  { slug: 'starlight-princess', title: 'Starlight Princess', provider: 'pragmatic-play', categories: ['popular'], rtp: 96.5, volatility: 'high', minBet: 10, currencies: NO_UZS_BYN, releasedAt: '2021-10-07' },
  { slug: 'fruit-party', title: 'Fruit Party', provider: 'pragmatic-play', badge: 'NEW', categories: ['new'], rtp: 96.47, volatility: 'high', minBet: 20, releasedAt: '2025-09-02', deckReason: 'Новинка' },
  { slug: 'wild-west-gold', title: 'Wild West Gold', provider: 'pragmatic-play', rtp: 96.51, volatility: 'high', minBet: 20, releasedAt: '2019-09-26' },
  { slug: 'book-of-fallen', title: 'Book of Fallen', provider: 'pragmatic-play', rtp: 96.53, volatility: 'high', minBet: 10, currencies: NO_UZS_BYN, releasedAt: '2023-03-14' },
  { slug: 'book-of-dead', title: 'Book of Dead', provider: 'playn-go', categories: ['popular'], rtp: 96.21, volatility: 'high', minBet: 10, currencies: NO_UZS_BYN, releasedAt: '2016-07-01' },
  { slug: 'reactoonz', title: 'Reactoonz', provider: 'playn-go', rtp: 96.51, volatility: 'high', minBet: 20, currencies: NO_UZS_BYN, releasedAt: '2017-11-30' },
  { slug: 'legacy-of-dead', title: 'Legacy of Dead', provider: 'playn-go', badge: 'NEW', categories: ['new'], rtp: 96.3, volatility: 'high', minBet: 10, currencies: NO_UZS_BYN, releasedAt: '2025-07-22', deckReason: 'Новинка' },
  { slug: 'bonanza-billion', title: 'Bonanza Billion', provider: 'bgaming', badge: 'NEW', categories: ['new', 'popular'], rtp: 96.2, volatility: 'high', minBet: 10, releasedAt: '2025-06-11', deckReason: 'Новинка' },
  { slug: 'elvis-frog-in-vegas', title: 'Elvis Frog in Vegas', provider: 'bgaming', categories: ['popular'], rtp: 96.2, volatility: 'medium', minBet: 10, releasedAt: '2020-04-08' },
  { slug: 'fire-portals', title: 'Fire Portals', provider: 'bgaming', rtp: 96.09, volatility: 'high', minBet: 10, releasedAt: '2024-02-20' },
  { slug: 'book-of-cats', title: 'Book of Cats', provider: 'bgaming', rtp: 96.5, volatility: 'high', minBet: 10, releasedAt: '2023-08-15' },
  { slug: 'wanted-dead-or-a-wild', title: 'Wanted Dead or a Wild', provider: 'hacksaw-gaming', badge: 'HOT', categories: ['popular'], rtp: 96.38, volatility: 'high', minBet: 20, currencies: NO_UZS_BYN, releasedAt: '2021-11-11', deckReason: 'Хайп' },
  { slug: 'le-bandit', title: 'Le Bandit', provider: 'hacksaw-gaming', categories: ['popular'], rtp: 96.34, volatility: 'high', minBet: 20, currencies: NO_UZS_BYN, releasedAt: '2023-04-27' },
  { slug: 'chaos-crew', title: 'Chaos Crew', provider: 'hacksaw-gaming', badge: 'HOT', categories: ['popular'], rtp: 96.19, volatility: 'high', minBet: 20, currencies: NO_UZS_BYN, releasedAt: '2020-10-19', deckReason: 'Хайп' },
  { slug: 'crystal-caverns', title: 'Crystal Caverns', provider: 'hacksaw-gaming', badge: 'NEW', categories: ['new'], rtp: 96.28, volatility: 'high', minBet: 10, currencies: NO_UZS_BYN, releasedAt: '2025-09-24', deckReason: 'Новинка' },
  { slug: 'san-quentin-xways', title: 'San Quentin xWays', provider: 'nolimit-city', badge: 'HOT', categories: ['popular'], rtp: 96.03, volatility: 'high', minBet: 20, currencies: NO_UZS_BYN, releasedAt: '2020-07-21' },
  { slug: 'mental', title: 'Mental', provider: 'nolimit-city', rtp: 96.08, volatility: 'high', minBet: 20, currencies: ['RUB', 'KZT', 'USDT', 'BTC'], releasedAt: '2023-05-30' },
  { slug: 'dieseldas', title: 'Diesel Dazzle', provider: 'nolimit-city', rtp: 96.35, volatility: 'high', minBet: 20, currencies: ['RUB', 'KZT', 'USDT'], releasedAt: '2024-09-05' },
  { slug: 'money-train-3', title: 'Money Train 3', provider: 'relax-gaming', badge: 'NEW', categories: ['new', 'popular'], rtp: 96.11, volatility: 'high', minBet: 20, currencies: NO_UZS_BYN, releasedAt: '2025-08-04', deckReason: 'Новинка' },
  { slug: 'temple-tumble', title: 'Temple Tumble', provider: 'relax-gaming', rtp: 96.25, volatility: 'high', minBet: 20, currencies: NO_UZS_BYN, releasedAt: '2022-06-14' },
  { slug: 'big-atlantis-frenzy', title: 'Big Atlantis Frenzy', provider: 'push-gaming', categories: ['popular'], rtp: 96.53, volatility: 'high', minBet: 10, currencies: NO_UZS_BYN, releasedAt: '2021-09-16' },
  { slug: 'razor-shark', title: 'Razor Shark', provider: 'push-gaming', badge: 'HOT', categories: ['popular'], rtp: 96.7, volatility: 'high', minBet: 10, currencies: NO_UZS_BYN, releasedAt: '2019-04-11', deckReason: 'Хайп' },
  { slug: 'jammin-jars', title: "Jammin' Jars", provider: 'push-gaming', rtp: 96.83, volatility: 'high', minBet: 20, currencies: NO_UZS_BYN, releasedAt: '2018-09-27' },
  { slug: 'burning-wins', title: 'Burning Wins', provider: 'playson', categories: ['popular'], rtp: 95.83, volatility: 'medium', minBet: 10, releasedAt: '2017-06-06' },
  { slug: 'buffalo-power-megaways', title: 'Buffalo Power Megaways', provider: 'playson', badge: 'NEW', categories: ['new'], rtp: 95.81, volatility: 'high', minBet: 20, releasedAt: '2025-05-27', deckReason: 'Новинка' },
  { slug: 'sun-of-egypt-3', title: 'Sun of Egypt 3', provider: 'three-oaks', categories: ['popular'], rtp: 95.98, volatility: 'high', minBet: 10, releasedAt: '2021-03-10' },
  { slug: 'green-chilli', title: 'Green Chilli', provider: 'three-oaks', badge: 'NEW', categories: ['new'], rtp: 95.7, volatility: 'high', minBet: 10, releasedAt: '2025-09-16', deckReason: 'Новинка' },
  { slug: 'sun-of-egypt-2', title: 'Sun of Egypt 2', provider: 'three-oaks', rtp: 95.95, volatility: 'high', minBet: 10, releasedAt: '2020-11-04' },
  { slug: '40-super-hot', title: '40 Super Hot', provider: 'amusnet', categories: ['popular'], rtp: 95.65, volatility: 'medium', minBet: 10, releasedAt: '2019-01-15' },
  { slug: 'fruit-super-nova', title: 'Fruit Super Nova', provider: 'amusnet', badge: 'NEW', categories: ['new'], rtp: 96.14, volatility: 'medium', minBet: 10, releasedAt: '2025-08-28', deckReason: 'Новинка' },
  { slug: 'starburst', title: 'Starburst', provider: 'netent', categories: ['popular'], rtp: 96.09, volatility: 'low', minBet: 10, currencies: NO_UZS_BYN, releasedAt: '2012-11-12' },
  { slug: 'gonzo-quest', title: "Gonzo's Quest", provider: 'netent', rtp: 95.97, volatility: 'medium', minBet: 10, currencies: NO_UZS_BYN, releasedAt: '2011-10-05' },
  { slug: 'wild-tiger', title: 'Wild Tiger', provider: 'booming-games', rtp: 96.02, volatility: 'high', minBet: 10, releasedAt: '2022-01-18' },
  { slug: 'curse-of-the-pyramid', title: 'Curse of the Pyramid', provider: 'booming-games', badge: 'NEW', categories: ['new'], rtp: 95.9, volatility: 'high', minBet: 10, releasedAt: '2025-07-08', deckReason: 'Новинка' }
]

export const MOCK_GAMES: Game[] = SEEDS.map((seed) => {
  const provider = MOCK_PROVIDERS.find((p) => p.slug === seed.provider)!
  return {
    slug: seed.slug,
    title: seed.title,
    provider: { slug: provider.slug, name: provider.name },
    cover: `/covers/${seed.slug}.svg`,
    badge: seed.badge,
    categories: seed.categories ?? ['slots'],
    rtp: seed.rtp,
    volatility: seed.volatility,
    minBet: seed.minBet,
    minBetCurrency: 'RUB',
    currencies: seed.currencies ?? FIAT_CRYPTO,
    hasDemo: true,
    releasedAt: seed.releasedAt,
    deckReason: seed.deckReason
  }
})

export function findGame(slug: string): Game | undefined {
  return MOCK_GAMES.find((g) => g.slug === slug)
}

export function similarGames(slug: string, limit = 6): Game[] {
  const source = findGame(slug)
  if (!source) return MOCK_GAMES.slice(0, limit)
  return MOCK_GAMES.filter((g) => g.slug !== slug && g.provider.slug === source.provider.slug)
    .concat(MOCK_GAMES.filter((g) => g.slug !== slug && g.provider.slug !== source.provider.slug && g.categories.includes('popular')))
    .slice(0, limit)
}
