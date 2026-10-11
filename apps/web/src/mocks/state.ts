import type {
  BetRecord,
  Currency,
  KycState,
  ReferralEntry,
  Session,
  Ticket,
  Transaction,
  User,
  WalletBalance
} from '@/types'

/**
 * In-memory состояние мок-сервера (`/api/v1/*`).
 * Живёт только когда NEXT_PUBLIC_API_MODE=mock; при живом бэке роуты не используются.
 */

const now = Date.now()
const min = 60_000
const hour = 3_600_000
const day = 86_400_000
const iso = (offset: number) => new Date(now - offset).toISOString()

function mockUser(): User {
  return {
    id: 'u_10231',
    email: 'player@example.com',
    firstName: 'Артём',
    country: 'KZ',
    city: 'Алматы',
    kycStatus: 'not_started',
    withdrawalBlockedByKyc: true,
    referralCode: 'DK-7F3A21',
    createdAt: iso(62 * day),
    emailVerified: true,
    activeCurrency: 'RUB',
    lastPlayedCurrency: 'KZT',
    settings: { emailNotifications: true, timezone: 'Asia/Almaty' }
  }
}

function mockWallets(): WalletBalance[] {
  return [
    { currency: 'RUB', balance: 1200, updatedAt: iso(2 * hour) },
    { currency: 'KZT', balance: 8200, updatedAt: iso(40 * min) },
    { currency: 'USDT', balance: 150, network: 'TRC20', updatedAt: iso(3 * day) },
    { currency: 'UAH', balance: 0, updatedAt: iso(30 * day) },
    { currency: 'BYN', balance: 0, updatedAt: iso(30 * day) },
    { currency: 'UZS', balance: 0, updatedAt: iso(30 * day) },
    { currency: 'BTC', balance: 0, network: 'BTC', updatedAt: iso(30 * day) }
  ]
}

function mockTransactions(): Transaction[] {
  const rows: Array<Partial<Transaction> & { type: Transaction['type']; amount: number; currency: Currency; offset: number }> = [
    { type: 'deposit', amount: 2000, currency: 'RUB', offset: 2 * hour, method: 'СБП', network: 'SBP', status: 'completed' },
    { type: 'deposit', amount: 8200, currency: 'KZT', offset: 40 * min, method: 'Kaspi', network: 'CARD', status: 'completed' },
    { type: 'win', amount: 3400, currency: 'KZT', offset: 38 * min, provider: 'Pragmatic Play', status: 'completed' },
    { type: 'bet', amount: -200, currency: 'KZT', offset: 45 * min, provider: 'Pragmatic Play', status: 'completed' },
    { type: 'deposit', amount: 150, currency: 'USDT', offset: 3 * day, method: 'USDT TRC20', network: 'TRC20', status: 'completed', rate: 92.4 },
    { type: 'withdrawal', amount: -1000, currency: 'RUB', offset: 6 * day, method: 'Карта', status: 'completed' },
    { type: 'bet', amount: -500, currency: 'RUB', offset: 7 * day, provider: 'Hacksaw Gaming', status: 'completed' },
    { type: 'win', amount: 1200, currency: 'RUB', offset: 7 * day - 4 * min, provider: 'Hacksaw Gaming', status: 'completed' },
    { type: 'deposit', amount: 5000, currency: 'RUB', offset: 12 * day, method: 'P2P', network: 'P2P', status: 'failed' },
    { type: 'referral', amount: 350, currency: 'RUB', offset: 14 * day, status: 'completed' },
    { type: 'withdrawal', amount: -60, currency: 'USDT', offset: 21 * day, method: 'USDT TRC20', network: 'TRC20', status: 'completed', rate: 91.8 },
    { type: 'deposit', amount: 500, currency: 'UAH', offset: 25 * day, method: 'Карта', network: 'CARD', status: 'cancelled' }
  ]
  return rows.map((row, index) => ({
    id: `tx_${8800 - index}`,
    type: row.type,
    status: row.status ?? 'completed',
    amount: row.amount,
    currency: row.currency,
    createdAt: iso(row.offset),
    method: row.method,
    network: row.network,
    provider: row.provider,
    rate: row.rate,
    destination: row.type === 'withdrawal' ? '•••• 4417' : undefined
  }))
}

