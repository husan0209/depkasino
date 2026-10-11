'use client'

import { create } from 'zustand'
import { geoApi } from '@/lib/api'
import { resolveGeo } from '@/mocks/geo'
import { readStorage, writeStorage, STORAGE_KEYS } from '@/lib/storage'
import { ALL_CURRENCIES } from '@/constants/currencies'
import type { Currency, GeoConfig, PaymentMethod } from '@/types'

interface GeoStore {
  geo: GeoConfig | null
  /** Гость выбрал валюту вручную — помним до логина (§2.5 п.4-5). */
  guestCurrency: Currency | null
  isLoading: boolean
  fetchGeo(): Promise<void>
  setGuestCurrency(currency: Currency): void
  defaultCurrency(): Currency
  /** Методы режутся по гео и активной валюте (§2.6 п.5: RU и UA методы не в одном списке). */
  availableFiatMethods(currency: Currency): PaymentMethod[]
}

export const useGeoStore = create<GeoStore>((set, get) => ({
  geo: null,
  guestCurrency: null,
  isLoading: false,

  async fetchGeo() {
    set({ isLoading: true })
    try {
      const geo = await geoApi.get()
      const stored = readStorage(STORAGE_KEYS.guestCurrency) as Currency | null
      set({ geo, guestCurrency: stored ?? null, isLoading: false })
    } catch {
      // Мок-фолбэк: если API недоступен, определяем гео по hostname на клиенте.
      const fallback = resolveGeo(typeof window === 'undefined' ? 'localhost' : window.location.hostname)
      set({ geo: fallback, isLoading: false })
    }
  },

  setGuestCurrency(currency) {
    writeStorage(STORAGE_KEYS.guestCurrency, currency)
    set({ guestCurrency: currency })
  },

  defaultCurrency() {
    const { geo, guestCurrency } = get()
    if (guestCurrency) return guestCurrency
    if (!geo) return 'RUB'
    if (ALL_CURRENCIES.includes(geo.defaultCurrency)) return geo.defaultCurrency
    return 'RUB'
  },

  availableFiatMethods(currency) {
    const { geo } = get()
    if (!geo) return []
    return geo.paymentMethods.filter((m) => m.currency === currency)
  }
}))
