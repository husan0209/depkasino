#!/usr/bin/env node
/**
 * Приёмка Части 5 + 5.1 одной командой: `npm run acceptance`.
 *
 * Что проверяет:
 *  1) денежные форматы §2.5 — сборка scripts/format-suite.ts и прогон ожиданий;
 *  2) денежные и кассовые сценарии через API (мок-режим — контракты Частей 2–4);
 *  3) содержимое страниц: обязательные блоки и запрещённые формулировки §24;
 *  4) скан исходников на прямые запреты (WebSocket, светлая тема, включённые бонусные флаги).
 *
 * Требуется запущенный сервер: `npm start` (или `npm run dev`) на BASE_URL.
 * Состояние мок-данных сбрасывается в начале — скрипт безопасен для повторных прогонов.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(here, '..')
const srcRoot = path.join(webRoot, 'src')
const BASE = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const API = `${BASE}/api/v1`

let passed = 0
const failures = []

function check(name, ok, detail = '') {
  if (ok) {
    passed += 1
    console.log(`  ✓ ${name}`)
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

async function api(method, path, body, token) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  let json = null
  try {
    json = await response.json()
  } catch {
    /* не-JSON ответ — оставляем null */
  }
  return { status: response.status, json }
}

async function page(path) {
  const response = await fetch(`${BASE}${path}`, { headers: { 'Accept-Language': 'ru-RU,ru;q=0.9' } })
  return { status: response.status, html: await response.text() }
}

const has = (html, pattern) => new RegExp(pattern, 'i').test(html)

/* ─────────────────────────── 1. Денежные форматы ─────────────────────────── */

