'use client'

import { Check } from 'lucide-react'
import { Button, CurrencyAmount, NetworkTag, Sheet } from '@/components/ui'
import { useUIStore } from '@/stores/ui'
import { useWalletStore } from '@/stores/wallet'
import { useGeoStore } from '@/stores/geo'
import { useAuthStore } from '@/stores/auth'
import { CURRENCY_NAMES, CRYPTO_ORDER, FIAT_ORDER } from '@/constants/currencies'
import { cn } from '@/lib/cn'
import type { Currency, WalletBalance } from '@/types'

/**
 * Шторка кошельков (§4.1 Части 5.1, донор spinera).
 * Активный первым, ненулевые выше нулевых внутри группы, нулевые тусклые, но видимые.
 * Никакого «итого ≈»: суммировать ₽ + ₸ + USDT нельзя.
 */
export function WalletSwitcherSheet() {
  const open = useUIStore((state) => state.walletSwitcher)
  const close = useUIStore((state) => state.closeWalletSwitcher)
  const openDeposit = useUIStore((state) => state.openDeposit)
  const wallets = useWalletStore((state) => state.wallets)
  const activeCurrency = useWalletStore((state) => state.activeCurrency)
  const setActiveCurrency = useWalletStore((state) => state.setActiveCurrency)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const openLogin = useUIStore((state) => state.openLogin)
  const geo = useGeoStore((state) => state.geo)
  const defaultCurrency = useGeoStore((state) => state.defaultCurrency())

  if (!isAuthenticated) {
    return (
      <Sheet open={open} onClose={close} title="Кошелёк" subtitle="Войдите, чтобы видеть балансы">
        <Button fullWidth onClick={() => { close(); openLogin() }}>
          Войти
        </Button>
      </Sheet>
    )
  }

  if (!geo) {
    return (
      <Sheet open={open} onClose={close} title="Кошелёк">
        <p className="py-6 text-center text-sm text-ink-muted">Определяем вашу страну и валюту…</p>
      </Sheet>
    )
  }

  const byOrder = (order: Currency[]): WalletBalance[] =>
    order
      .map((currency) => wallets.find((w) => w.currency === currency))
      .filter((wallet): wallet is WalletBalance => !!wallet)
      .sort((a, b) => {
        if (a.currency === activeCurrency) return -1
        if (b.currency === activeCurrency) return 1
        return Number(b.balance > 0) - Number(a.balance > 0)
      })

  const fiat = byOrder(FIAT_ORDER)
  const crypto = byOrder(CRYPTO_ORDER)
  const active = wallets.find((w) => w.currency === activeCurrency) ?? { currency: defaultCurrency, balance: 0 }

  const pick = (currency: Currency) => {
    setActiveCurrency(currency)
    close()
  }

  return (
    <Sheet open={open} onClose={close} title="Кошелёк" subtitle="Отдельные балансы. Без конвертации">
      <Group title="Фиат">
        {fiat.map((wallet) => (
          <WalletRow key={wallet.currency} wallet={wallet} active={wallet.currency === activeCurrency} onSelect={pick} />
        ))}
      </Group>

      <Group title="Крипта">
        {crypto.map((wallet) => (
          <WalletRow key={wallet.currency} wallet={wallet} active={wallet.currency === activeCurrency} onSelect={pick} />
        ))}
      </Group>

      <div className="mt-4 sticky bottom-0 -mx-5 bg-bg-primary/95 px-5 pb-1 pt-2">
        <Button
          variant="money"
          fullWidth
          onClick={() => {
            close()
            openDeposit(active.currency as Currency)
          }}
        >
          Пополнить {CURRENCY_NAMES[active.currency as Currency]}
        </Button>
        <p className="mt-2 text-center text-2xs text-ink-dim">Зачисление обычно за 1 минуту</p>
      </div>
    </Sheet>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      <p className="section-label mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </section>
  )
}

function WalletRow({
  wallet,
  active,
  onSelect
}: {
  wallet: WalletBalance
  active: boolean
  onSelect(currency: Currency): void
}) {
  const zero = wallet.balance === 0

  return (
    <button
      type="button"
      onClick={() => onSelect(wallet.currency)}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors',
        active ? 'border-accent bg-accent/10' : 'border-line bg-bg-secondary/60 hover:border-accent/40',
        !active && zero && 'opacity-60'
      )}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-bg-card text-xs font-bold text-ink-muted">
          {wallet.currency === 'USDT' ? '₮' : wallet.currency === 'BTC' ? '₿' : CURRENCY_NAMES[wallet.currency]}
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-white">{wallet.currency}</span>
          {wallet.currency === 'USDT' && <NetworkTag network="TRC20" className="mt-0.5 w-fit" />}
          {wallet.currency === 'BTC' && <NetworkTag network="BTC" className="mt-0.5 w-fit" />}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <CurrencyAmount
          amount={wallet.balance}
          currency={wallet.currency}
          context={wallet.currency === 'BTC' ? 'wallet' : 'wallet'}
          className={cn('text-sm font-semibold', zero ? 'text-ink-muted' : 'text-white')}
        />
        {active && <Check className="h-4 w-4 text-accent" />}
      </span>
    </button>
  )
}
