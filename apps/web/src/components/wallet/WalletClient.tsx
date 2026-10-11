'use client'

import Link from 'next/link'
import { Building2, Check, Coins, Info } from 'lucide-react'
import { Button, CurrencyAmount, NetworkTag, Skeleton, Tooltip } from '@/components/ui'
import { TransactionRow } from './TransactionRow'
import { useWalletStore } from '@/stores/wallet'
import { useUIStore } from '@/stores/ui'
import { useTransactions } from '@/hooks/useWalletData'
import { CURRENCY_NAMES, CRYPTO_ORDER, FIAT_ORDER } from '@/constants/currencies'
import { cn } from '@/lib/cn'
import type { Currency, WalletBalance } from '@/types'

/**
 * /wallet — страница доверия (§5.1 директив). Деньги делаются в шитах,
 * но здесь игрок видит все кошельки, последние операции и правило «без конвертации».
 */
export function WalletClient() {
  const wallets = useWalletStore((state) => state.wallets)
  const isLoading = useWalletStore((state) => state.isLoading)
  const activeCurrency = useWalletStore((state) => state.activeCurrency)
  const setActiveCurrency = useWalletStore((state) => state.setActiveCurrency)
  const openDeposit = useUIStore((state) => state.openDeposit)
  const openWithdraw = useUIStore((state) => state.openWithdraw)

  const { data: transactions, isLoading: transactionsLoading } = useTransactions({ currency: activeCurrency, page: 1, pageSize: 5 })
  const active = wallets.find((wallet) => wallet.currency === activeCurrency)

  if (isLoading && wallets.length === 0) {
    return (
      <div className="container-page mt-6 space-y-4">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    )
  }

  const fiat = FIAT_ORDER.map((currency) => wallets.find((wallet) => wallet.currency === currency)).filter(
    (wallet): wallet is WalletBalance => !!wallet
  )
  const crypto = CRYPTO_ORDER.map((currency) => wallets.find((wallet) => wallet.currency === currency)).filter(
    (wallet): wallet is WalletBalance => !!wallet
  )

  return (
    <div className="container-page mt-6">
      <p className="section-label">Деньги</p>
      <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">Мои кошельки</h1>
      <p className="mt-2 text-sm text-ink-muted">Отдельные балансы. Без конвертации и скрытых комиссий.</p>

      {/* Активный кошелёк — крупной картой */}
      <section className="mt-5 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-bg-card to-bg-secondary p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-muted">Активный кошелёк</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-primary/60 px-2.5 py-1 text-2xs text-ink-muted">
            <Check className="h-3 w-3 text-accent" />
            {activeCurrency}
          </span>
        </div>
        <p className="money-tabular mt-3 text-3xl font-bold text-white">
          <CurrencyAmount amount={active?.balance ?? 0} currency={activeCurrency} context="wallet" />
        </p>
        <p className="mt-1 text-xs text-ink-muted">{CURRENCY_NAMES[activeCurrency]}</p>
        {active?.network && <NetworkTag network={active.network} className="mt-2" />}

        <div className="mt-4 flex gap-2">
          <Button variant="money" fullWidth onClick={() => openDeposit(activeCurrency)}>
            Пополнить
          </Button>
          <Button variant="secondary" fullWidth onClick={() => openWithdraw(activeCurrency)}>
            Вывести
          </Button>
        </div>
      </section>

      {/* Фиат */}
      <section className="mt-6">
        <h2 className="section-label mb-2 flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5" /> Фиат
        </h2>
        <div className="space-y-1.5">
          {fiat.map((wallet) => (
            <WalletLine key={wallet.currency} wallet={wallet} active={wallet.currency === activeCurrency} />
          ))}
        </div>
      </section>

      {/* Крипта */}
      <section className="mt-6">
        <h2 className="section-label mb-2 flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5" /> Крипта
        </h2>
        <div className="space-y-1.5">
          {crypto.map((wallet) => (
            <WalletLine key={wallet.currency} wallet={wallet} active={wallet.currency === activeCurrency} />
          ))}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-2xs text-ink-dim">
          <Info className="h-3.5 w-3.5" />
          ETH, TON, LTC и USDT ERC20 в релизе не подключены. Отправляйте только в указанной сети.
        </p>
      </section>

      {/* Последние 5 транзакций активного кошелька */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Последние операции</h2>
          <Link href="/wallet/transactions" className="text-sm text-accent hover:text-accent-hover">
            Смотреть все →
          </Link>
        </div>
        <div className="mt-3 space-y-1.5">
          {transactionsLoading ? (
            <Skeleton className="h-16 w-full rounded-2xl" />
          ) : transactions && transactions.items.length > 0 ? (
            transactions.items.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)
          ) : (
            <p className="text-sm text-ink-muted">Операций пока нет. Пополните кошелёк — история появится здесь.</p>
          )}
        </div>
      </section>

      <p className="mt-8 rounded-2xl border border-line bg-bg-secondary/40 p-4 text-xs text-ink-muted">
        Отдельные балансы. Без конвертации и скрытых комиссий. Ставка и вывод идут в валюте выбранного кошелька.
      </p>
    </div>
  )
}

function WalletLine({ wallet, active }: { wallet: WalletBalance; active: boolean }) {
  const setActiveCurrency = useWalletStore((state) => state.setActiveCurrency)
  const openDeposit = useUIStore((state) => state.openDeposit)
  const zero = wallet.balance === 0

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3',
        active ? 'border-accent bg-accent/10' : 'border-line bg-bg-card',
        !active && zero && 'opacity-70'
      )}
    >
      <button type="button" onClick={() => setActiveCurrency(wallet.currency)} className="flex min-w-0 items-center gap-3 text-left">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-secondary text-xs font-bold text-ink-muted">
          {wallet.currency === 'USDT' ? '₮' : wallet.currency === 'BTC' ? '₿' : CURRENCY_NAMES[wallet.currency]}
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            {wallet.currency}
            {wallet.network && <NetworkTag network={wallet.network} />}
          </span>
          <span className="money-tabular block text-xs text-ink-muted">
            <CurrencyAmount amount={wallet.balance} currency={wallet.currency} context="wallet" />
          </span>
        </span>
      </button>

      {zero ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setActiveCurrency(wallet.currency as Currency)
            openDeposit(wallet.currency as Currency)
          }}
        >
          Пополнить
        </Button>
      ) : active ? (
        <Tooltip content="Этот кошелёк уже активен">
          <Button size="sm" variant="ghost" disabled>
            Активен
          </Button>
        </Tooltip>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setActiveCurrency(wallet.currency as Currency)}>
          Открыть
        </Button>
      )}
    </div>
  )
}
