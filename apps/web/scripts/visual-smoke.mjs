/**
 * Интерактивный visual-smoke: реальный браузер, мобильные ширины (360/390/430), живые сценарии —
 * гостевой запуск через LoginSheet, вход, касса, KYC-стоп, oauth-409, жесты колоды (§4.4):
 * свайпы влево-вправо, кроссфейд при prefers-reduced-motion, драг вверх на десктопе, Escape.
 * Плюс переполнение по горизонтали и ошибки консоли на 17 маршрутах.
 *
 * Браузер сознательно НЕ в зависимостях проекта (67 МБ): ставится отдельно и только для проверки:
 *   npm i --no-save puppeteer-core @sparticuz/chromium
 *   # распаковать al2023.tar.br и swiftshader.tar.br из пакета (libnspr4/libnss3/libnssutil3),
 *   # шрифты с кириллицей положить в каталог fontconfig
 *   SHOT_LIBS=<папка с lib> FONTCONFIG_PATH=<папка с fonts.conf> npm run visual-smoke
 *
 * Переменные: SHOT_LIBS, SHOT_OUT (куда класть снимки), BASE_URL.
 */
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] ?? process.env.BASE_URL ?? 'http://localhost:3000'
const OUT = process.env.SHOT_OUT ?? 'visual-smoke-out'
mkdirSync(OUT, { recursive: true })
const WIDTHS = [360, 390, 430]
const report = []
const fail = (msg) => { report.push(`✗ ${msg}`); console.log(`✗ ${msg}`) }
const pass = (msg) => { report.push(`✓ ${msg}`); console.log(`✓ ${msg}`) }

const browser = await puppeteer.launch({
  args: [...chromium.args, '--lang=ru-RU'],
  executablePath: await chromium.executablePath(),
  headless: true,
  env: { ...process.env, LD_LIBRARY_PATH: process.env.SHOT_LIBS ?? '/tmp/shot/libs' }
})

async function openPage(width, tokens) {
  const page = await browser.newPage()
  await page.setViewport({ width, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)) })
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 120)))
  page._errs = errors
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await page.evaluate((t) => {
    localStorage.clear()
    if (t) { localStorage.setItem('dk_access_token', t.access); localStorage.setItem('dk_refresh_token', t.refresh) }
  }, tokens ?? null)
  return page
}

async function overflow(page, label) {
  const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  if (o > 1) fail(`${label}: горизонтальное переполнение ${o}px`)
  return o
}

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

// ── A. Гостевые маршруты на трёх ширинах: переполнение и ошибки консоли ──
const GUEST_ROUTES = ['/', '/casino', '/casino/sweet-bonanza', '/providers', '/login', '/register', '/search']
for (const w of WIDTHS) {
  for (const route of GUEST_ROUTES) {
    const page = await openPage(w)
    await page.goto(BASE + route, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 700))
    const o = await overflow(page, `${w}px ${route}`)
    if (o <= 1 && page._errs.length === 0) pass(`${w}px ${route}: чисто`)
    if (page._errs.length) fail(`${w}px ${route}: console ${page._errs[0]}`)
    await page.close()
  }
}

// ── B. Гость тапает по обложке колоды → LoginSheet, а не редирект ──
{
  const page = await openPage(390)
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 800))
  const playBtn = await page.$('button:has-text("Играть")').catch(() => null)
  const btn = playBtn ?? (await page.evaluateHandle(() =>
    [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Играть')))
  await btn.asElement()?.click()
  await new Promise((r) => setTimeout(r, 900))
  const onLoginRoute = page.url().includes('/login')
  const sheetText = await page.evaluate(() => document.body.innerText)
  const sheet = /Войти|Продолжить как гость|Регистрация/.test(sheetText) && !onLoginRoute
  if (onLoginRoute) fail('гость: тап по «Играть» увёл редиректом на /login')
  else if (sheet) pass('гость: тап по «Играть» открыл LoginSheet поверх экрана')
  else fail('гость: после тапа по «Играть» не видно ни шита, ни редиректа')
  await shot(page, 'guest-launch-sheet-390')
  await page.close()
}

// ── C. Вход через форму ──
async function loginTokens() {
  const page = await openPage(390)
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 600))
  await page.type('input[type="email"], input[name="email"]', 'player@example.com')
  await page.type('input[type="password"]', 'secret123')
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((b) => /Войти/.test(b.textContent))?.click()
  })
  await new Promise((r) => setTimeout(r, 1500))
  const t = await page.evaluate(() => ({
    access: localStorage.getItem('dk_access_token'),
    refresh: localStorage.getItem('dk_refresh_token')
  }))
  await page.close()
  return t
}

