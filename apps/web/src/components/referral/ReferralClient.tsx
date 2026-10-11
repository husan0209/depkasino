'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Gift, Users } from 'lucide-react'
import { Badge, Button, CurrencyAmount, Input, QueryError, Select, Sheet, Skeleton, SkeletonRow } from '@/components/ui'
import { referralApi, queryKeys } from '@/lib/api'
import { useWalletStore } from '@/stores/wallet'
import { useAuthStore } from '@/stores/auth'
import { ALL_CURRENCIES } from '@/constants/currencies'
import { amountToNumber, formatAmount } from '@/lib/format'
import { formatShortDate } from '@/lib/dates'
import { toast } from '@/stores/toast'
import { AmountInput } from '@/components/ui'
import type { Currency } from '@/types'

/**
 * Реферальный кабинет (§14).
 * Формулировки: «бонус с игры друзей» / «процент с их активности».
 * Слова GGR, «процент с проигрышей» запрещены.
 */
export function ReferralClient() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const activeCurrency = useWalletStore((state) => state.activeCurrency)
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [currency, setCurrency] = useState<Currency>(activeCurrency)
  const [amount, setAmount] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: queryKeys.referral, queryFn: () => referralApi.overview() })

  const withdraw = useMutation({
    mutationFn: () => referralApi.withdraw(currency, amountToNumber(amount)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.referral }),
        queryClient.invalidateQueries({ queryKey: queryKeys.wallets() })
      ])
      toast.money('Бонус выведен в кошелёк', 'Сумма уже на балансе')
      setWithdrawOpen(false)
      setAmount('')
    },
    onError: (error) => toast.error('Не удалось вывести', (error as Error).message)
  })

  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const link = `${origin}/register?ref=${data?.code ?? user?.referralCode ?? ''}`

  const copy = async (value: string, kind: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      toast.success(kind === 'link' ? 'Ссылка скопирована' : 'Код скопирован')
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('Не удалось скопировать', 'Выделите текст вручную')
    }
  }

  if (isError) {
    return (
      <div className="container-page mt-6">
        <QueryError title="Реферальные данные не загрузились" onRetry={() => void refetch()} />
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="container-page mt-6 space-y-3">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    )
  }

  const availableEntries = Object.entries(data.available) as Array<[Currency, number]>
  const availableTotal = availableEntries.filter(([, value]) => value > 0)

  return (
    <div className="container-page mt-6">
      <p className="section-label">Приглашай друзей</p>
      <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">Бонус с игры друзей</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Делитесь ссылкой — получайте процент с активности друзей. Без условий и вейджера.
      </p>

      {/* Ссылка и код */}
      <section className="card-surface mt-5 p-5">
        <p className="text-xs text-ink-muted">Ваша ссылка</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-bg-secondary px-3 py-2.5">
            <span className="truncate text-xs text-ink-muted">{link}</span>
          </div>
          <Button onClick={() => copy(link, 'link')} leftIcon={copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
            {copied === 'link' ? 'Скопировано' : 'Копировать'}
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-ink-muted">Код:</span>
          <button
            type="button"
            onClick={() => copy(data.code, 'code')}
            className="money-tabular inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-secondary px-2.5 py-1 text-xs font-semibold text-white"
          >
            {data.code}
            {copied === 'code' ? <Check className="h-3 w-3 text-money" /> : <Copy className="h-3 w-3 text-ink-muted" />}
          </button>
        </div>
      </section>

      {/* Как это работает */}
      <section className="mt-6">
        <h2 className="section-label">Как это работает</h2>
        <ol className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { step: '1', title: 'Отправьте ссылку', text: 'Друг регистрируется — код применится сам.' },
            { step: '2', title: 'Друг играет', text: 'Вы получаете бонус с его активности.' },
            { step: '3', title: 'Выводите', text: 'Сумма падает в выбранный кошелёк, без конвертации.' }
          ].map((item) => (
            <li key={item.step} className="card-surface p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-xs font-bold text-accent">
                {item.step}
              </span>
              <p className="mt-2 text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs text-ink-muted">{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Счётчики */}
      <section className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon={<Users className="h-4 w-4" />} label="Рефералов" value={String(data.total)} />
        <Stat label="Активных" value={String(data.active)} />
        <Stat
          label="Заработано"
          value={
            <span className="flex flex-col">
              {(Object.entries(data.earned) as Array<[Currency, number]>).map(([code, value]) => (
                <CurrencyAmount key={code} amount={value} currency={code} context="wallet" className="text-xs" />
              ))}
            </span>
          }
        />
        <Stat
          label="Доступно"
          value={
            availableTotal.length > 0 ? (
              <span className="flex flex-col">
                {availableTotal.map(([code, value]) => (
                  <CurrencyAmount key={code} amount={value} currency={code} context="wallet" className="text-xs text-money" />
                ))}
              </span>
            ) : (
              <span className="text-xs text-ink-dim">пока нет</span>
            )
          }
        />
      </section>

      <div className="mt-4">
        <Button
          variant="money"
          disabled={availableTotal.length === 0}
          onClick={() => {
            setCurrency(availableTotal[0]?.[0] ?? activeCurrency)
            setWithdrawOpen(true)
          }}
        >
          Вывести бонус
        </Button>
      </div>

      {/* Список рефералов без полных email */}
      <section className="mt-8">
        <h2 className="text-base font-semibold text-white">Ваши друзья</h2>
        <div className="mt-3 space-y-1.5">
          {data.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-bg-card p-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-secondary text-ink-muted">
                  <Gift className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm text-white">{item.maskedEmail}</p>
                  <p className="text-xs text-ink-muted">с {formatShortDate(item.joinedAt)}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="neutral">{item.currency}</Badge>
                <p className="money-tabular mt-1 text-sm font-semibold text-money">
                  <CurrencyAmount amount={item.amount} currency={item.currency} context="wallet" showPlus />
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Sheet
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        title="Вывод бонуса"
        subtitle="Только в валюте кошелька — без конвертации"
        footer={
          <Button
            variant="money"
            fullWidth
            size="lg"
            loading={withdraw.isPending}
            disabled={amountToNumber(amount) <= 0}
            onClick={() => withdraw.mutate()}
          >
            Вывести в кошелёк
          </Button>
        }
      >
        <div className="space-y-4">
          <Select
            label="Кошелёк"
            value={currency}
            onChange={(value) => setCurrency(value)}
            options={ALL_CURRENCIES.map((code) => ({
              value: code,
              label: `${code}${data.available[code] ? ` · доступно ${formatAmount(data.available[code] ?? 0, code, { context: 'wallet' })}` : ''}`
            }))}
          />
          <AmountInput value={amount} onChange={setAmount} currency={currency} />
          <p className="text-xs text-ink-muted">
            Доступно:{' '}
            <span className="money-tabular text-white">
              <CurrencyAmount amount={data.available[currency] ?? 0} currency={currency} context="wallet" />
            </span>
          </p>
        </div>
      </Sheet>
    </div>
  )
}

function Stat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="card-surface p-3.5">
      <p className="flex items-center gap-1.5 text-2xs uppercase tracking-wide text-ink-dim">
        {icon}
        {label}
      </p>
      <div className="money-tabular mt-1.5 text-base font-semibold text-white">{value}</div>
    </div>
  )
}
