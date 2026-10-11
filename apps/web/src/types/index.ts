/**
 * Типы Части 5. Источник истины по валютам, кошелькам, играм, платежам.
 * Поля, зарезервированные под будущие части (бонусы, live, crash) помечены — их не удалять.
 */

/* ────────────────────────────── Деньги ────────────────────────────── */

/** Игровые фиаты релиза. Беларусь — только BYN. */
export type FiatCurrency = 'RUB' | 'UAH' | 'BYN' | 'KZT' | 'UZS'

/** Крипта релиза: только эти два рельса. */
export type CryptoCurrency = 'USDT' | 'BTC'

export type Currency = FiatCurrency | CryptoCurrency

/** Платёжная сеть. Сеть видна в UI всегда. */
export type PaymentNetwork = 'TRC20' | 'BTC' | 'SBP' | 'CARD' | 'P2P'

export type WalletKind = 'fiat' | 'crypto'

export interface WalletAsset {
  currency: Currency
  kind: WalletKind
  /** Символ для UI: ₽, ₴, Br, ₸, soʻm, USDT, BTC */
  symbol: string
  /** Как называть игроку: «руб.», «грн», «сум» … */
  label: string
  /** Сеть, если крипта. В фиате отсутствует. */
  network?: PaymentNetwork
  /** Знаков после запятой в шапке */
  headerDecimals: number
  /** Знаков после запятой в кошельке и истории */
  walletDecimals: number
  /** Шаг маски AmountInput */
  step: number
  /** Пресеты депозита. У BTC пресетов нет (§2.5). */
  depositPresets: number[]
  /** Минимум депозита */
  minDeposit: number
  /** Минимум вывода */
  minWithdraw: number
}

export interface WalletBalance {
  currency: Currency
  balance: number
  network?: PaymentNetwork
  /** Зарезервировано Частью 5 §2.8. В релизе не рисуется. */
  bonusBalance?: number
  updatedAt: string
}

/* ────────────────────────────── Игры ────────────────────────────── */

export type GameBadge = 'NEW' | 'HOT'

export type GameCategory = 'slots' | 'new' | 'popular'

export type GameSort = 'popular' | 'new' | 'az'

export interface Provider {
  slug: string
  name: string
  /** Цветной тайл-логотип вместо серых буквенных иконок. */
  brandColor: string
  gamesCount: number
  /** Валюты, которые принимает провайдер. Кросс-валютная игра запрещена. */
  currencies: Currency[]
}

export interface Game {
  slug: string
  title: string
  provider: { slug: string; name: string }
  cover: string
  /** Один бейдж на карточку, не оба. */
  badge?: GameBadge
  categories: GameCategory[]
  rtp: number
  volatility: 'low' | 'medium' | 'high'
  minBet: number
  /** Валюта минимальной ставки (для отображения «мин. ставка» на превью). */
  minBetCurrency: Currency
  currencies: Currency[]
  hasDemo: boolean
  releasedAt: string
  /** Рекомендуемый тег-причина для колоды GameDeck (§4.4). */
  deckReason?: 'Хайп' | 'Новинка' | 'Твоё избранное' | 'Продолжи'
}

export interface GameFilters {
  q?: string
  category?: GameCategory | 'all'
  provider?: string
  sort?: GameSort
  favoritesOnly?: boolean
  page?: number
  pageSize?: number
  /** Колода GameDeck запрашивает персональный порядок карт (§4.4). */
  deck?: boolean
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

/* ────────────────────────────── Пользователь ────────────────────────────── */

export type KycStatus = 'not_started' | 'pending' | 'on_review' | 'resubmit' | 'rejected' | 'approved'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  birthDate?: string
  country?: string
  city?: string
  avatarUrl?: string
  kycStatus: KycStatus
  /** Статус, блокирующий вывод — KYC-пункт показывается только тогда (§2 правило 9). */
  withdrawalBlockedByKyc: boolean
  referralCode: string
  createdAt: string
  emailVerified: boolean
  /** Последний выбранный кошелёк (§2.5). */
  activeCurrency?: Currency
  lastPlayedCurrency?: Currency
  settings: UserSettings
}

export interface UserSettings {
  emailNotifications: boolean
  timezone: string
}

