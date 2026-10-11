'use client'

import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'
import { env } from '@/lib/env'
import { useGeoStore } from '@/stores/geo'
import { CRYPTO_METHODS } from '@/mocks/geo'
import type { PaymentMethod } from '@/types'

/**
 * Footer (§4.6): лого + тэглайн, 18+, условия, конфиденциальность, ответственная игра,
 * поддержка и иконки платёжных методов ТЕКУЩЕГО гео — без витрины из 20 недоступных логотипов.
 */

function PaymentIconTile({ method }: { method: PaymentMethod }) {
  return (
    <span
      title={`${method.name} · ${method.etaLabel}`}
      className="inline-flex h-7 items-center rounded-lg border border-line bg-bg-secondary px-2 text-2xs font-semibold uppercase tracking-wide text-ink-muted"
    >
      {method.icon}
    </span>
  )
}

export function Footer() {
  const geo = useGeoStore((state) => state.geo)
  const methods = geo?.paymentMethods ?? []
  const crypto: PaymentMethod[] = CRYPTO_METHODS.filter((method) =>
    (geo?.enabledCrypto ?? ['USDT_TRC20', 'BTC']).some((code) =>
      code === 'USDT_TRC20' ? method.currency === 'USDT' : method.currency === 'BTC'
    )
  )

  return (
    <footer className="mt-12 border-t border-line/70 bg-bg-secondary/40">
      <div className="container-page grid grid-cols-1 gap-8 py-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo withTagline />
          <p className="mt-3 max-w-sm text-sm text-ink-muted">
            Твой следующий большой спин. Слоты, честные выплаты и кошельки без конвертации.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-lg border border-warning/40 bg-warning/10 px-2 text-2xs font-bold text-warning">
              18+
            </span>
            <span className="text-xs text-ink-muted">Играйте ответственно. Азартные игры могут вызывать зависимость.</span>
          </div>
        </div>

        <nav className="space-y-2 text-sm" aria-label="Документы">
          <p className="section-label">Документы</p>
          <Link href="/terms" className="block text-ink-muted transition-colors hover:text-white">
            Условия
          </Link>
          <Link href="/privacy" className="block text-ink-muted transition-colors hover:text-white">
            Конфиденциальность
          </Link>
          <Link href="/responsible-gaming" className="block text-ink-muted transition-colors hover:text-white">
            Ответственная игра
          </Link>
          <Link href="/support" className="block text-ink-muted transition-colors hover:text-white">
            Поддержка
          </Link>
        </nav>

        <div>
          <p className="section-label">Способы пополнения</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {methods.map((method) => (
              <PaymentIconTile key={method.id} method={method} />
            ))}
            {crypto.map((method) => (
              <PaymentIconTile key={method.id} method={method} />
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-dim">
            {env.siteName} · все суммы в валюте вашего кошелька
          </p>
        </div>
      </div>
    </footer>
  )
}
