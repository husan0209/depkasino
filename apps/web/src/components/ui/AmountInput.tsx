'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/cn'
import { CURRENCY_ASSETS } from '@/constants/currencies'
import { sanitizeAmountInput } from '@/lib/format'
import type { Currency } from '@/types'

/**
 * Ввод денег: маска разрядов, символ валюты внутри поля, никаких голых number input.
 * Используется в кассе и выводе (§3.1).
 */
export interface AmountInputProps {
  value: string
  onChange(value: string): void
  currency: Currency
  error?: string
  hint?: string
  disabled?: boolean
  autoFocus?: boolean
  id?: string
  /** Крупный вариант — для главного шага кассы. */
  size?: 'md' | 'lg'
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(function AmountInput(
  { value, onChange, currency, error, hint, disabled, autoFocus, id, size = 'lg' },
  ref
) {
  const asset = CURRENCY_ASSETS[currency]
  const isCrypto = asset.kind === 'crypto'

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl border bg-bg-secondary px-4 transition-colors',
          error ? 'border-danger' : 'border-line focus-within:border-accent',
          size === 'lg' ? 'h-16' : 'h-12',
          disabled && 'opacity-60'
        )}
      >
        <input
          ref={ref}
          id={id}
          inputMode={isCrypto ? 'decimal' : 'numeric'}
          autoComplete="off"
          autoFocus={autoFocus}
          disabled={disabled}
          aria-label={`Сумма в ${asset.label}`}
          aria-invalid={!!error}
          value={value}
          onChange={(event) => onChange(sanitizeAmountInput(event.target.value, currency))}
          placeholder="0"
          className={cn(
            'money-tabular h-full min-w-0 flex-1 bg-transparent font-semibold text-ink outline-none placeholder:text-ink-dim',
            size === 'lg' ? 'text-3xl' : 'text-xl'
          )}
        />
        <span className={cn('shrink-0 font-semibold text-ink-muted', size === 'lg' ? 'text-lg' : 'text-base')}>
          {asset.symbol}
        </span>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
})

/** Пресеты активной валюты. У BTC пресетов нет — принимаем фактический платёж (§2.5). */
export function AmountPresets({
  currency,
  onSelect,
  value,
  disabled
}: {
  currency: Currency
  onSelect(amount: number): void
  value?: number
  disabled?: boolean
}) {
  const presets = CURRENCY_ASSETS[currency].depositPresets
  if (presets.length === 0) return null

  return (
    <div className="grid grid-cols-4 gap-2">
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(preset)}
          className={cn(
            'money-tabular h-10 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-50',
            value === preset
              ? 'border-accent bg-accent/15 text-white'
              : 'border-line bg-bg-secondary text-ink-muted hover:border-accent/50 hover:text-ink'
          )}
        >
          {preset.toLocaleString('ru-RU').replace(/\u00A0/g, ' ')}
        </button>
      ))}
    </div>
  )
}