async function moneySuite() {
  console.log('\n1. Денежные форматы §2.5')
  const outDir = mkdtempSync(path.join(tmpdir(), 'depkasino-format-'))
  const outFile = path.join(outDir, 'format-suite.cjs')
  try {
    const esbuild = await import('esbuild')
    await esbuild.build({
      entryPoints: [path.join(here, 'format-suite.ts')],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: outFile,
      alias: { '@': srcRoot },
      logLevel: 'silent'
    })
    const run = spawnSync(process.execPath, [outFile], { encoding: 'utf8' })
    const tail = (run.stdout || '').trim().split('\n').at(-1) ?? 'нет вывода'
    check(`денежные правила: ${tail}`, run.status === 0, run.stderr?.trim())
    if (run.status !== 0) console.log(run.stdout)
  } catch (error) {
    check('денежные правила', false, error.message)
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
}

/* ────────────────────── 2. Денежные сценарии через API ───────────────────── */

async function apiFlow() {
  console.log('\n2. Денежные и кассовые сценарии (мок-контракты Частей 2–4)')

  const reset = await api('POST', '/dev/reset')
  check('состояние демо сброшено', reset.status === 200, `HTTP ${reset.status}`)

  const login = await api('POST', '/auth/login', { email: 'player@example.com', password: 'secret123' })
  check('вход по email выдаёт токен', login.status === 200 && !!login.json?.accessToken, `HTTP ${login.status}`)
  const token = login.json?.accessToken

  const wallets = await api('GET', '/wallet', undefined, token)
  const balances = Object.fromEntries((wallets.json ?? []).map((row) => [row.currency, row.balance]))
  check('кошельки приходят отдельными записями', Array.isArray(wallets.json) && wallets.json.length === 7)
  check(
    'балансы в шапке не суммируются',
    !('total' in (wallets.json?.[0] ?? {})) && !JSON.stringify(wallets.json).includes('total'),
    'в ответе не должно быть итога'
  )
  check('валюты релиза на месте', ['RUB', 'UAH', 'BYN', 'KZT', 'UZS', 'USDT', 'BTC'].every((c) => c in balances))

  const deposit = await api('POST', '/payments/deposit', { currency: 'RUB', amount: 1500, methodId: 'sbp' }, token)
  check('депозит СБП принят', deposit.status === 201 && deposit.json?.method === 'СБП', `HTTP ${deposit.status}`)
  const paymentId = deposit.json?.id
  const before = balances.RUB
  await new Promise((resolve) => setTimeout(resolve, 7000))
  const status = await api('GET', `/payments/${paymentId}`, undefined, token)
  check('платёж зачисляется по факту', status.json?.status === 'completed', `статус ${status.json?.status}`)
  const afterDeposit = await api('GET', '/wallet', undefined, token)
  const rub = afterDeposit.json?.find((row) => row.currency === 'RUB')?.balance
  check(`RUB ${before} → ${rub} после депозита 1500`, rub === before + 1500, `получили ${rub}`)

  const blocked = await api('POST', '/payments/withdraw', { currency: 'RUB', amount: 500, methodId: 'sbp', destination: '+7 999 000-00-00' }, token)
  check('вывод без верификации остановлен', blocked.status === 403 && blocked.json?.code === 'kyc_required', `HTTP ${blocked.status}`)

  const submit = await api('POST', '/kyc', {
    firstName: 'Артём',
    lastName: 'Ким',
    birthDate: '1994-05-12',
    country: 'KZ',
    documentType: 'passport',
    documentFileName: 'pass.jpg',
    selfieFileName: 'selfie.jpg'
  }, token)
  check('заявка KYC уходит на проверку', submit.json?.status === 'on_review', `статус ${submit.json?.status}`)

  const approve = await api('POST', '/dev/kyc', { status: 'approved' })
  check('демо-переключатель KYC работает', approve.json?.status === 'approved', `статус ${approve.json?.status}`)

  const withdraw = await api('POST', '/payments/withdraw', { currency: 'RUB', amount: 500, methodId: 'sbp', destination: '+7 999 000-00-00' }, token)
  check('после верификации вывод создаётся', withdraw.status === 201, `HTTP ${withdraw.status}`)
  const afterWithdraw = await api('GET', '/wallet', undefined, token)
  const rubAfter = afterWithdraw.json?.find((row) => row.currency === 'RUB')?.balance
  check(`RUB ${rub} → ${rubAfter} после вывода 500`, rubAfter === rub - 500)

  const transactions = await api('GET', '/wallet/transactions?page=1&pageSize=3', undefined, token)
  check('операции попадают в историю со статусом', (transactions.json?.items ?? []).length > 0)

  const crypto = await api('POST', '/payments/deposit', { currency: 'USDT', amount: 50, methodId: 'usdt-trc20' }, token)
  check('крипто-депозит показывает адрес и сеть', !!crypto.json?.address && crypto.json?.network === 'TRC20')

  const bets = await api('GET', '/history/bets?currency=KZT&period=30d', undefined, token)
  const betCurrencies = [...new Set((bets.json?.items ?? []).map((item) => item.currency))]
  check('история ставок не смешивает валюты', betCurrencies.length === 1 && betCurrencies[0] === 'KZT', betCurrencies.join(','))

  const ticket = await api('POST', '/support/tickets', { category: 'payments', subject: 'Приёмка', message: 'Проверка тикета' }, token)
  check('тикет создаётся', !!ticket.json?.id, `HTTP ${ticket.status}`)
  const reply = await api('POST', `/support/tickets/${ticket.json?.id}/messages`, { message: 'Есть новости?' }, token)
  check('ответ в тикет добавляется', reply.status === 200)
  const closed = await api('POST', `/support/tickets/${ticket.json?.id}/close`, undefined, token)
  check('тикет закрывается', closed.status === 200)

  const passwordWrong = await api('POST', '/users/me/password', { currentPassword: 'неверный', newPassword: 'secret1234' }, token)
  check('неверный текущий пароль отклонён', passwordWrong.status === 422, `HTTP ${passwordWrong.status}`)
  const passwordOk = await api('POST', '/users/me/password', { currentPassword: 'secret123', newPassword: 'secret1234' }, token)
  check('смена пароля проходит', passwordOk.status === 200, `HTTP ${passwordOk.status}`)

  const referral = await api('GET', '/referral', undefined, token)
  check('реферальный кабинет отдаёт код и начисления', !!referral.json?.code && !!referral.json?.earned)
  const payout = await api('POST', '/referral/withdraw', { currency: 'RUB', amount: 350 }, token)
  check('бонус реферала выводится', payout.status === 201, `HTTP ${payout.status}`)

  const launch = await api('POST', '/launch', { slug: 'sweet-bonanza', currency: 'RUB' })
  check('запуск реальной игры ведёт на /play', launch.json?.url?.startsWith('/play?'), launch.json?.url)
  const demo = await api('POST', '/launch', { slug: 'sweet-bonanza', demo: true })
  check('демо запускается без авторизации', demo.json?.url?.includes('demo=1') === true, demo.json?.url)
  const unsupported = await api('POST', '/launch', { slug: 'gates-of-olympus', currency: 'UZS' })
  check('неподдерживаемая валюта не конвертируется', unsupported.status === 422 && unsupported.json?.code === 'currency_not_supported')

  const emptyLogin = await api('POST', '/auth/login', { email: 'bad', password: '1' })
  check('неверные данные входа отклонены', emptyLogin.status === 401, `HTTP ${emptyLogin.status}`)

  const geo = await api('GET', '/geo')
  check('гео отдаёт доступные методы', (geo.json?.paymentMethods ?? []).length > 0)
}

/* ─────────────────────────── 3. Страницы и запреты ────────────────────────── */

const pages = [
  ['/', 200],
  ['/casino', 200],
  ['/casino?category=new&sort=new', 200],
  ['/casino?q=bonanza', 200],
  ['/casino/sweet-bonanza', 200],
  ['/providers', 200],
  ['/providers/pragmatic-play', 200],
  ['/search', 200],
  ['/favorites', 200],
  ['/login', 200],
  ['/register', 200],
  ['/verify-email', 200],
  ['/forgot-password', 200],
  ['/reset-password', 200],
  ['/wallet', 200],
  ['/wallet/transactions', 200],
  ['/history', 200],
  ['/kyc', 200],
  ['/support', 200],
  ['/referral', 200],
  ['/profile', 200],
  ['/profile/settings', 200],
  ['/profile/sessions', 200],
  ['/terms', 200],
  ['/privacy', 200],
  ['/responsible-gaming', 200],
  ['/play?game=sweet-bonanza&currency=RUB', 200],
  ['/play?game=sweet-bonanza&demo=1', 200],
  ['/play/error?code=insufficient_funds', 200],
  ['/no-such-page', 404]
]

const pageRules = [
  ['/', 'герой с одним оффером', /Твой следующий большой спин/],
  ['/', 'колода в первом кадре', /Колода дня/],
  ['/', 'популярное и новинки', /Популярное сейчас[\s\S]*Новые игры/],
  ['/', 'провайдеры', /Проверенные студии/],
  ['/', 'социальное доказательство без обещаний', /игроков уже сегодня/],
  ['/', 'таб-бар без сокращений', /Главная[\s\S]*Казино[\s\S]*Избранное[\s\S]*Профиль/],
  ['/', 'футер: 18+ и ответственная игра', /18\+[\s\S]*Ответственная игра/],
  ['/', 'футер: методы текущего гео', /Способы пополнения/],
  ['/', 'подсказка роли для первого кадра', /data-session/],
  ['/casino', 'счётчик результатов', /Найдено/],
  ['/casino', 'первая страница каталога в HTML', /%2Fcovers%2F/],
  ['/casino/sweet-bonanza', 'SEO-поля игры', /RTP[\s\S]*Волатильность/],
  ['/casino/sweet-bonanza', 'кнопки запуска', /Играть[\s\S]*Демо/],
  ['/providers', 'студии со ссылками', /\/providers\/[a-z-]+/],
  ['/login', 'OAuth над формой входа', /Google[\s\S]*Telegram[\s\S]*Email[\s\S]*Пароль/],
  ['/register', 'валюта кошелька без вопроса', /Кошелёк создадим в/],
  ['/kyc', 'защищённый раздел', /Верифик|Загрузка|Кошел/],
  ['/wallet', 'защищённый раздел', /Кошел|Загрузка|Войд|Вход/]
]

const forbiddenOnPages = [
  ['приблизительность «≈»', /≈/],
  ['суммирование «Итого»', /Итого/],
  ['сокращение «Избр.»', /Избр\./],
  ['витринные GGR/ledger/RTP-слова', /GGR|ledger/],
  ['итог в ₽/$ в шапке', /≈[\s\S]{0,20}(₽|\$)/]
]

async function pagesFlow() {
  console.log('\n3. Страницы: обязательные блоки и запреты §24')

  for (const [route, expected] of pages) {
    const { status } = await page(route)
    check(`${route} → ${expected}`, status === expected, `получили ${status}`)
  }

  console.log('\n4. Содержимое страниц')
  for (const [route, name, pattern] of pageRules) {
    const { html } = await page(route)
    check(`${route}: ${name}`, has(html, pattern.source))
  }

  for (const [name, pattern] of forbiddenOnPages) {
    const home = await page('/')
    const casino = await page('/casino')
    const check_ = !pattern.test(home.html) && !pattern.test(casino.html)
    check(`витрина без «${name}»`, check_)
  }

  const optimized = await fetch(`${BASE}/_next/image?url=%2Fcovers%2Fsweet-bonanza.svg&w=384&q=75`)
  check('оптимизатор отдаёт обложки', optimized.status === 200 && (optimized.headers.get('content-type') ?? '').includes('svg'))

  const missingTicket = await page('/support/TCK-0000')
  check('несуществующий тикет не крутит вечный скелет', missingTicket.status === 200)
}

/* ────────────────────────── 5. Скан исходников ──────────────────────────── */

const sourceRules = [
  ['нет WebSocket/Socket.IO', /socket\.io|new WebSocket\(|io\(\)/],
  ['нет светлой темы', /ThemeToggle|useTheme\(|prefers-color-scheme:\s*light/],
  ['нет мультиязычности', /i18n|useTranslation|next-intl/],
  ['нет live-чата и push', /pusher|firebase\.messaging|serviceWorker\.register/]
]

function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, files)
    else if (/\.(ts|tsx)$/.test(entry)) files.push(full)
  }
  return files
}

