'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Heart, Play } from 'lucide-react'
import { Badge, Button, QueryError, Sheet, Skeleton } from '@/components/ui'
import { useUIStore } from '@/stores/ui'
import { casinoApi, queryKeys } from '@/lib/api'
import { useLaunch } from '@/hooks/useLaunch'
import { useFavorites } from '@/hooks/useWalletData'
import { useQueryClient } from '@tanstack/react-query'
import { casinoApi as api } from '@/lib/api'
import { formatPercent } from '@/lib/format'
import { cn } from '@/lib/cn'
import { CoverImage } from '@/components/shared/CoverImage'

const volatilityLabels = {
  low: 'Низкая',
  medium: 'Средняя',
  high: 'Высокая'
} as const

/**
 * Превью игры по тапу на «i» (§6.4).
 * RTP, волатильность и минимальная ставка живут здесь, а не на карточке витрины.
 */
export function GamePreviewSheet() {
  const slug = useUIStore((state) => state.gamePreviewSlug)
  const close = useUIStore((state) => state.closeGamePreview)
  const { launch, launchDemo } = useLaunch()
  const queryClient = useQueryClient()
  const { data: favorites } = useFavorites()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.game(slug ?? ''),
    enabled: !!slug,
    queryFn: () => casinoApi.game(slug as string)
  })

  const favorite = !!slug && (favorites?.slugs ?? []).includes(slug)

  const toggleFavorite = async () => {
    if (!slug) return
    const next = !favorite
    queryClient.setQueryData(queryKeys.favorites, (current: { items: unknown[]; slugs: string[] } | undefined) => {
      if (!current) return current
      return {
        ...current,
        slugs: next ? [...current.slugs, slug] : current.slugs.filter((s) => s !== slug)
      }
    })
    try {
      await api.toggleFavorite(slug, next)
    } finally {
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites })
    }
  }

  return (
    <Sheet open={!!slug} onClose={close} size="lg">
      {isError ? (
        <QueryError title="Превью не загрузилось" onRetry={() => void refetch()} />
      ) : isLoading || !data ? (
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-2xl border border-line">
            <CoverImage
              src={data.game.cover}
              alt={data.game.title}
              width={640}
              height={360}
              className="h-auto w-full object-cover"
              priority
            />
            {data.game.badge && (
              <div className="absolute left-3 top-3">
                <Badge variant={data.game.badge === 'NEW' ? 'new' : 'hot'}>{data.game.badge}</Badge>
              </div>
            )}
            <button
              type="button"
              onClick={toggleFavorite}
              aria-label={favorite ? 'Убрать из избранного' : 'В избранное'}
              className={cn(
                'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition-colors',
                favorite ? 'border-danger/40 bg-danger/20 text-danger' : 'border-line bg-black/40 text-white hover:text-danger'
              )}
            >
              <Heart className={cn('h-4 w-4', favorite && 'fill-current animate-heart-burst')} />
            </button>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">{data.game.title}</h2>
            <Link
              href={`/providers/${data.game.provider.slug}`}
              onClick={close}
              className="text-sm text-ink-muted transition-colors hover:text-accent"
            >
              {data.game.provider.name}
            </Link>
          </div>

          <dl className="grid grid-cols-3 gap-3 rounded-2xl border border-line bg-bg-secondary/50 p-3 text-center">
            <div>
              <dt className="text-2xs uppercase tracking-wide text-ink-dim">RTP</dt>
              <dd className="money-tabular mt-1 text-sm font-semibold text-white">{formatPercent(data.game.rtp)}</dd>
            </div>
            <div>
              <dt className="text-2xs uppercase tracking-wide text-ink-dim">Волатильность</dt>
              <dd className="mt-1 text-sm font-semibold text-white">{volatilityLabels[data.game.volatility]}</dd>
            </div>
            <div>
              <dt className="text-2xs uppercase tracking-wide text-ink-dim">Мин. ставка</dt>
              <dd className="money-tabular mt-1 text-sm font-semibold text-white">{data.game.minBet}</dd>
            </div>
          </dl>

          <div className="flex gap-2">
            <Button variant="primary" fullWidth size="lg" leftIcon={<Play className="h-4 w-4" />} onClick={() => launch(data.game)}>
              Играть
            </Button>
            {data.game.hasDemo && (
              <Button variant="secondary" size="lg" onClick={() => launchDemo(data.game)}>
                Демо
              </Button>
            )}
          </div>

          {data.similar.length > 0 && (
            <section>
              <p className="section-label mb-2">Похожие слоты</p>
              <div className="grid grid-cols-3 gap-2">
                {data.similar.slice(0, 6).map((game) => (
                  <Link
                    key={game.slug}
                    href={`/casino/${game.slug}`}
                    onClick={close}
                    className="overflow-hidden rounded-xl border border-line bg-bg-card transition-colors hover:border-accent/50"
                  >
                    <CoverImage src={game.cover} alt={game.title} width={200} height={200} className="h-auto w-full" />
                    <p className="truncate px-2 py-1.5 text-2xs text-ink-muted">{game.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <Link href={`/casino/${data.game.slug}`} onClick={close} className="block text-center text-sm text-accent hover:text-accent-hover">
            Подробнее об игре →
          </Link>
        </div>
      )}
    </Sheet>
  )
}
