import { MOCK_GAMES, findGame, similarGames } from './games'
import { MOCK_PROVIDERS, findProvider } from './providers'
import { CRYPTO_METHODS, resolveGeo } from './geo'
import { getState, resetState, touchWallet, type PaymentIntent } from './state'
import type { Currency, Game, KycState, KycStatus, Paginated, Transaction, User } from '@/types'

/**
 * Мини-бэкенд для разработки фронта: повторяет контракты Частей 2–4.
 * Подключается автоматически при NEXT_PUBLIC_API_MODE=mock (по умолчанию).
 */

export interface MockRequest {
  method: string
  segments: string[]
  query: URLSearchParams
  body: Record<string, unknown>
  hostname: string
}

export interface MockResponse {
  status: number
  body: unknown
}

const ok = (body: unknown, status = 200): MockResponse => ({ status, body })
const fail = (status: number, code: string, message: string): MockResponse => ({
  status,
  body: { code, message }
})

function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const start = (page - 1) * pageSize
  const slice = items.slice(start, start + pageSize)
  return { items: slice, page, pageSize, total: items.length, hasMore: start + slice.length < items.length }
}

/**
 * Мок-модерация KYC: заявка «на проверке» становится одобренной через ~15 c.
 * Нужно, чтобы вывод (который по правилам доступен только после верификации)
 * проходился в демо-режиме целиком, а не упирался в вечный on_review.
 */
function autoReviewKyc(): void {
  const state = getState()
  if (state.kyc.status !== 'on_review' || !state.kyc.submittedAt) return
  if (Date.now() - +new Date(state.kyc.submittedAt) < 15_000) return
  state.kyc = { ...state.kyc, status: 'approved' }
  if (state.user) {
    state.user.kycStatus = 'approved'
    state.user.withdrawalBlockedByKyc = false
  }
}

function autoConfirmPayments(): void {
  const state = getState()
  Object.values(state.payments).forEach((intent) => {
    if (intent.kind !== 'deposit') return
    if (Date.now() - intent.createdAt < intent.confirmAfterMs) return
    const existing = state.transactions.find((t) => t.id === `tx_${intent.id}`)
    if (existing) return

    const target = intent.currency === 'BTC'
      ? Number((intent.amount * 0.35).toFixed(8))
      : intent.currency === 'USDT'
        ? Number((intent.amount * 1).toFixed(2))
        : intent.amount

    touchWallet(intent.currency, target)
    state.transactions.unshift({
      id: `tx_${intent.id}`,
      type: 'deposit',
      status: 'completed',
      amount: target,
      currency: intent.currency,
      createdAt: new Date().toISOString(),
      method: intent.method,
      network: intent.network,
      rate: intent.currency === 'BTC' ? 5_940_000 : intent.currency === 'USDT' ? 92.4 : undefined
    })
  })
}

const CRYPTO_ADDRESSES: Record<string, string> = {
  USDT: 'TXk9pQ2mV4dHs7LbWz3nYq8Rt6Ca1Ed5Uf',
  BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
}

