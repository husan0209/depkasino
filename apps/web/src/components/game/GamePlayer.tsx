'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { Button, CurrencyAmount, Spinner } from '@/components/ui'
import { MockSlotScreen } from './MockSlotScreen'
import { useWalletStore } from '@/stores/wallet'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { CURRENCY_ASSETS } from '@/constants/currencies'
import { cn } from '@/lib/cn'
import type { Currency } from '@/types'

/**
 * Игровой экран (§8.3): тонкая планка «× · баланс · +» и область игры.
 * Касса открывается ПОВЕРХ игры, после депозита — «Вернуться в игру».
 * Баланс на планке живой: refetch по фокусу и после закрытия кассы.
 */
export function GamePlayer({
  gameTitle,
  gameSlug,
  currency,
  demo,
  remoteUrl
}: {
  gameTitle: string
  gameSlug: string
  currency: Currency
  demo: boolean
  remoteUrl?: string
}) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const activeCurrency = useWalletStore((state) => state.activeCurrency)
  const wallet = useWalletStore((state) => state.getWallet(currency))
  const refreshActive = useWalletStore((state) => state.refreshActive)
  const depositOpen = useUIStore((state) => state.depositSheet)
  const openDeposit = useUIStore((state) => state.openDeposit)

  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const previousBalance = useRef(wallet?.balance ?? 0)
  const [showReturn, setShowReturn] = useState(false)

  // Вспышка баланса при плюсе/минусе (§16.2).
  useEffect(() => {
    const balance = wallet?.balance ?? 0
    if (balance > previousBalance.current) setFlash('up')
    else if (balance < previousBalance.current) setFlash('down')
    previousBalance.current = balance
    const timer = setTimeout(() => setFlash(null), 900)
    return () => clearTimeout(timer)
  }, [wallet?.balance])

  // После закрытия кассы обновляем конкретный кошелёк и предлагаем вернуться в игру.
  // Тост показываем только тем, кто кассу открывал (иначе он висел бы с первого кадра).
  const depositWasOpen = useRef(false)
  useEffect(() => {
    if (depositOpen) {
      depositWasOpen.current = true
      return
    }
    if (!depositWasOpen.current) return
    depositWasOpen.current = false
    void refreshActive()
    setShowReturn(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depositOpen])

  const closeGame = useCallback(() => {
    void refreshActive()
    router.push(`/casino/${gameSlug}`)
  }, [gameSlug, refreshActive, router])

  const balance = wallet?.balance ?? 0

  return (
    <div className="relative flex h-dvh flex-col bg-bg-primary">
      <div className="game-topbar">
        <button
          type="button"
          onClick={closeGame}
          aria-label="Закрыть игру"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-ink-muted transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-col items-center">
          <span className="truncate text-xs text-ink-muted">{gameTitle}</span>
          <span
            className={cn(
              'money-tabular text-base font-semibold text-white',
              flash === 'up' && 'animate-balance-up',
              flash === 'down' && 'animate-balance-down'
            )}
          >
            <CurrencyAmount amount={balance} currency={currency} context="header" />
          </span>
        </div>

        <button
          type="button"
          onClick={() => openDeposit(currency)}
          aria-label="Пополнить"
          className="flex h-9 items-center gap-1 rounded-xl bg-money px-3 text-sm font-semibold text-[#04220F]"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Пополнить</span>
        </button>
      </div>

      {demo && (
        <p className="bg-warning/10 px-4 py-1.5 text-center text-2xs text-warning">
          Демо-режим · ставки не настоящие
        </p>
      )}

      <div className="relative flex-1 overflow-hidden">
        {remoteUrl ? (
          <iframe
            src={remoteUrl}
            title={gameTitle}
            allow="fullscreen; clipboard-write"
            className="h-full w-full border-0 bg-black"
          />
        ) : (
          <MockSlotScreen currency={currency} demo={demo} slug={gameSlug} balance={balance} />
        )}
      </div>

      {showReturn && !depositOpen && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <div className="pointer-events-auto animate-rise-in rounded-2xl border border-line bg-bg-elevated/95 px-4 py-3 shadow-card backdrop-blur">
            <p className="text-xs text-ink-muted">Баланс обновлён</p>
            <Button size="sm" className="mt-2" onClick={() => setShowReturn(false)}>
              Вернуться в игру
            </Button>
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="pointer-events-auto rounded-2xl border border-line bg-bg-elevated p-5 text-center">
            <Spinner className="mx-auto text-accent" />
            <p className="mt-3 text-sm text-ink-muted">Открываем вход…</p>
          </div>
        </div>
      )}

      {activeCurrency !== currency && !demo && (
        <p className="px-4 py-1 text-center text-2xs text-ink-dim">
          Игра идёт в {CURRENCY_ASSETS[currency].symbol} · активный кошелёк: {activeCurrency}
        </p>
      )}
    </div>
  )
}
