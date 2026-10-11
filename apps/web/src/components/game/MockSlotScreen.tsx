'use client'

import { useCallback, useMemo, useState } from 'react'
import { Minus, Plus, RotateCcw, Sparkles } from 'lucide-react'
import { Button, CurrencyAmount } from '@/components/ui'
import { useWalletStore } from '@/stores/wallet'
import { CURRENCY_ASSETS } from '@/constants/currencies'
import { formatAmount } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Currency } from '@/types'

/**
 * Заглушка игрового экрана для мок-режима.
 * Имитирует поведение провайдерского iframe: списывает ставку, начисляет выигрыш,
 * отдаёт дельту в WalletStore — в live-режиме здесь стоит iframe провайдера.
 */

/** Глифы-символы без эмодзи: мок рисует поле, но не притворяется артом провайдера. */
const SYMBOLS = [
  { glyph: '◆', className: 'text-accent-secondary' },
  { glyph: '●', className: 'text-warning' },
  { glyph: '★', className: 'text-accent' },
  { glyph: '♦', className: 'text-money' },
  { glyph: '✦', className: 'text-danger' },
  { glyph: '⬢', className: 'text-ink-muted' }
] as const

const REELS = 3
const ROWS = 3

function randomGrid(): number[][] {
  return Array.from({ length: REELS }, () =>
    Array.from({ length: ROWS }, () => Math.floor(Math.random() * SYMBOLS.length))
  )
}

export function MockSlotScreen({
  currency,
  demo,
  slug,
  balance
}: {
  currency: Currency
  demo: boolean
  slug: string
  balance: number
}) {
  const applyBalanceDelta = useWalletStore((state) => state.applyBalanceDelta)
  const asset = CURRENCY_ASSETS[currency]

  const [grid, setGrid] = useState<number[][]>(randomGrid)
  const [bet, setBet] = useState(() => (asset.kind === 'crypto' ? asset.minDeposit : Math.max(asset.minDeposit, 10)))
  const [spinning, setSpinning] = useState(false)
  const [lastWin, setLastWin] = useState<number | null>(null)
  const [demoBalance, setDemoBalance] = useState(10_000)

  const displayBalance = demo ? demoBalance : balance
  const canSpin = !spinning && (demo ? demoBalance >= bet : balance >= bet)

  const spin = useCallback(() => {
    if (!canSpin) return
    setSpinning(true)
    setLastWin(null)

    const roll = Math.random()
    const multiplier = roll > 0.96 ? 25 : roll > 0.8 ? 3.2 : roll > 0.55 ? 1.4 : 0
    const win = multiplier > 0 ? Number((bet * multiplier).toFixed(asset.kind === 'crypto' ? 8 : 2)) : 0

    setTimeout(() => {
      setGrid(randomGrid())
      if (demo) {
        setDemoBalance((value) => Math.max(0, Number((value - bet + win).toFixed(8))))
      } else {
        applyBalanceDelta(currency, -bet)
        if (win > 0) applyBalanceDelta(currency, win)
      }
      setLastWin(win)
      setSpinning(false)
    }, 700)
  }, [applyBalanceDelta, asset.kind, bet, canSpin, currency, demo])

  const adjustBet = (direction: 1 | -1) => {
    const step = asset.kind === 'crypto' ? asset.step : Math.max(asset.step / 10, 10)
    setBet((value) => Math.max(asset.minDeposit, Number((value + direction * step).toFixed(8))))
  }

  const hitLine = useMemo(
    () => grid[0].filter((symbol, rowIndex) => grid.every((column) => column[rowIndex] === symbol)).length,
    [grid]
  )

  return (
    <div className="flex h-full flex-col items-center justify-between bg-gradient-to-b from-[#141026] to-[#0B0B16] px-4 py-5">
      <div className="text-center">
        <p className="section-label">Игровое поле</p>
        <p className="mt-1 text-xs text-ink-muted">
          Мок-режим: разметка игры повторяет боевой экран, сам слот подключается в live-кассе провайдера.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-line bg-bg-card/80 p-3 shadow-card">
          <div className="grid grid-cols-3 gap-2">
            {grid.map((column, columnIndex) => (
              <div key={columnIndex} className="flex flex-col gap-2">
                {column.map((symbolIndex, rowIndex) => {
                  const symbol = SYMBOLS[symbolIndex]
                  return (
                    <div
                      key={`${columnIndex}-${rowIndex}`}
                      className={cn(
                        'flex aspect-square items-center justify-center rounded-xl border border-line/70 bg-bg-secondary text-2xl transition-transform',
                        spinning && 'animate-pulse',
                        !spinning && hitLine > 0 && 'border-money/50'
                      )}
                    >
                      <span className={symbol.className}>{symbol.glyph}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-3 text-center">
          {lastWin === null ? (
            <p className="text-xs text-ink-muted">Крутите — выигрыш придёт в {asset.symbol}</p>
          ) : lastWin > 0 ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-money">
              <Sparkles className="h-4 w-4" />
              Выигрыш <CurrencyAmount amount={lastWin} currency={currency} context="wallet" />
            </p>
          ) : (
            <p className="text-xs text-ink-muted">Не в этот раз — ставка ушла, барабаны готовы</p>
          )}
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-line bg-bg-secondary/60 px-3 py-2">
          <span className="text-xs text-ink-muted">Ваша ставка</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustBet(-1)}
              aria-label="Уменьшить ставку"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-ink-muted hover:text-white"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="money-tabular min-w-[76px] text-center text-sm font-semibold text-white">
              {formatAmount(bet, currency, { context: 'wallet' })}
            </span>
            <button
              type="button"
              onClick={() => adjustBet(1)}
              aria-label="Увеличить ставку"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-ink-muted hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={spinning}
          disabled={!canSpin}
          onClick={spin}
          leftIcon={<RotateCcw className="h-4 w-4" />}
        >
          Крутить
        </Button>

        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>{demo ? 'Демо-баланс' : 'Баланс игры'}</span>
          <span className="money-tabular font-semibold text-white">
            <CurrencyAmount amount={displayBalance} currency={currency} context="header" />
          </span>
        </div>
        <p className="text-center text-2xs text-ink-dim">Игра: {slug}</p>
      </div>
    </div>
  )
}