export function handleMockRequest(req: MockRequest): MockResponse {
  const { method, segments, query, body } = req
  const path = segments.join('/')
  const state = getState()
  autoConfirmPayments()

  /* ───────── geo ───────── */
  if (path === 'geo' && method === 'GET') {
    return ok(resolveGeo(req.hostname))
  }

  /* ───────── auth / users ───────── */
  if (path === 'auth/login' && method === 'POST') {
    const email = String(body.email ?? '')
    const password = String(body.password ?? '')
    if (!email || password.length < 6) {
      return fail(401, 'invalid_credentials', 'Неверный email или пароль')
    }
    if (!state.user) state.user = { ...(getState().user ?? {}) as User }
    state.user = { ...state.user, email }
    state.password = password
    return ok({ user: state.user, accessToken: 'mock-access', refreshToken: 'mock-refresh' })
  }

  if (path === 'auth/register' && method === 'POST') {
    const email = String(body.email ?? '')
    if (!email.includes('@')) return fail(422, 'validation', 'Проверьте email')
    state.password = String(body.password ?? state.password)
    const currency = body.currency as Currency | undefined
    if (currency) {
      if (state.user) {
        state.user.activeCurrency = currency
        state.user.kycStatus = state.user.kycStatus ?? 'not_started'
      }
      // Отдельные кошельки: добавляем нужную валюту нулём, не трогая чужие балансы.
      if (!state.wallets.some((wallet) => wallet.currency === currency)) {
        state.wallets.push({ currency, balance: 0, updatedAt: new Date().toISOString() } as (typeof state.wallets)[number])
      }
    }
    return ok({ user: state.user, accessToken: 'mock-access', refreshToken: 'mock-refresh' }, 201)
  }

  if (path === 'auth/refresh' && method === 'POST') {
    return state.user ? ok({ accessToken: 'mock-access' }) : fail(401, 'unauthorized', 'Сессия истекла')
  }

  if (path === 'auth/logout' && method === 'POST') {
    return ok({ ok: true })
  }

  if (path === 'auth/oauth' && method === 'POST') {
    const provider = String(body.provider ?? 'google')
    return ok({ user: { ...state.user, email: `player@${provider}.com` }, accessToken: 'mock-access', refreshToken: 'mock-refresh' })
  }

  if (path === 'auth/forgot-password' && method === 'POST') {
    // Всегда одинаковый ответ — не раскрываем существование аккаунта.
    return ok({ ok: true })
  }

  if (path === 'auth/reset-password' && method === 'POST') {
    return String(body.token ?? '').length > 0 ? ok({ ok: true }) : fail(400, 'invalid_token', 'Ссылка недействительна')
  }

  if (path === 'auth/verify-email' && method === 'POST') {
    const token = String(body.token ?? query.get('token') ?? '')
    if (!token) return fail(400, 'invalid_token', 'Ссылка недействительна или устарела')
    if (state.user) state.user.emailVerified = true
    return ok({ ok: true })
  }

  if (path === 'auth/resend-verification' && method === 'POST') {
    const email = String(body.email ?? state.user?.email ?? '')
    if (!email) return fail(400, 'email_required', 'Укажите email')
    // Не раскрываем, есть ли такой аккаунт: ответ одинаковый.
    return ok({ ok: true, email })
  }

  if (path === 'users/me' && method === 'GET') {
    autoReviewKyc()
    return state.user ? ok(state.user) : fail(401, 'unauthorized', 'Не авторизован')
  }

  if (path === 'users/me' && method === 'PATCH') {
    if (!state.user) return fail(401, 'unauthorized', 'Не авторизован')
    const editable: Array<keyof User> = ['firstName', 'lastName', 'city', 'country', 'birthDate', 'avatarUrl']
    const patch: Partial<User> = {}
    editable.forEach((key) => {
      if (body[key] !== undefined) (patch as Record<string, unknown>)[key] = body[key]
    })
    // Статусы, id, email и активную валюту меняют только профильные ручки — не общий PATCH.
    state.user = {
      ...state.user,
      ...patch,
      settings: { ...state.user.settings, ...((body.settings as User['settings']) ?? {}) }
    }
    return ok(state.user)
  }

  if (path === 'users/me/password' && method === 'POST') {
    if (!state.user) return fail(401, 'unauthorized', 'Не авторизован')
    // Порог тот же, что у входа по email: у OAuth-аккаунта пароля здесь нет вовсе.
    const oauth = state.user.email.endsWith('@google.com') || state.user.email.endsWith('@telegram.com')
    if (oauth) return fail(409, 'oauth_account', 'Пароль меняется в аккаунте Google')
    if (String(body.currentPassword ?? '') !== state.password) {
      return fail(422, 'invalid_password', 'Текущий пароль не подходит')
    }
    if (String(body.newPassword ?? '').length < 8) {
      return fail(422, 'weak_password', 'Минимум 8 символов')
    }
    state.password = String(body.newPassword)
    return ok({ ok: true })
  }

  if (path === 'users/me/active-currency' && method === 'POST') {
    if (state.user) state.user.activeCurrency = body.currency as Currency
    return ok({ ok: true })
  }

  if (path === 'users/me/sessions' && method === 'GET') {
    return ok(state.sessions)
  }

  if (path.startsWith('users/me/sessions/') && method === 'DELETE') {
    const id = segments[3]
    if (id === 'others') {
      state.sessions = state.sessions.filter((s) => s.current)
      return ok({ ok: true })
    }
    state.sessions = state.sessions.filter((s) => s.id !== id)
    return ok({ ok: true })
  }

  /* ───────── wallet ───────── */
  if (path === 'wallet' && method === 'GET') {
    return ok(state.wallets)
  }

  if (path === 'wallet/transactions' && method === 'GET') {
    const currency = query.get('currency')
    const type = query.get('type')
    const period = query.get('period')
    const page = Number(query.get('page') ?? 1)
    const pageSize = Number(query.get('pageSize') ?? 12)
    let rows: Transaction[] = [...state.transactions]
    if (currency && currency !== 'all') rows = rows.filter((t) => t.currency === currency)
    if (type && type !== 'all') rows = rows.filter((t) => t.type === type)
    if (period && period !== 'all') {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 365
      rows = rows.filter((t) => Date.now() - new Date(t.createdAt).getTime() <= days * 86_400_000)
    }
    rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    return ok(paginate(rows, page, pageSize))
  }

  /* ───────── payments ───────── */
  if (path === 'payments/deposit' && method === 'POST') {
    const currency = body.currency as Currency
    const amount = Number(body.amount ?? 0)
    const methodId = String(body.methodId ?? '')
    if (!state.user) return fail(401, 'unauthorized', 'Войдите, чтобы пополнить')
    if (!amount || amount <= 0) return fail(422, 'validation', 'Укажите сумму')

    const isCrypto = currency === 'USDT' || currency === 'BTC'
    const methodName = isCrypto
      ? (CRYPTO_METHODS.find((m) => m.id === methodId)?.name ?? currency)
      : (resolveGeo(req.hostname).paymentMethods.find((m) => m.id === methodId)?.name ?? 'Карта')

    const intent: PaymentIntent = {
      id: `pay_${Date.now().toString(36)}`,
      kind: 'deposit',
      currency,
      amount,
      method: methodName,
      network: currency === 'USDT' ? 'TRC20' : currency === 'BTC' ? 'BTC' : undefined,
      address: isCrypto ? CRYPTO_ADDRESSES[currency] : undefined,
      deadline: isCrypto ? new Date(Date.now() + 30 * 60_000).toISOString() : undefined,
      createdAt: Date.now(),
      confirmAfterMs: isCrypto ? 12_000 : 6_000
    }
    state.payments[intent.id] = intent
    return ok(intent, 201)
  }

  if (path.startsWith('payments/') && method === 'GET') {
    const id = segments[1]
    const intent = state.payments[id]
    if (!intent) return fail(404, 'not_found', 'Платёж не найден')
    autoConfirmPayments()
    const confirmed = intent.kind === 'deposit' && Date.now() - intent.createdAt >= intent.confirmAfterMs
    return ok({ ...intent, status: confirmed ? 'completed' : 'pending' })
  }

  if (path === 'payments/withdraw' && method === 'POST') {
    autoReviewKyc()
    const currency = body.currency as Currency
    const amount = Number(body.amount ?? 0)
    if (state.kyc.status !== 'approved') {
      return fail(403, 'kyc_required', 'Вывод доступен после верификации')
    }
    const wallet = state.wallets.find((w) => w.currency === currency)
    if (!wallet || wallet.balance < amount) {
      return fail(422, 'insufficient_funds', 'Недостаточно средств')
    }
    touchWallet(currency, -amount)
    const id = `wd_${Date.now().toString(36)}`
    state.transactions.unshift({
      id,
      type: 'withdrawal',
      status: 'processing',
      amount: -amount,
      currency,
      createdAt: new Date().toISOString(),
      method: String(body.methodId ?? ''),
      destination: String(body.destination ?? '')
    })
    return ok({ id, status: 'processing', amount, currency }, 201)
  }

  /* ───────── games / providers / favorites ───────── */
  if (path === 'games' && method === 'GET') {
    const q = (query.get('q') ?? '').toLowerCase().trim()
    const category = query.get('category') ?? 'all'
    const providerSlug = query.get('provider')
    const sort = query.get('sort') ?? 'popular'
    const page = Number(query.get('page') ?? 1)
    const pageSize = Number(query.get('pageSize') ?? 12)
    const favoritesOnly = query.get('favoritesOnly') === 'true'
    const deck = query.get('deck') === 'true'

    let rows: Game[] = [...MOCK_GAMES]
    if (q) {
      rows = rows.filter(
        (g) => g.title.toLowerCase().includes(q) || g.provider.name.toLowerCase().includes(q)
      )
    }
    if (category === 'new') rows = rows.filter((g) => g.categories.includes('new'))
    if (category === 'popular') rows = rows.filter((g) => g.categories.includes('popular'))
    if (providerSlug) rows = rows.filter((g) => g.provider.slug === providerSlug)
    if (favoritesOnly) rows = rows.filter((g) => state.favorites.includes(g.slug))

    if (sort === 'new') rows.sort((a, b) => +new Date(b.releasedAt) - +new Date(a.releasedAt))
    else if (sort === 'az') rows.sort((a, b) => a.title.localeCompare(b.title, 'ru'))
    else rows.sort((a, b) => Number(b.categories.includes('popular')) - Number(a.categories.includes('popular')))

    if (deck) {
      const personal = deckOrder(rows, state.lastPlayed, state.favorites)
      return ok({ items: personal.slice(0, 12), page: 1, pageSize: 12, total: personal.length, hasMore: false })
    }
    return ok(paginate(rows, page, pageSize))
  }

  if (path.startsWith('games/') && method === 'GET') {
    const slug = segments[1]
    const game = findGame(slug)
    if (!game) return fail(404, 'not_found', 'Игра не найдена')
    return ok({ game, similar: similarGames(slug), favorite: state.favorites.includes(slug) })
  }

  if (path === 'providers' && method === 'GET') {
    return ok(MOCK_PROVIDERS)
  }

  if (path.startsWith('providers/') && method === 'GET') {
    const provider = findProvider(segments[1])
    if (!provider) return fail(404, 'not_found', 'Провайдер не найден')
    const games = MOCK_GAMES.filter((g) => g.provider.slug === provider.slug)
    return ok({ provider, games })
  }

  if (path === 'favorites' && method === 'GET') {
    const items = MOCK_GAMES.filter((g) => state.favorites.includes(g.slug))
    return ok({ items, slugs: state.favorites })
  }

  if (path.startsWith('favorites/') && (method === 'POST' || method === 'DELETE')) {
    const slug = segments[1]
    if (method === 'POST' && !state.favorites.includes(slug)) state.favorites.push(slug)
    if (method === 'DELETE') state.favorites = state.favorites.filter((s) => s !== slug)
    return ok({ slugs: state.favorites })
  }

  if (path === 'history/last-played' && method === 'GET') {
    const rows = Object.entries(state.lastPlayed)
      .sort((a, b) => +new Date(b[1]) - +new Date(a[1]))
      .map(([slug, at]) => ({ game: findGame(slug)!, lastPlayedAt: at }))
      .filter((row) => row.game)
    return ok(rows)
  }

  if (path === 'history/feed' && method === 'GET') {
    /** «Сейчас играют / крупные выигрыши» — простая полка, не live ticker. */
    return ok(state.recentWins)
  }

  /* ───────── launch ───────── */
  if (path === 'launch' && method === 'POST') {
    const slug = String(body.slug ?? '')
    const currency = body.currency as Currency | undefined
    const demo = Boolean(body.demo)
    const game = findGame(slug)
    if (!game) return fail(404, 'not_found', 'Игра не найдена')
    if (!demo) {
      if (!state.user) return fail(401, 'not_authenticated', 'Войдите, чтобы играть')
      if (!currency) return fail(422, 'currency_required', 'Выберите кошелёк')
      if (!game.currencies.includes(currency) && currency !== 'USDT' && currency !== 'BTC') {
        return fail(422, 'currency_not_supported', `Провайдер не принимает ${currency} для этой игры`)
      }
      if (!game.currencies.includes(currency)) {
        return fail(422, 'currency_not_supported', `Игра недоступна в ${currency}`)
      }
      const wallet = state.wallets.find((w) => w.currency === currency)
      if (!wallet || wallet.balance <= 0) {
        return fail(422, 'insufficient_funds', 'На кошельке пусто')
      }
    }
    const sessionId = `gs_${Math.random().toString(36).slice(2, 10)}`
    if (state.user) {
      state.lastPlayed[slug] = new Date().toISOString()
      if (!demo && currency) state.user.lastPlayedCurrency = currency
    }
    return ok({
      // Игровой экран живёт на /play; demo-запуск помечается флагом.
      url: `/play?game=${slug}&currency=${currency ?? 'RUB'}${demo ? '&demo=1' : ''}`,
      sessionId,
      currency: currency ?? 'RUB'
    })
  }

  /* ───────── bets history ───────── */
  if (path === 'history/bets' && method === 'GET') {
    const currency = query.get('currency')
    const slug = query.get('game')
    const period = query.get('period')
    const page = Number(query.get('page') ?? 1)
    const pageSize = Number(query.get('pageSize') ?? 15)
    let rows = [...state.bets]
    if (currency && currency !== 'all') rows = rows.filter((b) => b.currency === currency)
    if (slug && slug !== 'all') rows = rows.filter((b) => b.game.slug === slug)
    if (period && period !== 'all') {
      const days = period === '24h' ? 1 : period === '7d' ? 7 : 30
      rows = rows.filter((b) => Date.now() - new Date(b.createdAt).getTime() <= days * 86_400_000)
    }
    rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

    const perCurrency = new Map<Currency, { turnover: number; wins: number }>()
    rows.forEach((b) => {
      const acc = perCurrency.get(b.currency) ?? { turnover: 0, wins: 0 }
      acc.turnover += b.bet
      acc.wins += b.win
      perCurrency.set(b.currency, acc)
    })

    return ok({
      ...paginate(rows, page, pageSize),
      summary: {
        bets: rows.length,
        perCurrency: [...perCurrency.entries()].map(([cur, acc]) => ({ currency: cur, ...acc }))
      }
    })
  }

  /* ───────── kyc ───────── */
  if (path === 'kyc' && method === 'GET') {
    autoReviewKyc()
    return ok(state.kyc)
  }

  if (path === 'kyc' && method === 'POST') {
    const next: KycState = { ...state.kyc, status: 'on_review', submittedAt: new Date().toISOString() }
    state.kyc = next
    if (state.user) state.user.kycStatus = 'on_review'
    return ok(next, 201)
  }

  /* ───────── support ───────── */
  if (path === 'support/tickets' && method === 'GET') {
    return ok([...state.tickets].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)))
  }

  if (path === 'support/tickets' && method === 'POST') {
    const ticket = {
      id: `TCK-${1100 + state.tickets.length}`,
      subject: String(body.subject ?? 'Без темы'),
      category: (body.category as never) ?? 'other',
      status: 'open' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'm1',
          author: 'user' as const,
          text: String(body.message ?? ''),
          createdAt: new Date().toISOString()
        }
      ]
    }
    state.tickets.unshift(ticket)
    return ok(ticket, 201)
  }

  if (path.startsWith('support/tickets/') && method === 'GET') {
    const ticket = state.tickets.find((t) => t.id === segments[2])
    return ticket ? ok(ticket) : fail(404, 'not_found', 'Тикет не найден')
  }

  if (path.startsWith('support/tickets/') && segments[3] === 'messages' && method === 'POST') {
    const ticket = state.tickets.find((t) => t.id === segments[2])
    if (!ticket) return fail(404, 'not_found', 'Тикет не найден')
    ticket.messages.push({
      id: `m${ticket.messages.length + 1}`,
      author: 'user',
      text: String(body.text ?? ''),
      createdAt: new Date().toISOString()
    })
    ticket.status = ticket.status === 'closed' ? 'closed' : 'open'
    ticket.updatedAt = new Date().toISOString()
    return ok(ticket)
  }

  if (path.startsWith('support/tickets/') && segments[3] === 'close' && method === 'POST') {
    const ticket = state.tickets.find((t) => t.id === segments[2])
    if (!ticket) return fail(404, 'not_found', 'Тикет не найден')
    ticket.status = 'closed'
    ticket.updatedAt = new Date().toISOString()
    return ok(ticket)
  }

  /* ───────── referral ───────── */
  if (path === 'referral' && method === 'GET') {
    const items = state.referrals
    const earned = { RUB: 830, KZT: 5400 }
    const available = { RUB: 350, KZT: 2200 }
    return ok({
      code: state.user?.referralCode ?? 'DK-7F3A21',
      total: items.length,
      active: items.filter((r) => Date.now() - new Date(r.joinedAt).getTime() < 14 * 86_400_000).length,
      earned,
      available,
      items
    })
  }

  if (path === 'referral/withdraw' && method === 'POST') {
    const currency = body.currency as Currency
    const amount = Number(body.amount ?? 0)
    if (amount <= 0) return fail(422, 'validation', 'Укажите сумму')
    touchWallet(currency, amount)
    state.transactions.unshift({
      id: `tx_ref_${Date.now().toString(36)}`,
      type: 'referral',
      status: 'completed',
      amount,
      currency,
      createdAt: new Date().toISOString(),
      comment: 'Вывод бонуса с игры друзей'
    })
    return ok({ ok: true }, 201)
  }

  if (path === 'dev/reset' && method === 'POST') {
    resetState()
    return ok({ ok: true })
  }

  /**
   * Демо-переключатель состояний KYC (только мок): шесть состояний §12 нужно
   * уметь показать на приёмке, не дожидаясь реальной модерации.
   * POST /api/v1/dev/kyc { "status": "not_started|pending|on_review|resubmit|rejected|approved" }
   */
  if (path === 'dev/kyc' && method === 'POST') {
    const allowed: KycStatus[] = ['not_started', 'pending', 'on_review', 'resubmit', 'rejected', 'approved']
    const status = String(body.status ?? '') as KycStatus
    if (!allowed.includes(status)) return fail(422, 'validation', `status: ${allowed.join(' | ')}`)
    const approved = status === 'approved'
    state.kyc = {
      ...state.kyc,
      status,
      submittedAt: status === 'not_started' ? undefined : (state.kyc.submittedAt ?? new Date().toISOString()),
      reason: status === 'rejected' ? 'Фото документа нечитаемое' : undefined
    }
    if (state.user) {
      state.user.kycStatus = status
      state.user.withdrawalBlockedByKyc = !approved
    }
    return ok(state.kyc)
  }

  return fail(404, 'not_found', `Мок-роут ${method} /${path} не найден`)
}

