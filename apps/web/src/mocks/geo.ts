import type { GeoConfig, LegalCountry, PaymentMethod } from '@/types'

/**
 * GeoConfig (§2.6). Один фронт, страновые зеркала отличаются hostname.
 * IP задаёт дефолтную валюту и набор методов только для гостя и нового пользователя.
 */

const method = (m: Omit<PaymentMethod, 'available'>): PaymentMethod => ({ available: true, ...m })

/** Методы по странам. RU и UA методы никогда не попадают в один список. */
const METHODS_BY_COUNTRY: Record<LegalCountry, PaymentMethod[]> = {
  RU: [
    method({ id: 'sbp', name: 'СБП', kind: 'fiat', currency: 'RUB', network: 'SBP', icon: 'СБП', etaLabel: 'обычно за 1 минуту', min: 500, max: 300000 }),
    method({ id: 'card-ru', name: 'Карта', kind: 'fiat', currency: 'RUB', network: 'CARD', icon: 'CARD', etaLabel: 'обычно за 2 минуты', min: 500, max: 150000 }),
    method({ id: 'p2p-ru', name: 'P2P', kind: 'fiat', currency: 'RUB', network: 'P2P', icon: 'P2P', etaLabel: '5–15 минут', min: 1000, max: 200000 })
  ],
  KZ: [
    method({ id: 'kaspi', name: 'Kaspi', kind: 'fiat', currency: 'KZT', network: 'CARD', icon: 'KSP', etaLabel: 'обычно за 1 минуту', min: 2000, max: 3000000 }),
    method({ id: 'card-kz', name: 'Карта', kind: 'fiat', currency: 'KZT', network: 'CARD', icon: 'CARD', etaLabel: 'обычно за 2 минуты', min: 2000, max: 2000000 }),
    method({ id: 'p2p-kz', name: 'P2P', kind: 'fiat', currency: 'KZT', network: 'P2P', icon: 'P2P', etaLabel: '5–15 минут', min: 5000, max: 1500000 })
  ],
  UZ: [
    method({ id: 'payme', name: 'Payme', kind: 'fiat', currency: 'UZS', network: 'CARD', icon: 'PME', etaLabel: 'обычно за 1 минуту', min: 50000, max: 20000000 }),
    method({ id: 'click', name: 'Click', kind: 'fiat', currency: 'UZS', network: 'CARD', icon: 'CLK', etaLabel: 'обычно за 1 минуту', min: 50000, max: 20000000 }),
    method({ id: 'card-uz', name: 'Карта', kind: 'fiat', currency: 'UZS', network: 'CARD', icon: 'CARD', etaLabel: 'обычно за 2 минуты', min: 50000, max: 10000000 })
  ],
  UA: [
    method({ id: 'card-ua', name: 'Карта', kind: 'fiat', currency: 'UAH', network: 'CARD', icon: 'CARD', etaLabel: 'обычно за 2 минуты', min: 300, max: 100000 }),
    method({ id: 'p2p-ua', name: 'P2P', kind: 'fiat', currency: 'UAH', network: 'P2P', icon: 'P2P', etaLabel: '5–15 минут', min: 500, max: 80000 })
  ],
  BY: [
    method({ id: 'card-by', name: 'Карта', kind: 'fiat', currency: 'BYN', network: 'CARD', icon: 'CARD', etaLabel: 'обычно за 2 минуты', min: 20, max: 5000 }),
    method({ id: 'erip', name: 'ЕРИП', kind: 'fiat', currency: 'BYN', network: 'CARD', icon: 'ЕРП', etaLabel: 'до 15 минут', min: 20, max: 3000 })
  ],
  INTL: [
    method({ id: 'card-intl', name: 'Карта', kind: 'fiat', currency: 'RUB', network: 'CARD', icon: 'CARD', etaLabel: 'обычно за 2 минуты', min: 500, max: 300000 }),
    method({ id: 'p2p-intl', name: 'P2P', kind: 'fiat', currency: 'RUB', network: 'P2P', icon: 'P2P', etaLabel: '5–15 минут', min: 1000, max: 200000 })
  ]
}