export interface Session {
  id: string
  ip: string
  device: string
  createdAt: string
  lastSeenAt: string
  current: boolean
}

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterPayload {
  email: string
  password: string
  terms: boolean
  ref?: string
  /** Кошелёк создаём в валюте, которую гость уже выбрал (или дефолт его гео). */
  currency?: Currency
}

/* ────────────────────────────── Платежи ────────────────────────────── */

export type PaymentMethodKind = 'fiat' | 'crypto'

export interface PaymentMethod {
  id: string
  /** «СБП», «Карта», «P2P», «USDT TRC20», «BTC» */
  name: string
  kind: PaymentMethodKind
  currency?: Currency
  network?: PaymentNetwork
  /** Иконка: инициалы/символ, рисуется тайлом. */
  icon: string
  min?: number
  max?: number
  /** Сколько обычно идёт зачисление — микрокоп доверия. */
  etaLabel: string
  available: boolean
}

export type TransactionType = 'deposit' | 'withdrawal' | 'bet' | 'win' | 'referral'
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface Transaction {
  id: string
  type: TransactionType
  status: TransactionStatus
  amount: number
  currency: Currency
  createdAt: string
  method?: string
  network?: PaymentNetwork
  provider?: string
  /** Курс показывается, только если реально фиксировался (крипто-платёж). */
  rate?: number
  destination?: string
  comment?: string
}

/* ────────────────────────────── История ставок ────────────────────────────── */

export interface BetRecord {
  id: string
  game: { slug: string; title: string }
  provider: { slug: string; name: string }
  bet: number
  win: number
  currency: Currency
  createdAt: string
}

export interface BetHistorySummary {
  bets: number
  /** Разбивка по кошелькам — ₽ и ₸ не суммируются (§12). */
  perCurrency: Array<{ currency: Currency; turnover: number; wins: number }>
}

/* ────────────────────────────── KYC ────────────────────────────── */

export interface KycLimits {
  currency: Currency
  /** Лимит пополнения без верификации */
  withoutVerification: number
  /** Остаток лимита без верификации */
  remaining: number
  /** Лимит с верификацией */
  withVerification: number
}

export interface KycState {
  status: KycStatus
  reason?: string
  submittedAt?: string
  limits: KycLimits
}

/* ────────────────────────────── Поддержка ────────────────────────────── */

export type TicketStatus = 'open' | 'answered' | 'closed'
export type TicketCategory = 'payments' | 'games' | 'account' | 'other'

export interface TicketAttachment {
  id: string
  name: string
  url: string
}

export interface TicketMessage {
  id: string
  author: 'user' | 'support'
  text: string
  createdAt: string
  attachments?: TicketAttachment[]
}

export interface Ticket {
  id: string
  subject: string
  category: TicketCategory
  status: TicketStatus
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
}

/* ────────────────────────────── Рефералы ────────────────────────────── */

export interface ReferralStats {
  total: number
  active: number
  earned: Record<string, number>
  available: Record<string, number>
}

export interface ReferralEntry {
  id: string
  /** Email маскируется — полный не показываем (§14). */
  maskedEmail: string
  joinedAt: string
  currency: Currency
  amount: number
}

/* ────────────────────────────── Игровая сессия ────────────────────────────── */

export type LaunchErrorCode =
  | 'region_unavailable'
  | 'provider_timeout'
  | 'session_already_open'
  | 'insufficient_funds'
  | 'currency_not_supported'
  | 'maintenance'
  | 'not_authenticated'

export interface LaunchResult {
  url: string
  sessionId: string
  currency: Currency
}

export interface LaunchError {
  code: LaunchErrorCode
  message: string
}

/* ────────────────────────────── Гео ────────────────────────────── */

export type LegalCountry = 'RU' | 'KZ' | 'UZ' | 'UA' | 'BY' | 'INTL'

export interface GeoConfig {
  hostname: string
  defaultCurrency: FiatCurrency
  enabledFiat: FiatCurrency[]
  enabledCrypto: Array<'USDT_TRC20' | 'BTC'>
  paymentMethods: PaymentMethod[]
  legalCountry: LegalCountry
}

/* ────────────────────────────── Прочее ────────────────────────────── */

export interface ApiErrorShape {
  code: string
  message: string
  status?: number
  details?: Record<string, string[]>
}
