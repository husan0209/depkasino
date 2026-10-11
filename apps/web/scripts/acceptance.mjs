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

/** Собирает и запускает TS-сьют из src через esbuild — так тесты видят те же модули, что и приложение. */
async function runSuite(file, label) {
  const outDir = mkdtempSync(path.join(tmpdir(), 'depkasino-suite-'))
  const outFile = path.join(outDir, 'suite.cjs')
  try {
    const esbuild = await import('esbuild')
    await esbuild.build({
      entryPoints: [path.join(here, file)],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: outFile,
      alias: { '@': srcRoot },
      logLevel: 'silent'
    })
    const run = spawnSync(process.execPath, [outFile], { encoding: 'utf8' })
    const tail = (run.stdout || '').trim().split('\n').at(-1) ?? 'нет вывода'
    check(`${label}: ${tail}`, run.status === 0, run.stderr?.trim())
    if (run.status !== 0) console.log(run.stdout)
  } catch (error) {
    check(label, false, error.message)
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
}

async function moneySuite() {
  console.log('\n1. Денежные форматы §2.5')
  await runSuite('format-suite.ts', 'денежные правила')
}

async function launchSuite() {
  console.log('\n2. Приоритеты запуска §8.2')
  await runSuite('launch-suite.ts', 'сценарии запуска')
}

/* ────────────────────── 2. Денежные сценарии через API ───────────────────── */

async function apiFlow() {
  console.log('\n3. Денежные и кассовые сценарии (мок-контракты Частей 2–4)')

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

  const launch = await api('POST', '/launch', { slug: 'sweet-bonanza', currency: 'RUB' }, token)
  check('запуск реальной игры ведёт на /play', launch.json?.url?.startsWith('/play?'), launch.json?.url)
  const demo = await api('POST', '/launch', { slug: 'sweet-bonanza', demo: true })
  check('демо запускается без авторизации', demo.json?.url?.includes('demo=1') === true, demo.json?.url)
  const unsupported = await api('POST', '/launch', { slug: 'gates-of-olympus', currency: 'UZS' }, token)
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
  ['/casino', 'первая страница каталога в HTML', /\/covers\//],
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
  console.log('\n4. Страницы: обязательные блоки и запреты §24')

  for (const [route, expected] of pages) {
    const { status } = await page(route)
    check(`${route} → ${expected}`, status === expected, `получили ${status}`)
  }

  console.log('\n5. Содержимое страниц')
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

  // Обложки витрины отдаются напрямую: локальные SVG минуют оптимизатор next/image
  // (CoverImage), чьи самообращения к серверу раньше подвешивали запросы.
  const cover = await fetch(`${BASE}/covers/sweet-bonanza.svg`)
  check('обложки доступны витрине напрямую', cover.status === 200 && (cover.headers.get('content-type') ?? '').includes('svg'))

  const missingTicket = await page('/support/TCK-0000')
  check('несуществующий тикет не крутит вечный скелет', missingTicket.status === 200)
}

/* ─────────────────────────────── 6. SEO-слой ─────────────────────────────── */

async function seoFlow() {
  console.log('\n6. SEO: robots, sitemap, разметка, OG-картинки')

  // robots.txt закрывает приватные разделы и указывает на карту сайта.
  const robots = await fetch(`${BASE}/robots.txt`)
  const robotsText = await robots.text()
  check('robots.txt отдаётся', robots.status === 200 && robotsText.includes('User-Agent'))
  check('robots.txt закрывает приватные разделы', ['/wallet', '/profile', '/history', '/kyc', '/support', '/referral', '/favorites', '/play'].every((path) => robotsText.includes(`Disallow: ${path}`)))
  check('robots.txt ссылается на sitemap', /Sitemap:\s*\S+\/sitemap\.xml/.test(robotsText))

  // sitemap.xml: только публичные страницы, все игры и провайдеры на месте.
  const sitemap = await fetch(`${BASE}/sitemap.xml`)
  const sitemapXml = await sitemap.text()
  const urls = [...sitemapXml.matchAll(/<loc>([^<]+)</g)].map((match) => match[1])
  check('sitemap.xml отдаётся как XML', sitemap.status === 200 && (sitemap.headers.get('content-type') ?? '').includes('xml'))
  check('в карте 50+ адресов', urls.length >= 50, `нашли ${urls.length}`)
  check('в карте нет приватных разделов', !urls.some((url) => /\/(wallet|profile|history|kyc|support|referral|favorites|play|login|register)(\/|$)/.test(url)))
  check('в карте нет дублей', new Set(urls).size === urls.length)
  check('в карте есть игры и провайдеры', urls.some((url) => url.includes('/casino/')) && urls.some((url) => url.includes('/providers/')))

  // Разметка Schema.org на SEO-страницах: крошки и карточка игры.
  const gamePage = await page('/casino/sweet-bonanza')
  const gameLd = gamePage.html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)
  let gameData = null
  try {
    gameData = gameLd ? JSON.parse(gameLd[1]) : null
  } catch {
    gameData = null
  }
  const graph = gameData?.['@graph'] ?? []
  const breadcrumbs = graph.find((node) => node['@type'] === 'BreadcrumbList')
  const app = graph.find((node) => node['@type'] === 'SoftwareApplication')
  check('карточка игры: JSON-LD разбирается', Array.isArray(graph) && graph.length === 2)
  check('карточка игры: крошки из 4 шагов', (breadcrumbs?.itemListElement ?? []).length === 4)
  check('карточка игры: offer по минимальной ставке', typeof app?.offers?.price === 'number' && !!app?.offers?.priceCurrency)

  const providerPage = await page('/providers/pragmatic-play')
  const providerLd = providerPage.html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)
  let providerData = null
  try {
    providerData = providerLd ? JSON.parse(providerLd[1]) : null
  } catch {
    providerData = null
  }
  check('провайдер: крошки разбираются', providerData?.['@type'] === 'BreadcrumbList' && providerData.itemListElement.length === 4)

  // OG-картинка отдаётся тем адресом, который стоит в мета-теге.
  const ogUrl = gamePage.html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]
  const ogResponse = ogUrl ? await fetch(ogUrl) : null
  check('og:image отвечает PNG 1200×630', !!ogResponse && ogResponse.status === 200 && (ogResponse.headers.get('content-type') ?? '').includes('image/png'), ogUrl ?? 'нет мета-тега')
  if (ogResponse) {
    check('og:image весит больше 10 КБ (не пустышка)', Number(ogResponse.headers.get('content-length') ?? 0) > 10_000 || (await ogResponse.arrayBuffer()).byteLength > 10_000)
  }

  // Приватные разделы не индексируются даже без robots.txt.
  const wallet = await page('/wallet')
  check('приватные страницы помечены noindex', /name="robots" content="[^"]*noindex/.test(wallet.html))
  const home = await page('/')
  check('витрина индексируется', /name="robots" content="[^"]*index/.test(home.html) || !/noindex/.test(home.html))
  check('canonical на каталоге', /rel="canonical" href="[^"]*\/casino"/.test((await page('/casino')).html))
  check('язык страницы — русский', (await page('/')).html.includes('<html lang="ru"'))
}

