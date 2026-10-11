/**
 * Приоритеты запуска §8.2 — исполняемая спецификация для чистой функции `resolveLaunchDecision`.
 * Запускается приёмкой (scripts/acceptance.mjs) через esbuild: алиас `@` разрешается там.
 *
 * Проверяем не реализацию, а обещания продукта: гостю вход вместо редиректа,
 * повторный заход без вопроса, смена валюты только когда выбор реально есть,
 * отсутствие тихой конвертации и касса вместо «выберите валюту перед спином».
 */
import { firstSupported, resolveLaunchDecision, switchQuestionKind, type LaunchContext } from '@/lib/launch-decision'
import type { Currency, Game, WalletBalance } from '@/types'

const GAME: Pick<Game, 'currencies'> = { currencies: ['RUB', 'KZT', 'USDT'] }

const wallet = (currency: Currency, balance: number): Pick<WalletBalance, 'currency' | 'balance'> => ({ currency, balance })

const context = (overrides: Partial<LaunchContext> = {}): LaunchContext => ({
  isAuthenticated: true,
  activeCurrency: 'RUB',
  wallets: [wallet('RUB', 0), wallet('KZT', 0), wallet('USDT', 0)],
  lastPlayedCurrency: undefined,
  ...overrides
})

const describe = (value: unknown): string => {
  if (typeof value !== 'object' || value === null) return String(value)
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== 'supported')
    .map(([key, item]) => `${key}=${Array.isArray(item) ? item.join('/') : item}`)
  return entries.join(' ')
}

interface Case {
  name: string
  actual: string
  expected: string
}

const cases: Case[] = []

function scenario(name: string, ctx: LaunchContext, expected: string, game: Pick<Game, 'currencies'> = GAME) {
  cases.push({ name, actual: describe(resolveLaunchDecision(game, ctx)), expected })
}

// 1. Гость: вход, а не редирект и не «войдите, чтобы играть».
scenario('гость → вход', context({ isAuthenticated: false }), 'kind=login')

// 2. Повторный заход в ту же игру — сразу знакомая валюта, даже если активна другая.
scenario(
  'последняя игранная валюта с балансом → игра без вопроса',
  context({ lastPlayedCurrency: 'KZT', wallets: [wallet('RUB', 5000), wallet('KZT', 8200)] }),
  'kind=play currency=KZT'
)
scenario(
  'последняя игранная валюта пуста → не подсказываем её',
  context({ lastPlayedCurrency: 'KZT', wallets: [wallet('RUB', 1200), wallet('KZT', 0)] }),
  'kind=play currency=RUB'
)
scenario(
  'последняя игранная валюта не поддерживается игрой → не подставляем её',
  // UAH игрок крутил в другой игре: здесь она не принимается, хотя деньги на ней есть.
  context({ lastPlayedCurrency: 'UAH', wallets: [wallet('RUB', 700), wallet('UAH', 500)] }),
  'kind=play currency=RUB'
)

// 3. Активный кошелёк не пуст и подходит — играем сразу, без обязательного выбора валюты.
scenario('активный не пуст и поддерживается → игра', context({ wallets: [wallet('RUB', 1200)] }), 'kind=play currency=RUB')

// 4. Активный пуст, деньги в другом — короткий вопрос вместо пустого спина.
scenario(
  'в ₽ пусто, есть ₸ → предложение сменить валюту',
  context({ wallets: [wallet('RUB', 0), wallet('KZT', 8200)] }),
  'kind=switch currency=KZT'
)
scenario(
  'фиат важнее крипты при выборе альтернативы',
  context({ activeCurrency: 'UAH', wallets: [wallet('UAH', 0), wallet('USDT', 150), wallet('KZT', 8200)] }),
  'kind=switch currency=KZT'
)

// 5. Активная валюта не поддерживается: честный выбор либо стоп без конвертации.
scenario(
  'провайдер не принимает активную, есть другая с балансом → смена',
  context({ activeCurrency: 'BTC', wallets: [wallet('RUB', 3000), wallet('BTC', 0.4)] }),
  'kind=switch currency=RUB'
)
scenario(
  'провайдер не принимает активную, других кошельков нет → стоп',
  // Игра принимает только RUB: активная UAH не подходит, альтернатив нет.
  context({ activeCurrency: 'UAH', wallets: [wallet('UAH', 1500)] }),
  'kind=unsupported currency=UAH',
  { currencies: ['RUB'] }
)
scenario(
  'UZS не поддерживается игрой и пуст → стоп, а не касса в чужой валюте',
  context({ activeCurrency: 'UZS', wallets: [wallet('UZS', 0)] }),
  'kind=unsupported currency=UZS'
)

// 6. Пусто везде — касса активной валюты (не «выберите валюту», не общий счёт).
scenario('все кошельки пустые → касса активной валюты', context({ activeCurrency: 'KZT' }), 'kind=deposit currency=KZT')

// Вопросы формулируются честно и по-разному для двух ситуаций.
cases.push({
  name: 'текст вопроса: пусто против неподдерживаемой',
  actual: [
    switchQuestionKind(context({ wallets: [wallet('RUB', 0)] }), 'RUB'),
    switchQuestionKind(context({ wallets: [wallet('RUB', 500)] }), 'RUB')
  ].join('/'),
  expected: 'empty/unsupported'
})

// Приоритет валют в альтернативе: фиат по порядку релиза, затем крипта.
cases.push({
  name: 'порядок альтернатив: ₸ важнее USDT',
  actual: firstSupported(['USDT', 'KZT', 'BTC'], GAME) ?? 'нет',
  expected: 'KZT'
})
cases.push({
  name: 'альтернативы нет, если провайдер их не принимает',
  actual: firstSupported(['UAH', 'BTC'], GAME) ?? 'нет',
  expected: 'нет'
})

const failed = cases.filter((item) => item.actual !== item.expected)
for (const item of cases) {
  const mark = item.actual === item.expected ? '✓' : '✗'
  console.log(`${mark} ${item.name}: ${item.actual}`)
  if (item.actual !== item.expected) console.log(`    ожидалось ${item.expected}`)
}

console.log(`\n${cases.length - failed.length}/${cases.length} сценариев запуска соблюдены`)
process.exit(failed.length === 0 ? 0 : 1)