let tokens = await loginTokens()
if (tokens?.access) pass('вход через форму: токены получены')
else fail('вход через форму: токенов нет')

// ── D. Защищённые маршруты на трёх ширинах ──
const PLAYER_ROUTES = ['/wallet', '/wallet/transactions', '/history', '/kyc', '/support', '/referral', '/profile', '/profile/settings', '/profile/sessions', '/favorites']
for (const w of WIDTHS) {
  for (const route of PLAYER_ROUTES) {
    const page = await openPage(w, tokens)
    await page.goto(BASE + route, { waitUntil: 'networkidle2' })
    await new Promise((r) => setTimeout(r, 700))
    const o = await overflow(page, `${w}px ${route}`)
    if (o <= 1 && page._errs.length === 0) pass(`${w}px ${route}: чисто`)
    if (page._errs.length) fail(`${w}px ${route}: console ${page._errs[0]}`)
    await page.close()
  }
}

// ── E. DepositSheet: один экран, пресеты с символом валюты ──
{
  const page = await openPage(390, tokens)
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 700))
  await page.click('[aria-label="Пополнить"]')
  await new Promise((r) => setTimeout(r, 900))
  const text = await page.evaluate(() => document.body.innerText)
  if (/Пополнить/.test(text) && /\d[\d\s]*₽/.test(text)) pass('DepositSheet: открыт, пресеты с символом ₽')
  else fail('DepositSheet: не открылся или пресеты без символа')
  await shot(page, 'deposit-sheet-390')
  await page.close()
}

// ── F. WithdrawSheet при KYC не approved: стоп с одной кнопкой ──
{
  const page = await openPage(390, tokens)
  await page.goto(BASE + '/wallet', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 700))
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button, a')].find((b) => /Вывести/.test(b.textContent))
    btn?.click()
  })
  await new Promise((r) => setTimeout(r, 900))
  const text = await page.evaluate(() => document.body.innerText)
  const kycStop = /верификац|KYC|Подтвердить/i.test(text)
  if (kycStop) pass('WithdrawSheet: KYC-стоп виден')
  else fail('WithdrawSheet: KYC-стоп не найден')
  await shot(page, 'withdraw-kyc-390')
  await page.close()
}

// ── G. oauth-аккаунт: пояснение вместо формы пароля + 409 на API ──
{
  const page = await openPage(390)
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 600))
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((b) => /Google/.test(b.textContent))?.click()
  })
  await new Promise((r) => setTimeout(r, 1500))
  await page.goto(BASE + '/profile', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 600))
  await page.evaluate(() => {
    [...document.querySelectorAll('button, a')].find((b) => /Безопасность/.test(b.textContent))?.click()
  })
  await new Promise((r) => setTimeout(r, 900))
  const text = await page.evaluate(() => document.body.innerText)
  if (/Вы вошли через Google/.test(text)) pass('oauth-аккаунт: на «Безопасность» пояснение вместо формы пароля')
  else fail('oauth-аккаунт: пояснение не найдено')
  const api = await page.evaluate(async () => {
    const token = localStorage.getItem('dk_access_token')
    const res = await fetch('/api/v1/users/me/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: 'x', newPassword: 'newpass123' })
    })
    const json = await res.json()
    return { status: res.status, code: json?.code ?? json?.error?.code }
  })
  if (api.status === 409 && String(api.code).includes('oauth')) pass('oauth: API отвечает 409 oauth_account')
  else fail(`oauth: API вернул ${api.status} ${api.code}`)
  await shot(page, 'security-oauth-390')
  await page.close()
}

