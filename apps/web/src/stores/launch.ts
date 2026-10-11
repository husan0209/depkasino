'use client'

import { create } from 'zustand'
import type { Currency, Game } from '@/types'

/**
 * Глобальное состояние launch flow (§8.2).
 * Шиты выбора кошелька живут в корне `(main)` layout, поэтому их можно открыть поверх любой страницы и игры.
 */

export type LaunchDecision =
  | { kind: 'login' }
  | { kind: 'play'; currency: Currency }
  | { kind: 'switch'; currency: Currency; supported: Currency[] }
  | { kind: 'deposit'; currency: Currency }
  | { kind: 'unsupported'; currency: Currency; supported: Currency[] }

export interface PendingLaunch {
  game: Game
  decision: LaunchDecision
}

interface LaunchStore {
  pending: PendingLaunch | null
  isLaunching: boolean
  launchingSlug: string | null
  setPending(value: PendingLaunch | null): void
  clearPending(): void
  setLaunching(slug: string | null): void
}

export const useLaunchStore = create<LaunchStore>((set) => ({
  pending: null,
  isLaunching: false,
  launchingSlug: null,
  setPending: (value) => set({ pending: value }),
  clearPending: () => set({ pending: null }),
  setLaunching: (slug) => set({ isLaunching: slug !== null, launchingSlug: slug })
}))
