import { CURRENCY_ASSETS } from '@/constants/currencies'
import type { Currency } from '@/types'

/**
 * Единый денежный форматтер (§2.5).
 * Голое число в кассе или истории = ошибка реализации, поэтому весь UI ходит сюда.
 */

const NBSP = '\u00A0'

export type AmountContext = 'header' | 'wallet' | 'plain' | 'input'

interface FormatOptions {
  context?: AmountContext
  withSymbol?: boolean
  signed?: boolean
  /** Показывать «+»/«−» перед суммой: для истории и вспышки баланса */
  showPlus?: boolean
}

function decimalsFor(currency: Currency, context: AmountContext): number {
  const asset = CURRENCY_ASSETS[currency]
  if (context === 'input') return asset.kind === 'crypto' ? asset.walletDecimals : 0
  return context === 'header' ? asset.headerDecimals : asset.walletDecimals
}

function trimZeros(value: string): string {
  return value.includes('.') ? value.replace(/\.?0+$/, '') : value
}

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
}

export interface ParsedAmount {
  integer: string
  fraction: string
}

/** Разбор строки ввода: пробелы-разделители, запятая как десятичный знак. */
export function parseAmountInput(raw: string): ParsedAmount {
  const cleaned = raw.replace(/[^\d.,]/g, '').replace(',', '.')
  const [int = '', frac] = cleaned.split('.')
  return { integer: int.replace(/^0+(?=\d)/, ''), fraction: frac?.slice(0, 8) ?? '' }
}

export function sanitizeAmountInput(raw: string, currency: Currency): string {
  const { integer, fraction } = parseAmountInput(raw)
  const asset = CURRENCY_ASSETS[currency]
  const maxFraction = asset.kind === 'crypto' ? asset.walletDecimals : 0
  const grouped = integer ? groupThousands(integer) : ''
  if (maxFraction === 0) return grouped
  if (raw.includes('.') || raw.includes(',')) return `${grouped},${fraction.slice(0, maxFraction)}`
  return grouped
}

export function amountToNumber(raw: string): number {
  const { integer, fraction } = parseAmountInput(raw)
  return Number(`${integer || 0}${fraction ? `.${fraction}` : ''}`)
}

/**
 * Формат суммы с валютой.
 * Символ ставится после числа («1 200 ₽», «150 000 soʻm»), у USDT/BTC — код после суммы.
 */
export function formatAmount(amount: number, currency: Currency, options: FormatOptions = {}): string {
  const { context = 'wallet', withSymbol = true, showPlus = false } = options
  const asset = CURRENCY_ASSETS[currency]
  const decimals = Math.min(Math.max(decimalsFor(currency, context), 0), asset.walletDecimals)
  const negative = amount < 0
  const abs = Math.abs(amount)

  const fixed = decimals > 0 ? trimZeros(abs.toFixed(decimals)) : String(Math.round(abs))
  const [rawInt, frac] = fixed.split('.')
  let out = groupThousands(rawInt)
  if (frac) out += `,${frac}`

  const sign = negative ? '−' : showPlus ? '+' : ''
  return withSymbol ? `${sign}${out}${NBSP}${asset.symbol}` : `${sign}${out}`
}

/** «+2 000 ₽» / «−1 500 ₸» — история и вспышки баланса. Всегда со знаком. */
export function formatSigned(amount: number, currency: Currency, context: AmountContext = 'wallet'): string {
  return formatAmount(amount, currency, { context, showPlus: amount >= 0 })
}

export function formatAmountPlain(amount: number, currency: Currency, context: AmountContext = 'wallet'): string {
  return formatAmount(amount, currency, { context, withSymbol: false })
}

/** Краткая подпись валюты для служебных строк: «150 USDT», «0.00120000 BTC». */
export function formatCrypto(amount: number, currency: Currency): string {
  return formatAmount(amount, currency, { context: 'wallet' })
}

export function formatPercent(value: number, digits = 2): string {
  return `${value.toFixed(digits).replace('.', ',')}%`
}

export function currencySymbol(currency: Currency): string {
  return CURRENCY_ASSETS[currency].symbol
}

export function currencyLabel(currency: Currency): string {
  return CURRENCY_ASSETS[currency].label
}

/** Компактная подпись для тултипов и настроек: «RUB — руб.». */
export function currencyTitle(currency: Currency): string {
  const asset = CURRENCY_ASSETS[currency]
  return asset.kind === 'crypto' ? `USDT · ${asset.network ?? ''}`.trim() : `${currency} — ${asset.label}`
}