// ── H. Жесты колоды (§4.4): свайпы, финальная карта, reduced-motion, драг вверх ──
// Мок одностессионный, как настоящий бэкенд: oauth-вход в G выпустил новую пару токенов,
// поэтому перед жестами входим заново.
tokens = await loginTokens()
async function deckCounter(page) {
  return page.evaluate(() => {
    const el = [...document.querySelectorAll('span,div,p')].find((n) => /^\d+\/\d+$/.test(n.textContent.trim()))
    return el ? el.textContent.trim() : null
  })
}
async function swipe(page, fromX, toX, y) {
  const client = await page.createCDPSession()
  const steps = 12
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: fromX, y }] })
  for (let i = 1; i <= steps; i += 1) {
    const x = fromX + ((toX - fromX) * i) / steps
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
    await new Promise((r) => setTimeout(r, 16))
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await new Promise((r) => setTimeout(r, 900))
}
{
  const page = await openPage(390, tokens)
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 900))
  const before = await deckCounter(page)
  await swipe(page, 320, 60, 620)
  const afterLeft = await deckCounter(page)
  if (before && afterLeft && before !== afterLeft) pass(`свайп влево листает колоду: ${before} → ${afterLeft}`)
  else fail(`свайп влево не листает: ${before} → ${afterLeft}`)
  await swipe(page, 60, 320, 620)
  const afterRight = await deckCounter(page)
  if (afterRight === before) pass('свайп вправо возвращает предыдущую карту')
  else fail(`свайп вправо: ${afterLeft} → ${afterRight}, ждали ${before}`)
  await shot(page, 'deck-after-swipe-390')
  await page.close()
}
{
  // prefers-reduced-motion: колода работает, но без параллакса (кроссфейд)
  const page = await openPage(390, tokens)
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 900))
  const before = await deckCounter(page)
  await swipe(page, 320, 60, 620)
  const after = await deckCounter(page)
  if (before && after && before !== after) pass('reduced-motion: колода листается кроссфейдом')
  else fail(`reduced-motion: колода не листается (${before} → ${after})`)
  await page.close()
}
{
  // Десктоп: драг вверх по фронт-карте = запуск (§4.4)
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  page._errs = []
  page.on('pageerror', (e) => page._errs.push(e.message.slice(0, 100)))
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await page.evaluate((t) => {
    localStorage.clear()
    localStorage.setItem('dk_access_token', t.access)
    localStorage.setItem('dk_refresh_token', t.refresh)
  }, tokens)
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 1000))
  const card = await page.evaluate(() => {
    const title = [...document.querySelectorAll('p')].find((n) => n.textContent.trim() === 'Sweet Bonanza')
    const target = title?.closest('div')
    if (!target) return null
    const r = target.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  })
  if (!card) fail('десктоп: не нашёл фронт-карту колоды для драга')
  else {
    await page.mouse.move(card.x, card.y)
    await page.mouse.down()
    for (let i = 1; i <= 10; i += 1) {
      await page.mouse.move(card.x, card.y - i * 22, { steps: 2 })
      await new Promise((r) => setTimeout(r, 16))
    }
    await page.mouse.up()
    await new Promise((r) => setTimeout(r, 1500))
    if (page.url().includes('/play?game=')) pass('десктоп: драг вверх по фронт-карте запускает игру')
    else fail(`десктоп: драг вверх не запустил игру, url=${page.url()}`)
  }
  await page.close()
}
{
  // Escape закрывает DepositSheet
  const page = await openPage(390, tokens)
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 700))
  try {
    await page.waitForSelector('[aria-label="Пополнить"]', { timeout: 8000 })
  } catch {
    const diag = await page.evaluate(() => ({
      url: location.href,
      header: document.querySelector('header')?.innerText.replace(/\n/g, ' | ').slice(0, 100),
      session: document.documentElement.getAttribute('data-session')
    }))
    fail(`Escape-шаг: нет кнопки депозита: ${JSON.stringify(diag)}`)
    await page.close()
    await browser.close()
    console.log(report.join('\n'))
    process.exit(1)
  }
  await page.click('[aria-label="Пополнить"]')
  await new Promise((r) => setTimeout(r, 800))
  await page.keyboard.press('Escape')
  await new Promise((r) => setTimeout(r, 600))
  const still = await page.evaluate(() => /Сумма пополнения|Способ пополнения/.test(document.body.innerText))
  if (!still) pass('Escape закрывает DepositSheet')
  else fail('Escape не закрыл DepositSheet')
  await page.close()
}

await browser.close()
const fails = report.filter((r) => r.startsWith('✗'))
console.log(report.join('\n'))
console.log(`\nИтого: ${report.length - fails.length} ок, ${fails.length} проблем`)
process.exit(0)