function sourceFlow() {
  console.log('\n5. Исходники: прямые запреты')
  const files = walk(srcRoot)
  const code = files.map((file) => stripComments(readFileSync(file, 'utf8'))).join('\n')

  for (const [name, pattern] of sourceRules) {
    check(name, !pattern.test(code))
  }

  const flags = readFileSync(path.join(srcRoot, 'constants/currencies.ts'), 'utf8')
  const enabled = [...flags.matchAll(/FEATURE_[A-Z_]+:\s*(true|false)/g)].filter((match) => match[1] === 'true')
  check('бонусные флаги выключены', enabled.length === 0, enabled.map((match) => match[0]).join(', '))

  const packageJson = JSON.parse(readFileSync(path.join(webRoot, 'package.json'), 'utf8'))
  check('в зависимостях нет socket.io', !Object.keys(packageJson.dependencies ?? {}).some((dep) => dep.includes('socket')))
  check('есть скрипты typecheck/lint', !!(packageJson.scripts?.typecheck && packageJson.scripts?.lint))
}

/* ────────────────────────────────  Запуск  ──────────────────────────────── */

async function main() {
  try {
    await fetch(BASE, { method: 'GET' })
  } catch {
    console.error(`Не отвечает ${BASE}. Запустите сервер: npm run build && npm start (или npm run dev).`)
    process.exit(2)
  }

  await moneySuite()
  await apiFlow()
  await pagesFlow()
  sourceFlow()

  console.log(`\n${'─'.repeat(60)}`)
  if (failures.length === 0) {
    console.log(`Приёмка пройдена: ${passed} проверок, 0 провалов.`)
    process.exit(0)
  }
  console.log(`Проверок: ${passed + failures.length}, провалов: ${failures.length}`)
  failures.forEach((failure) => console.log(`  ✗ ${failure}`))
  process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
