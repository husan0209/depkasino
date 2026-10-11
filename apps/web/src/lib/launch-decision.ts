import { CRYPTO_ORDER, FIAT_ORDER } from '@/constants/currencies'
import type { Currency, Game, WalletBalance } from '@/types'

/**
 * Решение о запуске на деньги — чистая функция (§8.2).
 *
 * Раньше эта логика жила внутри хука и читала сторы напрямую, поэтому её нельзя было
 * проверить без браузера. Здесь только вход и выход: контекст собирает вызывающая сторона
 * (`useLaunch`), а приоритеты остаются ровно теми, что в ТЗ.
 *
 * Порядок решений:
 *  1. гость → вход, после которого launch продолжается, а не начинается заново;
 *  2. повторный заход в ту же игру → сразу последняя игранная валюта с балансом;
 *  3. активный кошелёк не пуст и поддерживается игрой → играем без вопросов;
 *  4. активный пуст, но деньги есть в другом кошельке → короткий вопрос о смене валюты;
 *  5. активная валюта не поддерживается игрой → честный выбор либо стоп без конвертации;
 *  6. все кошельки пустые → касса активной валюты.
 */
export type LaunchDecision =
  | { kind: 'login' }
  | { kind: 'play'; currency: Currency }
  | { kind: 'switch'; currency: Currency; supported: Currency[] }
  | { kind: 'deposit'; currency: Currency }
  | { kind: 'unsupported'; currency: Currency; supported: Currency[] }

export interface LaunchContext {
  isAuthenticated: boolean
  /** Активный кошелёк из шапки (§2.5): один, а не «все сразу». */
  activeCurrency: Currency
  wallets: Pick<WalletBalance, 'currency' | 'balance'>[]
  /** Последняя валюта, в которой игрок реально крутил эту сессию (§2.5). */
  lastPlayedCurrency?: Currency
}

/** Фиат важнее крипты: сначала ₽/₴/Br/₸/soʻm, потом USDT и BTC. */
export function firstSupported(walletCurrencies: Currency[], game: Pick<Game, 'currencies'>): Currency | undefined {
  const order = [...FIAT_ORDER, ...CRYPTO_ORDER]
  return order.find((currency) => walletCurrencies.includes(currency) && game.currencies.includes(currency))
}

export function balanceOf(context: LaunchContext, currency: Currency): number {
  return context.wallets.find((wallet) => wallet.currency === currency)?.balance ?? 0
}

export function nonZeroCurrencies(context: LaunchContext): Currency[] {
  return context.wallets.filter((wallet) => wallet.balance > 0).map((wallet) => wallet.currency)
}

export function resolveLaunchDecision(game: Pick<Game, 'currencies'>, context: LaunchContext): LaunchDecision {
  const { activeCurrency: active, lastPlayedCurrency, isAuthenticated } = context
  const supported = [...game.currencies]

  // 1. Гость: запуск не блокируем и не редиректим — показываем вход и продолжаем после него.
  if (!isAuthenticated) return { kind: 'login' }

  // 2. Повторный заход в ту же игру — без вопроса, в знакомой валюте.
  if (lastPlayedCurrency && supported.includes(lastPlayedCurrency) && balanceOf(context, lastPlayedCurrency) > 0) {
    return { kind: 'play', currency: lastPlayedCurrency }
  }

  const activeBalance = balanceOf(context, active)

  // 3. Активный кошелёк не пуст и подходит провайдеру.
  if (activeBalance > 0 && supported.includes(active)) return { kind: 'play', currency: active }

  const alternative = firstSupported(nonZeroCurrencies(context), game)

  // 4. Активный пуст, деньги лежат в другом кошельке — спрашиваем коротко, без конвертации.
  if (alternative && alternative !== active && activeBalance === 0 && supported.includes(alternative)) {
    return { kind: 'switch', currency: alternative, supported }
  }

  // 5. Провайдер не принимает активную валюту: либо играем в другой, либо честный стоп.
  if (!supported.includes(active)) {
    if (alternative) return { kind: 'switch', currency: alternative, supported }
    return { kind: 'unsupported', currency: active, supported }
  }

  // 6. Пусто везде — касса активной валюты, а не «выберите валюту перед спином».
  return { kind: 'deposit', currency: active }
}

/**
 * Какой вопрос задать при смене валюты: про пустой кошелёк или про неподдерживаемую валюту.
 * Саму строку собирает UI — здесь только развилка, чтобы текст не расходился с решением.
 */
export type SwitchQuestionKind = 'empty' | 'unsupported'

export function switchQuestionKind(context: LaunchContext, from: Currency): SwitchQuestionKind {
  return balanceOf(context, from) === 0 ? 'empty' : 'unsupported'
}
