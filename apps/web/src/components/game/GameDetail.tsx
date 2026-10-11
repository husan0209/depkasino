'use client'

import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { Heart, Play } from 'lucide-react'
import { Badge, Button, EmptyState } from '@/components/ui'
import { GameGrid } from '@/components/casino/GameGrid'
import { useLaunch } from '@/hooks/useLaunch'
import { useLaunchStore } from '@/stores/launch'
import { useFavorites } from '@/hooks/useWalletData'
import { casinoApi, queryKeys } from '@/lib/api'
import { formatPercent } from '@/lib/format'
import { cn } from '@/lib/cn'
import { CoverImage } from '@/components/shared/CoverImage'
import type { Game } from '@/types'

const volatilityLabels = { low: 'Низкая', medium: 'Средняя', high: 'Высокая' } as const

/**
 * Превью страницы игры (§8.1): обложка, RTP, волатильность, мин. ставка,
 * «Играть» и «Демо», избранное и похожие слоты.
 * Это не обязательный шлюз в игру — игра запускается и с карточки витрины.
 */
export function GameDetail({ game, similar }: { game: Game; similar: Game[] }) {
  const { launch, launchDemo } = useLaunch()
  const isLaunching = useLaunchStore((state) => state.isLaunching)
  const launchingSlug = useLaunchStore((state) => state.launchingSlug)
  const queryClient = useQueryClient()
  const { data: favorites } = useFavorites()
  const favorite = (favorites?.slugs ?? []).includes(game.slug)

  const toggleFavorite = async () => {
    const next = !favorite
    queryClient.setQueryData(queryKeys.favorites, (current: { items: unknown[]; slugs: string[] } | undefined) => {
      if (!current) return current
      return { ...current, slugs: next ? [...current.slugs, game.slug] : current.slugs.filter((s) => s !== game.slug) }
    })
    try {
      await casinoApi.toggleFavorite(game.slug, next)
    } finally {
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites })
    }
  }

  return (
    <div className="container-page mt-6">
      <nav aria-label="Хлебные крошки" className="mb-4 flex items-center gap-2 text-xs text-ink-muted">
        <Link href="/casino" className="hover:text-white">
          Каталог
        </Link>
        <span>/</span>
        <Link href={`/providers/${game.provider.slug}`} className="hover:text-white">
          {game.provider.name}
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-bg-card">
          <CoverImage src={game.cover} alt={game.title} width={640} height={640} priority className="h-auto w-full" />
          {game.badge && (
            <div className="absolute left-3 top-3">
              <Badge variant={game.badge === 'NEW' ? 'new' : 'hot'}>{game.badge}</Badge>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">{game.title}</h1>
          <Link href={`/providers/${game.provider.slug}`} className="mt-1 inline-block text-sm text-ink-muted hover:text-accent">
            {game.provider.name}
          </Link>

          <dl className="mt-5 grid grid-cols-3 gap-3">
            <div className="card-surface p-3 text-center">
              <dt className="text-2xs uppercase tracking-wide text-ink-dim">RTP</dt>
              <dd className="money-tabular mt-1 text-base font-semibold text-white">{formatPercent(game.rtp)}</dd>
            </div>
            <div className="card-surface p-3 text-center">
              <dt className="text-2xs uppercase tracking-wide text-ink-dim">Волатильность</dt>
              <dd className="mt-1 text-base font-semibold text-white">{volatilityLabels[game.volatility]}</dd>
            </div>
            <div className="card-surface p-3 text-center">
              <dt className="text-2xs uppercase tracking-wide text-ink-dim">Мин. ставка</dt>
              <dd className="money-tabular mt-1 text-base font-semibold text-white">{game.minBet}</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              size="lg"
              leftIcon={<Play className="h-4 w-4" />}
              loading={isLaunching && launchingSlug === game.slug}
              onClick={() => launch(game)}
            >
              Играть
            </Button>
            {game.hasDemo && (
              <Button size="lg" variant="secondary" onClick={() => launchDemo(game)}>
                Демо
              </Button>
            )}
            <Button
              size="lg"
              variant={favorite ? 'danger' : 'secondary'}
              leftIcon={<Heart className={cn('h-4 w-4', favorite && 'fill-current')} />}
              onClick={toggleFavorite}
            >
              {favorite ? 'В избранном' : 'В избранное'}
            </Button>
          </div>

          <p className="mt-4 text-xs text-ink-muted">
            Валюты, которые принимает игра: {game.currencies.join(' · ')}. Конвертации нет — игра идёт с кошелька той же валюты.
          </p>

          <div className="mt-6 rounded-2xl border border-line bg-bg-secondary/40 p-4 text-sm text-ink-muted">
            <p className="font-semibold text-white">Что важно перед спином</p>
            <ul className="mt-2 space-y-1.5 text-xs">
              <li>• Ставка списывается и выигрыш зачисляется в валюте активного кошелька.</li>
              <li>• Если на активном кошельке пусто, предложим сыграть с другого — без тихой конвертации.</li>
              <li>• После закрытия игры баланс обновляется автоматически.</li>
            </ul>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">Похожие слоты</h2>
        {similar.length > 0 ? (
          <GameGrid games={similar} className="mt-4" priorityCount={0} />
        ) : (
          <EmptyState
            className="mt-4"
            title="Похожих пока нет"
            action={
              <Link href="/casino" className="text-sm font-semibold text-accent">
                В каталог →
              </Link>
            }
          />
        )}
      </section>
    </div>
  )
}
