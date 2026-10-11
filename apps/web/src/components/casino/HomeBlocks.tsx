'use client'


import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Avatar, Button, Skeleton } from '@/components/ui'
import { useMounted } from '@/hooks/useMounted'
import { GameCard, LastPlayedCard } from './GameCard'
import { GameGrid } from './GameGrid'
import { ProviderStrip } from './ProviderTile'
import { SectionHeading } from './SectionHeading'
import { GameDeck } from './GameDeck'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useLastPlayed, useFavorites } from '@/hooks/useWalletData'
import { FEATURE_FLAGS } from '@/constants/currencies'
import type { Game, Provider } from '@/types'

/**
 * Главная (§6 Части 5 и §4.2–4.4 Части 5.1).
 * Свой видит «Продолжить играть» первым, гость — один герой с одним CTA.
 * Блоки «Для новых игроков» залогиненному не показываются никогда.
 */
export function HomeBlocks({
  popular,
  fresh,
  providers,
  deck,
  playersToday,
  quickStart
}: {
  popular: Game[]
  fresh: Game[]
  providers: Provider[]
  deck: Game[]
  playersToday: number
  quickStart: Game[]
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hydrated = useMounted()

  // Сервер и первый клиентский рендер отдают витрину гостя: она попадает в HTML (SSR/SEO),
  // а «своему» её закрывает CSS-подсказка сессии — без вспышки маркетингового героя.
  if (hydrated && isAuthenticated) {
    return <PlayerHome popular={popular} fresh={fresh} providers={providers} deck={deck} />
  }

  return (
    <GuestHome
      popular={popular}
      fresh={fresh}
      providers={providers}
      deck={deck}
      playersToday={playersToday}
      quickStart={quickStart}
    />
  )
}

/** Гость: один оффер, одна кнопка, social proof (§4.2 Части 5.1). */
function GuestHome({
  popular,
  fresh,
  providers,
  deck,
  playersToday,
  quickStart
}: {
  popular: Game[]
  fresh: Game[]
  providers: Provider[]
  deck: Game[]
  playersToday: number
  quickStart: Game[]
}) {
  const router = useRouter()
  const openGamePreview = useUIStore((state) => state.openGamePreview)

  return (
    <>
      <div data-visibility="guest">
        <Hero playersToday={playersToday} />
      </div>

      {/* «Своему» вместо героя — сразу продолжение игры: подсказка сессии скрывает герой до гидратации. */}
      <section data-visibility="player" className="container-page mt-6">
        <SectionHeading label="Твоя история" title="Продолжить играть" href="/history" hrefLabel="История" />
        <div className="scroll-row">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-[132px] shrink-0 rounded-2xl" />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <GameDeck initialGames={deck} />
      </section>

      <section className="container-page mt-10">
        <SectionHeading label="Выбирай настроение" title="Популярное сейчас" href="/casino?sort=popular" hrefLabel="Каталог" />
        <GameGrid games={popular.slice(0, 12)} />
      </section>

      <section className="container-page mt-10">
        <SectionHeading label="Свежие поступления" title="Новые игры" href="/casino?category=new" />
        <GameGrid games={fresh.slice(0, 6)} />
      </section>

      <section className="container-page mt-10">
        <SectionHeading label="Проверенные студии" title="Провайдеры" href="/providers" />
        <ProviderStrip providers={providers} />
      </section>

      {/* «Для новых игроков» — только гостю и только внизу (§4.2) */}
      <section data-visibility="guest" className="container-page mt-10">
        <div className="card-surface flex flex-col items-start gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="section-label">Для новых игроков</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Гость видит слоты. Депозит — когда сами решите.</h3>
            <p className="mt-1 text-sm text-ink-muted">
              {quickStart.length} слотов доступны в демо без регистрации. Одна зелёная кнопка, когда будете готовы.
            </p>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <Button
              variant="secondary"
              onClick={() => quickStart[0] && openGamePreview(quickStart[0].slug)}
              className="flex-1 md:flex-none"
            >
              Смотреть демо
            </Button>
            <Button
              onClick={() => router.push('/register')}
              className="flex-1 md:flex-none"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Создать аккаунт
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

/** Свой: сначала «Продолжить играть», маркетингового героя нет (§4.3). */
function PlayerHome({
  popular,
  fresh,
  providers,
  deck
}: {
  popular: Game[]
  fresh: Game[]
  providers: Provider[]
  deck: Game[]
}) {
  const { data: lastPlayed, isLoading } = useLastPlayed()
  const { data: favorites } = useFavorites()

  const favoriteGames = popular.filter((game) => (favorites?.slugs ?? []).includes(game.slug))
  const inFavorites = favoriteGames.length > 0 ? favoriteGames : (favorites?.items ?? []).slice(0, 6)

  return (
    <>
      <section className="container-page mt-6">
        <SectionHeading label="Твоя история" title="Продолжить играть" href="/history" hrefLabel="История" />
        {isLoading ? (
          <div className="scroll-row">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-44 w-[132px] shrink-0 rounded-2xl" />
            ))}
          </div>
        ) : lastPlayed && lastPlayed.length > 0 ? (
          <div className="scroll-row">
            {lastPlayed.map((entry) => (
              <LastPlayedCard key={entry.game.slug} game={entry.game} playedAt={entry.lastPlayedAt} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">Сыграйте первый спин — вернём сюда вашу игру одной кнопкой.</p>
        )}
      </section>

      <section className="mt-10">
        <GameDeck initialGames={deck} />
      </section>

      <section className="container-page mt-10">
        <SectionHeading label="Выбирай настроение" title="Популярное сейчас" href="/casino?sort=popular" />
        <GameGrid games={popular.slice(0, 12)} />
      </section>

      {/* Один промо-слот: при выключенных флагах блок скрыт, а не превращается в слайдер (§4.3) */}
      {FEATURE_FLAGS.FEATURE_PROMO_SLOT && <PromoSlot />}

      <section className="container-page mt-10">
        <SectionHeading label="Свежие поступления" title="Новые игры" href="/casino?category=new" />
        <GameGrid games={fresh.slice(0, 6)} />
      </section>

      {inFavorites.length > 0 && (
        <section className="container-page mt-10">
          <SectionHeading label="Твоё" title="Избранное" href="/favorites" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
            {inFavorites.slice(0, 6).map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        </section>
      )}

      <section className="container-page mt-10">
        <SectionHeading label="Проверенные студии" title="Провайдеры" href="/providers" />
        <ProviderStrip providers={providers} />
      </section>
    </>
  )
}

/** Hero гостя (донор spinera): казино-родной фон, один оффер, один CTA. */
function Hero({ playersToday }: { playersToday: number }) {
  const router = useRouter()

  return (
    <section className="container-page mt-4">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-bg-card">
        <HeroBackdrop />
        <div className="relative z-10 flex flex-col gap-5 p-6 md:p-10">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-money/40 bg-money/15 px-2.5 py-1 text-2xs font-semibold text-money">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-money" />
            играют прямо сейчас
          </span>

          <div className="max-w-xl">
            <h1 className="text-3xl font-bold leading-tight text-white md:text-5xl">Твой следующий большой спин.</h1>
            <p className="mt-3 text-sm text-ink-muted md:text-base">
              Слоты от проверенных студий. Отдельные кошельки в ₽, ₸, ₴, Br, soʻm, USDT и BTC — без конвертации и скрытых комиссий.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" onClick={() => router.push('/casino')} rightIcon={<ArrowRight className="h-4 w-4" />} className="sm:w-auto">
              Играть сейчас
            </Button>
            <div className="flex items-center gap-3">
              <AvatarStack />
              <p className="text-xs text-ink-muted">
                <span className="money-tabular font-semibold text-white">
                  {playersToday.toLocaleString('ru-RU').replace(/\u00A0/g, ' ')}
                </span>{' '}
                игроков уже сегодня
              </p>
            </div>
          </div>

          <p className="text-2xs text-ink-dim">Гость видит слоты. Депозит — когда сами решите.</p>
        </div>
      </div>
    </section>
  )
}

function AvatarStack() {
  const names = ['Артём', 'Дана', 'Игорь', 'Лейла']
  return (
    <span className="flex -space-x-2">
      {names.map((name) => (
        <Avatar key={name} name={name} size="sm" className="ring-2 ring-bg-card" />
      ))}
    </span>
  )
}

/** Барабаны и монеты — казино-родной фон без баннерного мусора. */
function HeroBackdrop() {
  return (
    <svg viewBox="0 0 800 400" aria-hidden className="absolute inset-0 h-full w-full opacity-70">
      <defs>
        <radialGradient id="heroGlow" cx="78%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#6C63FF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0F0F1A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="reelGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#6C63FF" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#heroGlow)" />
      <g opacity="0.5">
        {[0, 1, 2].map((reel) => (
          <g key={reel} transform={`translate(${520 + reel * 82} 90)`}>
            <rect width="66" height="200" rx="16" fill="url(#reelGrad)" stroke="#2A2A4A" />
            {[0, 1, 2].map((cell) => (
              <g key={cell} transform={`translate(33 ${34 + cell * 66})`}>
                <path d="M0 -18 L18 0 L0 18 L-18 0 Z" fill={cell % 2 === 0 ? '#FFD166' : '#00C853'} opacity="0.85" />
              </g>
            ))}
          </g>
        ))}
      </g>
      <g opacity="0.35">
        <circle cx="120" cy="330" r="34" fill="#FFC93C" />
        <circle cx="120" cy="330" r="22" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="4" />
        <circle cx="230" cy="80" r="20" fill="#00D2FF" opacity="0.7" />
        <path d="M60 60 l14 30 32 4 -24 22 6 32 -28 -16 -28 16 6 -32 -24 -22 32 -4 Z" fill="#6C63FF" opacity="0.6" />
      </g>
    </svg>
  )
}

/** Зарезервировано под будущий акционный движок: флаг выключен — блок не рендерится. */
function PromoSlot() {
  return (
    <section className="container-page mt-10">
      <div className="card-surface flex items-center gap-4 p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">Акции появятся позже</p>
          <p className="text-xs text-ink-muted">Слот под один баннер уже заложен.</p>
        </div>
      </div>
    </section>
  )
}
