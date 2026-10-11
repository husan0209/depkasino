'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Gamepad2 } from 'lucide-react'
import { Button, CurrencyAmount, EmptyState, Pagination, Select, SkeletonRow } from '@/components/ui'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useWalletStore } from '@/stores/wallet'
import { ALL_CURRENCIES } from '@/constants/currencies'
import { formatShortDate } from '@/lib/dates'
import { MOCK_GAMES } from '@/mocks/games'
import type { BetHistorySummary, BetRecord, Currency, Paginated } from '@/types'

interface BetsResponse extends Paginated<BetRecord> {
  summary: BetHistorySummary
}

/**
 * История ставок (§12). Красного P/L-героя НЕТ.
 * Сверху — чипы: ставок N, оборот в выбранной валюте, выигрыши в выбранной валюте.
 * Смешанный период по валютам не суммируется: фильтр одной валюты либо разбивка по кошелькам.
 */
export function HistoryClient() {
  const activeCurrency = useWalletStore((state) => state.activeCurrency)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [currency, setCurrency] = useState<string>(activeCurrency)
  const [period, setPeriod] = useState('7d')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['history', 'bets', { currency, period, page }],
    queryFn: () =>
      api
        .get<BetsResponse>('/history/bets', { params: { currency, period, page, pageSize: 15 } })
        .then((response) => response.data),
    enabled: isAuthenticated
  })

  const summary = useMemo(() => {
    const row = data?.summary.perCurrency.find((item) => item.currency === currency)
    return { turnover: row?.turnover ?? 0, wins: row?.wins ?? 0, bets: data?.summary.bets ?? 0 }
  }, [currency, data])

  const coverFor = (slug: string) => MOCK_GAMES.find((game) => game.slug === slug)?.cover ?? '/covers/sweet-bonanza.svg'

  return (
    <div className="container-page mt-6">
      <p className="section-label">Ставки</p>
      <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">История игр</h1>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select
          value={currency}
          onChange={(value) => {
            setCurrency(value)
            setPage(1)
          }}
          options={ALL_CURRENCIES.map((item) => ({ value: item, label: `Кошелёк ${item}` }))}
        />
        <Select
          value={period}
          onChange={(value) => {
            setPeriod(value)
            setPage(1)
          }}
          options={[
            { value: '24h', label: 'За сутки' },
            { value: '7d', label: 'Последние 7 дней' },
            { value: '30d', label: 'Последний месяц' }
          ]}
        />
      </div>

      {/* Оборот и выигрыши — в валюте фильтра, без суммирования ₽ и ₸ */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Ставок" value={String(summary.bets)} />
        <Stat label="Оборот" amount={summary.turnover} currency={currency as Currency} />
        <Stat label="Выигрыши" amount={summary.wins} currency={currency as Currency} accent />
      </div>

      {(data?.summary.perCurrency.length ?? 0) > 1 && (
        <div className="mt-3 rounded-2xl border border-line bg-bg-secondary/40 p-3 text-xs text-ink-muted">
          В периоде есть операции в разных валютах. Показываем разбивку по кошелькам, а не сумму:
          <div className="mt-1.5 flex flex-wrap gap-2">
            {data?.summary.perCurrency.map((row) => (
              <span key={row.currency} className="rounded-lg border border-line bg-bg-card px-2 py-1">
                {row.currency}: оборот <CurrencyAmount amount={row.turnover} currency={row.currency} context="wallet" /> · выигрыши{' '}
                <CurrencyAmount amount={row.wins} currency={row.currency} context="wallet" />
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-1.5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />)
        ) : data && data.items.length > 0 ? (
          data.items.map((bet) => (
            <div key={bet.id} className="flex items-center gap-3 rounded-2xl border border-line bg-bg-card p-3">
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                <Image src={coverFor(bet.game.slug)} alt="" fill sizes="44px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/casino/${bet.game.slug}`} className="block truncate text-sm font-medium text-white hover:text-accent">
                  {bet.game.title}
                </Link>
                <p className="truncate text-xs text-ink-muted">
                  {bet.provider.name} · {formatShortDate(bet.createdAt)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="money-tabular text-xs text-ink-muted">
                  Ставка <CurrencyAmount amount={-bet.bet} currency={bet.currency} context="wallet" signed />
                </p>
                <p className={bet.win > 0 ? 'money-tabular text-sm font-semibold text-money' : 'money-tabular text-sm text-ink-dim'}>
                  {bet.win > 0 ? <CurrencyAmount amount={bet.win} currency={bet.currency} context="wallet" showPlus /> : 'без выигрыша'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<Gamepad2 className="h-5 w-5" />}
            title="Ставок пока нет"
            description="Запустите слот — история появится здесь с разбивкой по кошелькам."
            action={
              <Link
                href="/casino"
                className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover"
              >
                В каталог
              </Link>
            }
          />
        )}
      </div>

      {data && data.total > 15 && (
        <div className="mt-5 flex justify-center">
          <Pagination page={page} totalPages={Math.max(1, Math.ceil(data.total / 15))} onChange={setPage} />
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, amount, currency, accent }: { label: string; value?: string; amount?: number; currency?: Currency; accent?: boolean }) {
  return (
    <div className="card-surface p-3 text-center">
      <p className="text-2xs uppercase tracking-wide text-ink-dim">{label}</p>
      <p className={accent ? 'money-tabular mt-1 text-sm font-semibold text-money' : 'money-tabular mt-1 text-sm font-semibold text-white'}>
        {value ?? (amount !== undefined && currency ? <CurrencyAmount amount={amount} currency={currency} context="wallet" /> : '—')}
      </p>
    </div>
  )
}