/** Крипта — всегда во втором рельсе: при активном фиате живёт в «Ещё способы» (§2.7). */
export const CRYPTO_METHODS: PaymentMethod[] = [
  method({ id: 'usdt-trc20', name: 'USDT TRC20', kind: 'crypto', currency: 'USDT', network: 'TRC20', icon: 'USDT', etaLabel: 'после 1 подтверждения сети', min: 10, max: 100000 }),
  method({ id: 'btc', name: 'BTC', kind: 'crypto', currency: 'BTC', network: 'BTC', icon: 'BTC', etaLabel: 'после 1 подтверждения сети', min: 0.0002, max: 10 })
]

const HOSTS: Array<{ match: RegExp; config: Omit<GeoConfig, 'hostname' | 'paymentMethods'> }> = [
  { match: /(^|\.)kz\./i, config: { defaultCurrency: 'KZT', enabledFiat: ['KZT'], enabledCrypto: ['USDT_TRC20', 'BTC'], legalCountry: 'KZ' } },
  { match: /(^|\.)uz\./i, config: { defaultCurrency: 'UZS', enabledFiat: ['UZS'], enabledCrypto: ['USDT_TRC20', 'BTC'], legalCountry: 'UZ' } },
  { match: /(^|\.)ua\./i, config: { defaultCurrency: 'UAH', enabledFiat: ['UAH'], enabledCrypto: ['USDT_TRC20', 'BTC'], legalCountry: 'UA' } },
  { match: /(^|\.)by\./i, config: { defaultCurrency: 'BYN', enabledFiat: ['BYN'], enabledCrypto: ['USDT_TRC20', 'BTC'], legalCountry: 'BY' } },
  { match: /(^|\.)intl\./i, config: { defaultCurrency: 'RUB', enabledFiat: ['RUB', 'UAH', 'KZT', 'UZS', 'BYN'], enabledCrypto: ['USDT_TRC20', 'BTC'], legalCountry: 'INTL' } }
]

/** Дефолт для localhost/dev-превью — RU: СБП, карта, P2P. */
function detectCountry(hostname: string): LegalCountry {
  if (!hostname) return 'RU'
  const found = HOSTS.find((h) => h.match.test(hostname))
  return found ? (found.config.legalCountry as LegalCountry) : 'RU'
}

export function resolveGeo(hostname: string): GeoConfig {
  const legalCountry = detectCountry(hostname)
  const base =
    HOSTS.find((h) => h.config.legalCountry === legalCountry)?.config ?? {
      defaultCurrency: 'RUB' as const,
      enabledFiat: ['RUB', 'UAH', 'BYN', 'KZT', 'UZS'] as GeoConfig['enabledFiat'],
      enabledCrypto: ['USDT_TRC20', 'BTC'] as GeoConfig['enabledCrypto'],
      legalCountry: 'RU' as const
    }
  return {
    hostname: hostname || 'localhost',
    ...base,
    paymentMethods: METHODS_BY_COUNTRY[legalCountry]
  }
}

/**
 * Методы для кассы: режутся по гео и активной валюте.
 * Активен фиат → локальная касса; крипта доступна только через «Ещё способы».
 */
export function methodsForCurrency(geo: GeoConfig, currency: string): { primary: PaymentMethod[]; extra: PaymentMethod[] } {
  const primary = geo.paymentMethods.filter((m) => m.currency === currency)
  const crypto = CRYPTO_METHODS.filter((m) => m.currency === currency)
  if (primary.length > 0) return { primary, extra: CRYPTO_METHODS }
  if (crypto.length > 0) return { primary: crypto, extra: [] }
  return { primary: [], extra: [] }
}
