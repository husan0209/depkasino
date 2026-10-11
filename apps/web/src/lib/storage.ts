/** Безопасный доступ к localStorage: SSR-safe и терпимый к приватному режиму. */
export const STORAGE_KEYS = {
  activeCurrency: 'dk_active_currency',
  lastPlayedCurrency: 'dk_last_played_currency',
  lastPaymentMethod: 'dk_last_payment_method',
  recentSearches: 'dk_recent_searches',
  guestCurrency: 'dk_guest_currency'
} as const

export function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    /* приватный режим — молча игнорируем */
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = readStorage(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  writeStorage(key, JSON.stringify(value))
}