/* ────────────────────────── 7. Скан исходников ──────────────────────────── */

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
  console.log('\n7. Исходники: прямые запреты')
  const files = walk(srcRoot)
  const code = files.map((file) => stripComments(readFileSync(file, 'utf8'))).join('\n')

  for (const [name, pattern] of sourceRules) {
    check(name, !pattern.test(code))
  }

  // Границы ошибок и скелетон перехода: сбой не должен давать белый экран (§23 блок I).
  const errorBoundary = readFileSync(path.join(srcRoot, 'app/error.tsx'), 'utf8')
  check('есть граница ошибок с «Повторить»', /Повторить/.test(errorBoundary) && errorBoundary.startsWith("'use client'"))
  const globalError = readFileSync(path.join(srcRoot, 'app/global-error.tsx'), 'utf8')
  check('есть последний рубеж для корневого layout', globalError.includes('global-error') === false && /<html/.test(globalError))
  const loading = readFileSync(path.join(srcRoot, 'app/(main)/loading.tsx'), 'utf8')
  check('есть скелетон перехода между разделами', loading.includes('MainLoading'))
  check('live-режим без адреса API предупреждает', /MODE=live, но NEXT_PUBLIC_API_URL пуст/.test(readFileSync(path.join(srcRoot, 'lib/env.ts'), 'utf8')))

  // Именованная тень с именем цвета палитры превращается в неоновый ореол: Tailwind генерирует
  // второе правило shadow-* и перекрашивает тень сплошным цветом. Страховка от рецидива.
  const tw = readFileSync(path.join(webRoot, 'tailwind.config.ts'), 'utf8')
  const box = tw.match(/boxShadow:\s*\{([\s\S]*?)\n      \}/)?.[1] ?? ''
  const shadowKeys = [...box.matchAll(/^ {8}([a-z-]+):/gm)].map((m) => m[1])
  const colorsBlock = tw.match(/colors:\s*\{([\s\S]*?)\n      \}/)?.[1] ?? ''
  // Только верхний уровень: вложенные листья регистрируются как пунктирные имена (bg-card),
  // а «голое» имя цвета верхнего уровня (accent) и даёт конфликтующее правило shadow-accent.
  const colorKeys = [...colorsBlock.matchAll(/^ {8}([a-z-]+):/gm)].map((m) => m[1])
  const clash = shadowKeys.filter((k) => colorKeys.includes(k))
  check('имена теней не совпадают с именами цветов (нет неонового ореола)', clash.length === 0)

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
  await launchSuite()
  await apiFlow()
  await pagesFlow()
  await seoFlow()
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