/** Порядок колоды: своё → хайп → новинки → популярные. Скипнутые карты уходят в хвост. */
export function deckOrder(games: Game[], lastPlayed: Record<string, string>, favorites: string[]): Game[] {
  const bySlug = new Map(games.map((g) => [g.slug, g]))
  const personal: Game[] = []
  const pushGame = (slug: string) => {
    const game = bySlug.get(slug)
    if (game && !personal.includes(game)) personal.push({ ...game })
  }

  Object.entries(lastPlayed)
    .sort((a, b) => +new Date(b[1]) - +new Date(a[1]))
    .slice(0, 2)
    .forEach(([slug]) => pushGame(slug))
  favorites.forEach((slug) => pushGame(slug))

  games.filter((g) => g.badge === 'HOT').forEach((g) => pushGame(g.slug))
  games
    .filter((g) => g.categories.includes('new'))
    .sort((a, b) => +new Date(b.releasedAt) - +new Date(a.releasedAt))
    .forEach((g) => pushGame(g.slug))
  games.filter((g) => g.categories.includes('popular')).forEach((g) => pushGame(g.slug))
  games.forEach((g) => pushGame(g.slug))

  return personal.map((game) => {
    const reason: Game['deckReason'] = lastPlayed[game.slug]
      ? 'Продолжи'
      : favorites.includes(game.slug)
        ? 'Твоё избранное'
        : game.badge === 'HOT'
          ? 'Хайп'
          : 'Новинка'
    return { ...game, deckReason: reason }
  })
}