function mockBets(): BetRecord[] {
  const games: Array<[string, string, string]> = [
    ['sweet-bonanza', 'Sweet Bonanza', 'Pragmatic Play'],
    ['gates-of-olympus', 'Gates of Olympus', 'Pragmatic Play'],
    ['wanted-dead-or-a-wild', 'Wanted Dead or a Wild', 'Hacksaw Gaming'],
    ['money-train-3', 'Money Train 3', 'Relax Gaming'],
    ['sun-of-egypt-3', 'Sun of Egypt 3', '3 Oaks Gaming'],
    ['razor-shark', 'Razor Shark', 'Push Gaming'],
    ['bonanza-billion', 'Bonanza Billion', 'BGaming'],
    ['the-dog-house-megaways', 'The Dog House Megaways', 'Pragmatic Play']
  ]
  const rows: BetRecord[] = []
  for (let i = 0; i < 24; i += 1) {
    const [slug, title, providerName] = games[i % games.length]
    const currency: Currency = i % 3 === 0 ? 'RUB' : 'KZT'
    const bet = currency === 'RUB' ? 50 + (i % 4) * 10 : 500 + (i % 4) * 100
    const win = i % 3 === 0 ? Math.round(bet * (i % 5 === 0 ? 12.4 : 0)) : Math.round(bet * (i % 7 === 0 ? 3.2 : 0))
    rows.push({
      id: `bet_${4400 - i}`,
      game: { slug, title },
      provider: { slug: providerName.toLowerCase().replace(/[^a-z]+/g, '-'), name: providerName },
      bet,
      win,
      currency,
      createdAt: iso(20 * min + i * 47 * min)
    })
  }
  return rows
}

function mockTickets(): Ticket[] {
  return [
    {
      id: 'TCK-1043',
      subject: 'Не зачислился депозит через СБП',
      category: 'payments',
      status: 'answered',
      createdAt: iso(2 * day),
      updatedAt: iso(5 * hour),
      messages: [
        { id: 'm1', author: 'user', text: 'Оплатил 2 000 ₽ через СБП, баланс не изменился. Чек прикладываю.', createdAt: iso(2 * day) },
        { id: 'm2', author: 'support', text: 'Платёж найден, зачисление прошло. Проверьте баланс RUB — если ещё не видно, скажите.', createdAt: iso(5 * hour) }
      ]
    },
    {
      id: 'TCK-0988',
      subject: 'Слот вылетает на Gates of Olympus',
      category: 'games',
      status: 'closed',
      createdAt: iso(16 * day),
      updatedAt: iso(15 * day),
      messages: [
        { id: 'm1', author: 'user', text: 'На телефоне при фриспинах закрывается окно игры.', createdAt: iso(16 * day) },
        { id: 'm2', author: 'support', text: 'Проблема была на стороне провайдера, исправлено. Спасибо за репорт.', createdAt: iso(15 * day) }
      ]
    }
  ]
}

function mockReferrals(): ReferralEntry[] {
  const emails = ['i***a@mail.ru', 'd***v@gmail.com', 'k***t@inbox.ru', 'a***n@bk.ru', 'm***s@mail.kz', 's***r@yandex.ru']
  return emails.map((maskedEmail, index) => ({
    id: `ref_${320 + index}`,
    maskedEmail,
    joinedAt: iso((3 + index * 4) * day),
    currency: index % 2 === 0 ? 'RUB' : 'KZT',
    amount: index % 2 === 0 ? 120 + index * 35 : 900 + index * 220
  }))
}

