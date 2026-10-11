'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { Dices, Flame, Heart, Play, Sparkles } from 'lucide-react'
import { Badge, Button, CurrencyAmount, QueryError, Skeleton } from '@/components/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { casinoApi, queryKeys, type FeedWin } from '@/lib/api'
import { useLaunch } from '@/hooks/useLaunch'
import { useFavorites, useLiveFeed } from '@/hooks/useWalletData'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { useIsDesktop, useIsTabletUp } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/cn'
import type { Game } from '@/types'

/**
 * GameDeck — свайпаемая колода (§4.4).
 * Каждый свайп — новая игра, запускаемая в один тап.
 * Телефон: 1+2 · планшет: 1+3 · десктоп: 1+3 + очередь мини-тюмбов.
 *
 * Жесты: свайп влево/вправо — след./пред. карта, тап — запуск, тап по «i» — превью,
 * двойной тап — в избранное (heart-burst). Драг вверх отдан скроллу страницы.
 */
export function GameDeck({ initialGames, className }: { initialGames?: Game[]; className?: string }) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const isDesktop = useIsDesktop()
  const isTabletUp = useIsTabletUp()
  const queryClient = useQueryClient()
  const { launch } = useLaunch()
  const { data: favorites } = useFavorites()
  const { data: feed } = useLiveFeed()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.games({ deck: true }),
    queryFn: () => casinoApi.games({ deck: true }),
    // Колода приходит из SSR: фронт-карта и очередь мини-тюмбов видны в первом кадре.
    initialData: initialGames?.length
      ? { items: initialGames, page: 1, pageSize: initialGames.length, total: initialGames.length, hasMore: false }
      : undefined
  })

  const [order, setOrder] = useState<string[] | null>(null)
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const [burstSlug, setBurstSlug] = useState<string | null>(null)

  const games = useMemo(() => data?.items ?? [], [data])
  const queue = useMemo(() => {
    const bySlug = new Map(games.map((g) => [g.slug, g]))
    const slugs = order ?? games.map((g) => g.slug)
    return slugs.map((slug) => bySlug.get(slug)).filter((g): g is Game => !!g)
  }, [games, order])

  const current = queue[0]
  const behind = queue.slice(1, isDesktop || isTabletUp ? 4 : 3)
  const queueThumbs = queue.slice(1, 5)
  const deckLength = queue.length
  const deckPosition = Math.min(seen.size + 1, deckLength)
  const isFinalCard = seen.size >= deckLength && deckLength > 0

  const advance = useCallback(() => {
    if (queue.length === 0) return
    setOrder((prev) => {
      const slugs = prev ?? games.map((g) => g.slug)
      return [...slugs.slice(1), slugs[0]]
    })
    setSeen((prev) => new Set(prev).add(current.slug))
  }, [current, games, queue.length])

  const goBack = useCallback(() => {
    if (queue.length === 0) return
    setOrder((prev) => {
      const slugs = prev ?? games.map((g) => g.slug)
      return [slugs[slugs.length - 1], ...slugs.slice(0, -1)]
    })
  }, [games, queue.length])

  const shuffle = useCallback(() => {
    const slugs = games.map((g) => g.slug)
    for (let i = slugs.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[slugs[i], slugs[j]] = [slugs[j], slugs[i]]
    }
    setOrder(slugs)
    setSeen(new Set())
  }, [games])

  const toggleFavorite = useCallback(
    (slug: string) => {
      const favorite = !(favorites?.slugs ?? []).includes(slug)
      setBurstSlug(slug)
      setTimeout(() => setBurstSlug(null), 450)
      queryClient.setQueryData(queryKeys.favorites, (current: { items: unknown[]; slugs: string[] } | undefined) => {
        if (!current) return current
        return { ...current, slugs: favorite ? [...current.slugs, slug] : current.slugs.filter((s) => s !== slug) }
      })
      void casinoApi.toggleFavorite(slug, favorite).finally(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.favorites })
      })
    },
    [favorites?.slugs, queryClient]
  )

  if (isError) {
    return (
      <div className={cn('container-page', className)}>
        <QueryError title="Колода не собралась" onRetry={() => void refetch()} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn('container-page', className)}>
        <Skeleton className="h-[420px] w-full rounded-3xl" />
      </div>
    )
  }

  if (queue.length === 0) return null

  const win = feed?.find((item) => item.slug === current?.slug)

  return (
    <section className={cn('container-page', className)} aria-label="Колода игр">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="section-label">Колода дня</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Свайпай и играй</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="money-tabular text-xs text-ink-muted">
            {deckPosition}/{deckLength}
          </span>
          <button
            type="button"
            onClick={shuffle}
            aria-label="Перемешать колоду"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-bg-secondary text-ink-muted transition-colors hover:text-white"
          >
            <Dices className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative min-h-[420px] flex-1">
          {/* Стек: 1 фронт + 2–3 позади */}
          {behind
            .slice()
            .reverse()
            .map((game, reverseIndex) => {
              const depth = behind.length - reverseIndex
              return (
                <div
                  key={game.slug}
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[380px] rounded-3xl border border-line bg-bg-card"
                  style={{
                    transform: `translateY(${depth * (depth > 2 ? 10 : 14)}px) scale(${1 - depth * 0.045})`,
                    opacity: 1 - depth * 0.22,
                    zIndex: 5 - depth
                  }}
                />
              )
            })
            .slice(0, isTabletUp ? 3 : 2)}

          {isFinalCard ? (
            <FinalCard total={games.length} />
          ) : (
            <AnimatePresence initial={false} mode="popLayout">
            <DeckCard
              key={current.slug}
              game={current}
              reducedMotion={prefersReducedMotion}
              win={win}
              favorite={(favorites?.slugs ?? []).includes(current.slug)}
              bursting={burstSlug === current.slug}
              onSwipe={advance}
              onBack={goBack}
              onLaunch={() => launch(current)}
              onFavorite={() => toggleFavorite(current.slug)}
            />
            </AnimatePresence>
          )}
        </div>

        {/* Десктоп: боковая кликабельная очередь */}
        <div className="hidden w-[248px] shrink-0 flex-col gap-2 lg:flex">
          <p className="section-label">Дальше в колоде</p>
          {queueThumbs.map((game) => (
            <button
              key={game.slug}
              type="button"
              onClick={() => {
                setOrder((prev) => {
                  const slugs = prev ?? games.map((g) => g.slug)
                  return [game.slug, ...slugs.filter((s) => s !== game.slug)]
                })
              }}
              className="flex items-center gap-3 rounded-2xl border border-line bg-bg-card p-2 text-left transition-colors hover:border-accent/50"
            >
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                <Image src={game.cover} alt="" fill sizes="48px" className="object-cover" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-white">{game.title}</span>
                <span className="block truncate text-2xs text-ink-muted">{game.provider.name}</span>
              </span>
            </button>
          ))}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Sparkles className="h-3.5 w-3.5" />}
            onClick={shuffle}
            className="mt-1"
          >
            Пересдать колоду
          </Button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {Array.from({ length: Math.min(deckLength, 12) }).map((_, index) => (
          <span
            key={index}
            className={cn('h-1.5 rounded-full transition-all', index === deckPosition - 1 ? 'w-4 bg-accent' : 'w-1.5 bg-line')}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-2xs text-ink-dim lg:hidden">Свайп — другая игра · тап — запуск · двойной тап — в избранное</p>
    </section>
  )
}

function DeckCard({
  game,
  reducedMotion,
  win,
  favorite,
  bursting,
  onSwipe,
  onBack,
  onLaunch,
  onFavorite
}: {
  game: Game
  reducedMotion: boolean
  win?: FeedWin
  favorite: boolean
  bursting: boolean
  onSwipe(): void
  onBack(): void
  onLaunch(): void
  onFavorite(): void
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-260, 0, 260], [-12, -3, 12])
  const opacity = useTransform(x, [-320, -180, 0, 180, 320], [0.4, 1, 1, 1, 0.4])
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (tapTimer.current) clearTimeout(tapTimer.current) }, [])

  /** Двойной тап — в избранное с heart-burst, одиночный — запуск. */
  const handleTap = () => {
    if (tapTimer.current) {
      clearTimeout(tapTimer.current)
      tapTimer.current = null
      onFavorite()
      return
    }
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null
      onLaunch()
    }, 280)
  }

  return (
    <motion.div
      className="absolute inset-x-0 top-0 h-[380px] cursor-grab active:cursor-grabbing"
      style={{ x, rotate: reducedMotion ? 0 : rotate, opacity: reducedMotion ? 1 : opacity, zIndex: 10 }}
      initial={reducedMotion ? { opacity: 0 } : { scale: 0.94, y: 10, opacity: 0.8 }}
      animate={reducedMotion ? { opacity: 1 } : { scale: 1, y: 0, opacity: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { x: -320, opacity: 0 }}
      transition={reducedMotion ? { duration: 0.18 } : { type: 'spring', stiffness: 260, damping: 24 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.55}
      dragDirectionLock
      onDragEnd={(_event, info) => {
        const threshold = 110
        if (info.offset.x < -threshold || info.velocity.x < -600) onSwipe()
        else if (info.offset.x > threshold || info.velocity.x > 600) onBack()
      }}
      onTap={handleTap}
    >
      <div className="relative h-full overflow-hidden rounded-3xl border border-line bg-bg-card shadow-card">
        <Image src={game.cover} alt={game.title} fill sizes="(max-width: 768px) 92vw, 520px" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/25 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
          {game.deckReason && (
            <Badge variant="neutral" className="bg-black/50 backdrop-blur">
              {game.deckReason === 'Хайп' && <Flame className="h-3 w-3 text-danger" />}
              {game.deckReason}
            </Badge>
          )}
          {game.badge && <Badge variant={game.badge === 'NEW' ? 'new' : 'hot'}>{game.badge}</Badge>}
          {/* Контекстный BIG WIN: плашка крепится к карте-виновнику и свайпается с ней */}
          {win && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-money/40 bg-money/15 px-2.5 py-1 text-2xs font-semibold text-money backdrop-blur">
              <CurrencyAmount amount={win.amount} currency={win.currency} context="wallet" showPlus />
              только что
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label={favorite ? 'Убрать из избранного' : 'В избранное'}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onFavorite()
          }}
          className={cn(
            'absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition-colors',
            favorite ? 'border-danger/40 bg-danger/20 text-danger' : 'border-line bg-black/45 text-white hover:text-danger'
          )}
        >
          <Heart className={cn('h-4 w-4', favorite && 'fill-current', bursting && 'animate-heart-burst')} />
        </button>

        <div className="absolute inset-x-4 bottom-4">
          <p className="text-xl font-semibold text-white">{game.title}</p>
          <p className="text-sm text-ink-muted">{game.provider.name}</p>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="mt-3"
            leftIcon={<Play className="h-4 w-4" />}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              onLaunch()
            }}
          >
            Играть
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function FinalCard({ total }: { total: number }) {
  return (
    <Link
      href="/casino"
      className="absolute inset-x-0 top-0 flex h-[380px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-accent/50 bg-accent/10 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white">
        <Sparkles className="h-6 w-6" />
      </span>
      <p className="text-lg font-semibold text-white">Колода закончилась</p>
      <p className="text-sm text-ink-muted">Ещё {total} игр в каталоге</p>
      <span className="mt-1 inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white">
        В каталог →
      </span>
    </Link>
  )
}

export function GameDeckSkeleton() {
  return (
    <div className="container-page">
      <Skeleton className="h-[420px] w-full rounded-3xl" />
    </div>
  )
}
