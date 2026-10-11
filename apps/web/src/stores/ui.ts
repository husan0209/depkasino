'use client'

import { create } from 'zustand'
import type { Currency } from '@/types'

/**
 * UIStore (§17). Модалки логина, депозита, вывода и switcher кошельков живут в корне `(main)` layout,
 * поэтому переживают смену роута и открываются поверх игры.
 */

interface UIStore {
  loginSheet: boolean
  depositSheet: boolean
  withdrawSheet: boolean
  walletSwitcher: boolean
  gamePreviewSlug: string | null
  depositCurrency?: Currency
  withdrawCurrency?: Currency
  /** Куда вернуться после успешного логина (продолжение launch). */
  pendingAction: string | null
  searchOpen: boolean

  openLogin(pendingAction?: string): void
  closeLogin(): void
  openDeposit(currency?: Currency): void
  closeDeposit(): void
  openWithdraw(currency?: Currency): void
  closeWithdraw(): void
  openWalletSwitcher(): void
  closeWalletSwitcher(): void
  openGamePreview(slug: string): void
  closeGamePreview(): void
  consumePendingAction(): string | null
  setSearchOpen(open: boolean): void
}

export const useUIStore = create<UIStore>((set, get) => ({
  loginSheet: false,
  depositSheet: false,
  withdrawSheet: false,
  walletSwitcher: false,
  gamePreviewSlug: null,
  depositCurrency: undefined,
  withdrawCurrency: undefined,
  pendingAction: null,
  searchOpen: false,

  openLogin(pendingAction) {
    set({ loginSheet: true, pendingAction: pendingAction ?? null })
  },
  closeLogin() {
    set({ loginSheet: false })
  },
  openDeposit(currency) {
    set({ depositSheet: true, depositCurrency: currency, walletSwitcher: false, gamePreviewSlug: null })
  },
  closeDeposit() {
    set({ depositSheet: false, depositCurrency: undefined })
  },
  openWithdraw(currency) {
    set({ withdrawSheet: true, withdrawCurrency: currency, walletSwitcher: false })
  },
  closeWithdraw() {
    set({ withdrawSheet: false, withdrawCurrency: undefined })
  },
  openWalletSwitcher() {
    set({ walletSwitcher: true })
  },
  closeWalletSwitcher() {
    set({ walletSwitcher: false })
  },
  openGamePreview(slug) {
    set({ gamePreviewSlug: slug })
  },
  closeGamePreview() {
    set({ gamePreviewSlug: null })
  },
  consumePendingAction() {
    const action = get().pendingAction
    set({ pendingAction: null })
    return action
  },
  setSearchOpen(open) {
    set({ searchOpen: open })
  }
}))