export interface MockState {
  user: User | null
  /** Пароль демо-аккаунта: смена пароля проверяет его, как настоящий бэкенд. */
  password: string
  wallets: WalletBalance[]
  transactions: Transaction[]
  bets: BetRecord[]
  tickets: Ticket[]
  referrals: ReferralEntry[]
  favorites: string[]
  sessions: Session[]
  kyc: KycState
  lastPlayed: Record<string, string>
  /** Активные крипто-адреса и статусы платежей. */
  payments: Record<string, PaymentIntent>
  /** Демо-«крупные выигрыши» для контекстной плашки колоды (§4.4). */
  recentWins: Array<{ slug: string; title: string; amount: number; currency: Currency; at: string }>
}

export interface PaymentIntent {
  id: string
  kind: 'deposit' | 'withdraw'
  currency: Currency
  amount: number
  method: string
  network?: Transaction['network']
  address?: string
  deadline?: string
  createdAt: number
  /** Через сколько мок считает платёж зачисленным. */
  confirmAfterMs: number
  destination?: string
}

function createState(): MockState {
  return {
    user: mockUser(),
    password: 'secret123',
    wallets: mockWallets(),
    transactions: mockTransactions(),
    bets: mockBets(),
    tickets: mockTickets(),
    referrals: mockReferrals(),
    favorites: ['sweet-bonanza', 'wanted-dead-or-a-wild', 'money-train-3'],
    sessions: [
      { id: 's_1', ip: '188.43.12.9', device: 'iPhone 15 · Safari', createdAt: iso(2 * day), lastSeenAt: iso(4 * min), current: true },
      { id: 's_2', ip: '77.240.33.10', device: 'Windows 11 · Chrome', createdAt: iso(9 * day), lastSeenAt: iso(3 * day), current: false },
      { id: 's_3', ip: '92.46.208.4', device: 'Android · Chrome', createdAt: iso(24 * day), lastSeenAt: iso(18 * day), current: false }
    ],
    kyc: {
      status: 'not_started',
      limits: {
        currency: 'RUB',
        withoutVerification: 5000,
        remaining: 1800,
        withVerification: 500000
      }
    },
    lastPlayed: {
      'sweet-bonanza': iso(25 * min),
      'gates-of-olympus': iso(6 * hour),
      'wanted-dead-or-a-wild': iso(2 * day),
      'sun-of-egypt-3': iso(3 * day),
      'money-train-3': iso(4 * day),
      'razor-shark': iso(9 * day)
    },
    payments: {},
    recentWins: [
      { slug: 'sweet-bonanza', title: 'Sweet Bonanza', amount: 4200, currency: 'RUB', at: iso(4 * min) },
      { slug: 'money-train-3', title: 'Money Train 3', amount: 180000, currency: 'KZT', at: iso(9 * min) },
      { slug: 'gates-of-olympus', title: 'Gates of Olympus', amount: 120, currency: 'USDT', at: iso(14 * min) }
    ]
  }
}

/** Единственный инстанс на процесс dev-сервера. */
const globalForMock = globalThis as unknown as { __depkasinoMockState?: MockState }

export function getState(): MockState {
  if (!globalForMock.__depkasinoMockState) globalForMock.__depkasinoMockState = createState()
  return globalForMock.__depkasinoMockState
}

export function resetState(): void {
  globalForMock.__depkasinoMockState = createState()
}

export function touchWallet(currency: Currency, delta: number): WalletBalance {
  const wallets = getState().wallets
  let wallet = wallets.find((w) => w.currency === currency)
  if (!wallet) {
    wallet = { currency, balance: 0, updatedAt: new Date().toISOString() }
    wallets.push(wallet)
  }
  wallet.balance = Math.max(0, Number((wallet.balance + delta).toFixed(8)))
  wallet.updatedAt = new Date().toISOString()
  return wallet
}
