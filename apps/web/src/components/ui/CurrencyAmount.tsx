import { cn } from '@/lib/cn'
import { formatAmountPlain } from '@/lib/format'
import { CURRENCY_ASSETS } from '@/constants/currencies'
import type { Currency } from '@/types'

/**
 * Единый форматтер суммы: суммы без валюты в UI быть не может (§10.4).
 * Символ валюты всегда приклеен к числу — даже когда блок переносится по строкам.
 */
export function CurrencyAmount({
  amount,
  currency,
  context = 'wallet',
  signed = false,
  showPlus = false,
  className,
  symbolClassName
}: {
  amount: number
  currency: Currency
  context?: 'header' | 'wallet' | 'plain' | 'input'
  signed?: boolean
  showPlus?: boolean
  className?: string
  symbolClassName?: string
}) {
  const asset = CURRENCY_ASSETS[currency]
  const value = formatAmountPlain(amount, currency, context)
  const withSign = signed || showPlus ? value : value

  return (
    <span className={cn('money-tabular whitespace-nowrap', className)}>
      {withSign}
      <span className={cn('ml-1 text-[0.85em] opacity-70', symbolClassName)}>{asset.symbol}</span>
    </span>
  )
}

/** Просто число с валютой одной строкой — для текстов и подписей. */
export function amountText(amount: number, currency: Currency, context: 'header' | 'wallet' | 'plain' = 'wallet'): string {
  return `${formatAmountPlain(amount, currency, context)} ${CURRENCY_ASSETS[currency].symbol}`
}
