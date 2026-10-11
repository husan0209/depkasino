'use client'

import { create } from 'zustand'
import { walletApi } from '@/lib/api'
import { usersApi } from '@/lib/api'
import { readStorage, writeStorage, STORAGE_KEYS } from '@/lib/storage'
import { CRYPTO_ORDER, FIAT_ORDER } from '@/constants/currencies'
import { useAuthStore } from './auth'
import { useGeoStore } from './geo'
import type { Currency, WalletBalance } from '@/types'

/**
 * WalletStore — ядро UI (§17).
 * Хедер читает только активный кошелёк. Смена валюты не перезагружает приложение.
 */

interface WalletStore {
  wallets: WalletBalance[]
  activeCurrency: Currency
  lastPlayedCurrency: Currency | null
  lastPaymentMethod: string | null
  isLoading: boolean

  setActiveCurrency(currency: Currency, options?: { persist?: boolean }): void
  getActiveWallet(): WalletBalance | undefined
  getNonZeroWallets(): WalletBalance[]
  getWallet(currency: Currency): WalletBalance | undefined
  fetchWallets(): Promise<void>
  refreshActive(): Promise<void>
  applyBalanceDelta(currency: Currency, delta: number): void
  setLastPlayedCurrency(currency: Currency): void
  setLastPaymentMethod(methodId: string): void
  reset(): void
}

/**
 * Правило активного кошелька (§2.5):
 * 1. ручной выбор (localStorage) → 2. запись в профиле → 3. последний депозит → 4. ненулевой кошелёк (фиат важнее крипты) → 5. валюта гео.
 */
export function resolveActiveCurrency(
  wallets: WalletBalance[],
  fallback: Currency,
  options: { stored?: Currency | null; profile?: Currency | null; lastDeposit?: Currency | null }
): Currency {
  const has = (currency?: Currency | null) => !!currency && wallets.some((w) => w.currency === currency)
  const { stored, profile, lastDeposit } = options

  if (has(stored)) return stored as Currency
  if (has(profile)) return profile as Currency
  if (has(lastDeposit)) return lastDeposit as Currency

  const byOrder = (order: Currency[]) =>
    order.find((currency) => (wallets.find((w) => w.currency === currency)?.balance ?? 0) > 0)
  const nonZeroFiat = byOrder(FIAT_ORDER)
  if (nonZeroFiat) return nonZeroFiat
  const nonZeroCrypto = byOrder(CRYPTO_ORDER)
  if (nonZeroCrypto) return nonZeroCrypto

  return fallback
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  wallets: [],
  activeCurrency: 'RUB',
  lastPlayedCurrency: null,
  lastPaymentMethod: null,
  isLoading: false,

  setActiveCurrency(currency, options = { persist: true }) {
    set({ activeCurrency: currency })
    if (typeof window !== 'undefined' && options.persist !== false) {
      writeStorage(STORAGE_KEYS.activeCurrency, currency)
      // Выбор пишется в профиль (§2.5 п.5). Не блокируем UI — фоновая запись.
      if (useAuthStore.getState().isAuthenticated) {
        void usersApi.setActiveCurrency(currency).catch(() => undefined)
      } else {
        useGeoStore.getState().setGuestCurrency(currency)
      }
    }
  },

  getActiveWallet() {
    const { wallets, activeCurrency } = get()
    return wallets.find((w) => w.currency === activeCurrency)
  },

  getNonZeroWallets() {
    return get().wallets.filter((w) => w.balance > 0)
  },

  getWallet(currency) {
    return get().wallets.find((w) => w.currency === currency)
  },

  async fetchWallets() {
    const auth = useAuthStore.getState()
    if (!auth.isAuthenticated) return
    set({ isLoading: true })
    try {
      const wallets = await walletApi.list()
      const stored = readStorage(STORAGE_KEYS.activeCurrency) as Currency | null
      const lastPlayedStored = readStorage(STORAGE_KEYS.lastPlayedCurrency) as Currency | null
      const lastPaymentMethod = readStorage(STORAGE_KEYS.lastPaymentMethod)

      const lastDeposit = [...wallets]
        .filter((w) => w.balance > 0 && w.currency !== auth.user?.activeCurrency)
        .map((w) => w.currency)[0]

      const active = resolveActiveCurrency(wallets, useGeoStore.getState().defaultCurrency(), {
        stored,
        profile: (auth.user?.activeCurrency as Currency) ?? null,
        lastDeposit
      })

      set({
        wallets,
        activeCurrency: active,
        lastPlayedCurrency: lastPlayedStored ?? ((auth.user?.lastPlayedCurrency as Currency) ?? null),
        lastPaymentMethod,
        isLoading: false
      })
    } catch {
      set({ isLoading: false })
    }
  },

  async refreshActive() {
    await get().fetchWallets()
  },

  applyBalanceDelta(currency, delta) {
    set((state) => ({
      wallets: state.wallets.map((w) =>
        w.currency === currency
          ? { ...w, balance: Math.max(0, Number((w.balance + delta).toFixed(8))), updatedAt: new Date().toISOString() }
          : w
      )
    }))
  },

  setLastPlayedCurrency(currency) {
    writeStorage(STORAGE_KEYS.lastPlayedCurrency, currency)
    set({ lastPlayedCurrency: currency })
  },

  setLastPaymentMethod(methodId) {
    writeStorage(STORAGE_KEYS.lastPaymentMethod, methodId)
    set({ lastPaymentMethod: methodId })
  },

  reset() {
    set({ wallets: [], isLoading: false, activeCurrency: useGeoStore.getState().defaultCurrency() })
  }
}))
