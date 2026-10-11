'use client'

import { ArrowRight, Ban } from 'lucide-react'
import { Button, CurrencyAmount, Sheet } from '@/components/ui'
import { useLaunchStore } from '@/stores/launch'
import { useUIStore } from '@/stores/ui'
import { useWalletStore } from '@/stores/wallet'
import { useLaunch } from '@/hooks/useLaunch'
import { CURRENCY_ASSETS } from '@/constants/currencies'
import { formatAmount } from '@/lib/format'

/**
 * Шиты launch-контракта (§8.2 п.3 и п.5).
 * «В ₽ пусто. Играть с 8 200 ₸?» — с честным выбором, без тихой конвертации.
 * Рендерятся в корне (main) layout, поэтому открываются поверх игры.
 */
export function LaunchCurrencySheet() {
  const pending = useLaunchStore((state) => state.pending)
  const clearPending = useLaunchStore((state) => state.clearPending)
  const { confirmAlternative, switchQuestion } = useLaunch()
  const openDeposit = useUIStore((state) => state.openDeposit)
  const getWallet = useWalletStore((state) => state.getWallet)

  if (!pending || (pending.decision.kind !== 'switch' && pending.decision.kind !== 'unsupported')) return null

  const { game, decision } = pending
  const activeSymbol = CURRENCY_ASSETS[decision.currency].symbol

  if (decision.kind === 'switch') {
    const alternative = decision.currency
    return (
      <Sheet open onClose={clearPending} title={switchQuestion(decision.currency, alternative)}>
        <div className="space-y-3">
          <div className="rounded-2xl border border-line bg-bg-secondary/60 p-4 text-sm text-ink-muted">
            <p className="text-white">{game.title}</p>
            <p className="mt-1">
              Игра принимает: {decision.supported.map((c) => CURRENCY_ASSETS[c].symbol).join(' · ')}
            </p>
          </div>

          <Button
            variant="primary"
            fullWidth
            size="lg"
            rightIcon={<ArrowRight className="h-4 w-4" />}
            onClick={() => confirmAlternative(game, alternative)}
          >
            Играть в {CURRENCY_ASSETS[alternative].symbol}
          </Button>

          <Button
            variant="money"
            fullWidth
            onClick={() => {
              clearPending()
              openDeposit(decision.currency)
            }}
          >
            Пополнить {activeSymbol}
          </Button>
        </div>
      </Sheet>
    )
  }

  const suggested = decision.supported.find((currency) => (getWallet(currency)?.balance ?? 0) > 0)

  return (
    <Sheet open onClose={clearPending} title="Валюта не поддерживается">
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4">
          <Ban className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-ink-muted">
            {game.title} не принимает {activeSymbol}. Конвертации нет — сыграйте с другого кошелька или выберите другую игру.
          </p>
        </div>

        <p className="text-xs text-ink-muted">
          Игра принимает: {decision.supported.map((c) => CURRENCY_ASSETS[c].symbol).join(' · ')}
        </p>

        {suggested && (
          <Button variant="primary" fullWidth size="lg" onClick={() => confirmAlternative(game, suggested)}>
            Играть с {formatAmount(getWallet(suggested)?.balance ?? 0, suggested, { context: 'wallet' })}
          </Button>
        )}
        <Button variant="secondary" fullWidth onClick={clearPending}>
          Другая игра
        </Button>
      </div>
    </Sheet>
  )
}

/** Короткий шит «на кошельке пусто» — ведёт в кассу, а не на отдельную страницу. */
export function EmptyWalletSheet() {
  const pending = useLaunchStore((state) => state.pending)
  const clearPending = useLaunchStore((state) => state.clearPending)
  const openDeposit = useUIStore((state) => state.openDeposit)
  const wallet = useWalletStore((state) => state.getWallet(state.activeCurrency))

  if (!pending || pending.decision.kind !== 'deposit') return null

  return (
    <Sheet
      open
      onClose={clearPending}
      title={`Пополнить ${CURRENCY_ASSETS[pending.decision.currency].symbol}`}
      subtitle={`${pending.game.title} ждёт`}
    >
      <div className="space-y-3">
        <p className="text-sm text-ink-muted">
          На активном кошельке пусто. Пополним — и сразу вернёмся в игру.
        </p>
        <Button
          variant="money"
          fullWidth
          size="lg"
          onClick={() => {
            const currency = pending.decision.kind === 'deposit' ? pending.decision.currency : undefined
            clearPending()
            openDeposit(currency)
          }}
        >
          Пополнить
        </Button>
        <p className="text-center text-2xs text-ink-dim">
          Баланс: <CurrencyAmount amount={wallet?.balance ?? 0} currency={wallet?.currency ?? 'RUB'} context="wallet" />
        </p>
      </div>
    </Sheet>
  )
}
