/**
 * Денежные форматы §2.5 — исполняемая спецификация.
 * Запускается приёмкой (scripts/acceptance.mjs) через esbuild: алиас `@` разрешается там.
 *
 * Правило: голое число в кассе или истории — ошибка, поэтому ожидания здесь точные,
 * вплоть до разделителя тысяч (U+00A0) и знака «−» (U+2212).
 */
import { CURRENCY_ASSETS } from '@/constants/currencies'
import {
  amountToNumber,
  currencySymbol,
  formatAmount,
  formatAmountPlain,
  formatSigned,
  sanitizeAmountInput
} from '@/lib/format'

interface Case {
  name: string
  actual: string
  expected: string
}

const cases: Case[] = [
  // Фиат: только целые, разделитель — неразрывный пробел (§2.5).
  { name: 'RUB 1200 · header', actual: formatAmount(1200, 'RUB', { context: 'header' }), expected: '1\u00A0200\u00A0₽' },
  { name: 'RUB 1200 · wallet', actual: formatAmount(1200, 'RUB'), expected: '1\u00A0200\u00A0₽' },
  { name: 'RUB дробное → без копеек', actual: formatAmount(1200.55, 'RUB'), expected: '1\u00A0201\u00A0₽' },
  { name: 'KZT 8200 · header', actual: formatAmount(8200, 'KZT', { context: 'header' }), expected: '8\u00A0200\u00A0₸' },
  { name: 'UAH 12345 · wallet', actual: formatAmount(12345, 'UAH'), expected: '12\u00A0345\u00A0₴' },
  { name: 'BYN 99 · wallet', actual: formatAmount(99, 'BYN'), expected: '99\u00A0Br' },
  { name: 'UZS 12 500 000 · без сокращений', actual: formatAmount(12500000, 'UZS'), expected: '12\u00A0500\u00A0000\u00A0soʻm' },
  // Крипта: код после суммы, знаков ровно по контексту.
  { name: 'USDT 150,5 · header (2 знака)', actual: formatAmount(150.5, 'USDT', { context: 'header' }), expected: '150,5\u00A0USDT' },
  { name: 'USDT 150,5 · wallet (2 знака)', actual: formatAmount(150.5, 'USDT', { context: 'wallet' }), expected: '150,5\u00A0USDT' },
  { name: 'BTC 0,00123456 · header (6 знаков)', actual: formatAmount(0.00123456, 'BTC', { context: 'header' }), expected: '0,001235\u00A0BTC' },
  { name: 'BTC 0,00123456 · wallet (8 знаков)', actual: formatAmount(0.00123456, 'BTC'), expected: '0,00123456\u00A0BTC' },
  { name: 'BTC 0,5 без хвостовых нулей', actual: formatAmount(0.5, 'BTC'), expected: '0,5\u00A0BTC' },
  // История: знак всегда есть, минус — типографский.
  { name: 'история −1 500 ₽', actual: formatSigned(-1500, 'RUB'), expected: '−1\u00A0500\u00A0₽' },
  { name: 'история +3 400 ₸', actual: formatSigned(3400, 'KZT'), expected: '+3\u00A0400\u00A0₸' },
  { name: 'плоско без символа', actual: formatAmountPlain(0, 'UZS'), expected: '0' },
  // Ввод в кассе: разделители по мере ввода, обрезка лишних знаков.
  { name: 'ввод UZS', actual: sanitizeAmountInput('12500000', 'UZS'), expected: '12\u00A0500\u00A0000' },
  { name: 'ввод USDT → 2 знака', actual: sanitizeAmountInput('1234.567', 'USDT'), expected: '1\u00A0234,56' },
  { name: 'ввод BTC → 8 знаков', actual: sanitizeAmountInput('0.0012345678', 'BTC'), expected: '0,00123456' },
  { name: 'ввод RUB → без копеек', actual: sanitizeAmountInput('1234.9', 'RUB'), expected: '1\u00A0234' },
  { name: 'число из «8 200»', actual: String(amountToNumber('8\u00A0200')), expected: '8200' },
  // Свойства валют, которые нельзя терять (§2.5).
  { name: 'BYN подписан как Br, не «руб.»', actual: `${currencySymbol('BYN')}/${CURRENCY_ASSETS.BYN.label}`, expected: 'Br/бр' },
  { name: 'BTC: 8 знаков в кошельке', actual: String(CURRENCY_ASSETS.BTC.walletDecimals), expected: '8' },
  { name: 'BTC: 4–6 знаков в шапке', actual: `${CURRENCY_ASSETS.BTC.headerDecimals}`, expected: '6' },
  { name: 'USDT: сеть TRC20', actual: CURRENCY_ASSETS.USDT.network ?? '', expected: 'TRC20' },
  { name: 'в релизе ровно 7 валют', actual: String(Object.keys(CURRENCY_ASSETS).length), expected: '7' },
  { name: 'у BTC нет пресетов сумм', actual: String(CURRENCY_ASSETS.BTC.depositPresets.length), expected: '0' },
  { name: 'пресеты UZS — 4 штуки', actual: String(CURRENCY_ASSETS.UZS.depositPresets.length), expected: '4' }
]

const failed = cases.filter((item) => item.actual !== item.expected)

for (const item of cases) {
  const mark = item.actual === item.expected ? '✓' : '✗'
  console.log(`${mark} ${item.name}: ${JSON.stringify(item.actual)}`)
  if (item.actual !== item.expected) console.log(`    ожидалось ${JSON.stringify(item.expected)}`)
}

console.log(`\n${cases.length - failed.length}/${cases.length} денежных правил соблюдены`)
process.exit(failed.length === 0 ? 0 : 1)
