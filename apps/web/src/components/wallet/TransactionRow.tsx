'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge, CurrencyAmount, NetworkTag } from '@/components/ui'
import { TRANSACTION_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '@/constants/currencies'
import { formatShortDate } from '@/lib/dates'
import { cn } from '@/lib/cn'
import type { Transaction } from '@/types'

const statusVariants = {
  completed: 'success',
  pending: 'warning',
  processing: 'warning',
  failed: 'danger',
  cancelled: 'neutral'
} as const

/**
 * Строка транзакции (§11): дата, тип, сумма И валюта одинаково заметно, статус.
 * Плюс зелёный, минус красный. «+1 000» без валюты — баг.
 */
export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const [open, setOpen] = useState(false)
  const positive = transaction.amount >= 0

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-bg-card">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-white">
            {TRANSACTION_TYPE_LABELS[transaction.type]}
            {transaction.network && <NetworkTag network={transaction.network} />}
          </p>
          <p className="mt-0.5 truncate text-xs text-ink-muted">
            {formatShortDate(transaction.createdAt)}
            {transaction.method ? ` · ${transaction.method}` : ''}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className={cn('money-tabular text-sm font-semibold', positive ? 'text-money' : 'text-danger')}>
              <CurrencyAmount amount={transaction.amount} currency={transaction.currency} context="wallet" signed />
            </p>
            <Badge variant={statusVariants[transaction.status]} className="mt-1">
              {TRANSACTION_STATUS_LABELS[transaction.status]}
            </Badge>
          </div>
          <ChevronDown className={cn('h-4 w-4 text-ink-muted transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <dl className="space-y-1.5 border-t border-line bg-bg-secondary/40 px-3.5 py-3 text-xs">
          <Row label="ID операции" value={transaction.id} mono />
          {transaction.method && <Row label="Метод" value={transaction.method} />}
          {transaction.provider && <Row label="Провайдер" value={transaction.provider} />}
          {transaction.destination && <Row label="Реквизиты" value={transaction.destination} />}
          {/* Курс показываем только если он реально фиксировался в крипто-платеже (§11) */}
          {transaction.rate && <Row label="Курс на момент операции" value={`${transaction.rate.toLocaleString('ru-RU')} ₽/ед.`} />}
          <Row label="Дата" value={formatShortDate(transaction.createdAt)} />
        </dl>
      )}
    </div>
  )
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-ink-dim">{label}</dt>
      <dd className={cn('max-w-[60%] break-all text-right text-ink-muted', mono && 'money-tabular')}>{value}</dd>
    </div>
  )
}
