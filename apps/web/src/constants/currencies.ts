import type { Currency, WalletAsset } from '@/types'

/**
 * Валюта релиза. §2.5.
 * Пресеты депозита — только для активной валюты, у BTC пресетов нет.
 */
export const CURRENCY_ASSETS: Record<Currency, WalletAsset> = {
  RUB: {
    currency: 'RUB',
    kind: 'fiat',
    symbol: '₽',
    label: 'руб.',
    headerDecimals: 0,
    walletDecimals: 0,
    step: 100,
    depositPresets: [1000, 2000, 5000, 10000],
    minDeposit: 500,
    minWithdraw: 1000
  },
  UAH: {
    currency: 'UAH',
    kind: 'fiat',
    symbol: '₴',
    label: 'грн',
    headerDecimals: 0,
    walletDecimals: 0,
    step: 100,
    depositPresets: [500, 1000, 2000, 5000],
    minDeposit: 300,
    minWithdraw: 500
  },
  BYN: {
    currency: 'BYN',
    kind: 'fiat',
    symbol: 'Br',
    label: 'бр',
    headerDecimals: 0,
    walletDecimals: 0,
    step: 10,
    depositPresets: [30, 50, 100, 200],
    minDeposit: 20,
    minWithdraw: 30
  },
  KZT: {
    currency: 'KZT',
    kind: 'fiat',
    symbol: '₸',
    label: 'тг',
    headerDecimals: 0,
    walletDecimals: 0,
    step: 1000,
    depositPresets: [5000, 10000, 20000, 50000],
    minDeposit: 2000,
    minWithdraw: 5000
  },
  UZS: {
    currency: 'UZS',
    kind: 'fiat',
    symbol: 'soʻm',
    label: 'сум',
    headerDecimals: 0,
    walletDecimals: 0,
    step: 10000,
    depositPresets: [100000, 200000, 500000, 1000000],
    minDeposit: 50000,
    minWithdraw: 100000
  },
  USDT: {
    currency: 'USDT',
    kind: 'crypto',
    symbol: 'USDT',
    label: 'USDT',
    network: 'TRC20',
    headerDecimals: 2,
    walletDecimals: 2,
    step: 1,
    depositPresets: [20, 50, 100, 200],
    minDeposit: 10,
    minWithdraw: 20
  },
  BTC: {
    currency: 'BTC',
    kind: 'crypto',
    symbol: 'BTC',
    label: 'BTC',
    network: 'BTC',
    headerDecimals: 6,
    walletDecimals: 8,
    step: 0.0001,
    /** Пресетов сумм нет — принимаем фактический входящий платёж. */
    depositPresets: [],
    minDeposit: 0.0002,
    minWithdraw: 0.0005
  }
}

/** Порядок в WalletSwitcher: сначала фиат, затем крипта (§4.1). */
export const FIAT_ORDER: Currency[] = ['RUB', 'UAH', 'BYN', 'KZT', 'UZS']
export const CRYPTO_ORDER: Currency[] = ['USDT', 'BTC']
export const ALL_CURRENCIES: Currency[] = [...FIAT_ORDER, ...CRYPTO_ORDER]

export const CURRENCY_NAMES: Record<Currency, string> = {
  RUB: 'руб.',
  UAH: 'грн',
  BYN: 'бр',
  KZT: 'тг',
  UZS: 'сум',
  USDT: 'USDT',
  BTC: 'BTC'
}

/** Названия стран для профиля (не для выбора кассы — страна кассы = активный кошелёк). */
export const COUNTRY_NAMES: Record<string, string> = {
  RU: 'Россия',
  KZ: 'Казахстан',
  UZ: 'Узбекистан',
  UA: 'Украина',
  BY: 'Беларусь',
  INTL: 'Другое'
}

export const TIMEZONES = [
  'Europe/Moscow',
  'Europe/Kyiv',
  'Europe/Minsk',
  'Asia/Almaty',
  'Asia/Tashkent'
]

export const TICKET_CATEGORY_LABELS = {
  payments: 'Платежи',
  games: 'Игры',
  account: 'Аккаунт',
  other: 'Другое'
} as const

export const TRANSACTION_TYPE_LABELS = {
  deposit: 'Пополнение',
  withdrawal: 'Вывод',
  bet: 'Ставка',
  win: 'Выигрыш',
  referral: 'Реферальный бонус'
} as const

export const TRANSACTION_STATUS_LABELS = {
  pending: 'Ожидает',
  processing: 'В обработке',
  completed: 'Завершено',
  failed: 'Ошибка',
  cancelled: 'Отменено'
} as const

export const TICKET_STATUS_LABELS = {
  open: 'Открыт',
  answered: 'Отвечен',
  closed: 'Закрыт'
} as const

export const KYC_STATUS_LABELS = {
  not_started: 'Не пройдена',
  pending: 'Не завершена',
  on_review: 'На проверке',
  resubmit: 'Нужна повторная отправка',
  rejected: 'Отклонена',
  approved: 'Подтверждена'
} as const

/** Фича-флаги. Бонусного движка в релизе нет (§2.8). */
export const FEATURE_FLAGS = {
  FEATURE_PROMOCODE: false,
  FEATURE_BONUS_PAGE: false,
  FEATURE_WAGERING: false,
  FEATURE_PROMO_SLOT: false
} as const
