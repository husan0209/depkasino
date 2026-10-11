'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Info, Play } from 'lucide-react'
import { Badge as BadgeTag } from '@/components/ui'
import { formatRelativeTime } from '@/lib/dates'
import { useUIStore } from '@/stores/ui'
import { useLaunch } from '@/hooks/useLaunch'
import { cn } from '@/lib/cn'
import { CoverImage } from '@/components/shared/CoverImage'
import type { Game } from '@/types'

/**
 * GameCard (§6.4 и §4.5 Части 5.1, донор B):
 * обложка во весь тайл, «i» в углу, один бейдж, имя один раз — под обложкой.
 * На мобильной карточке НЕТ кнопок «Играть/Демо»: тап по обложке запускает игру.
 * На десктопе hover показывает «Играть / Демо», но клик по обложке всё равно запускает.
 */
export function GameCard({ game, priority = false, compact = false }: { game: Game; priority?: boolean; compact?: boolean }) {
  const router = useRouter()
  const openGamePreview = useUIStore((state) => state.openGamePreview)
  const { launch, launchDemo } = useLaunch()

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => launch(game)}
        aria-label={`Играть в ${game.title}`}
        className="block w-full overflow-hidden rounded-2xl border border-line bg-bg-card text-left transition-colors hover:border-accent/50"
      >
        <span className="relative block aspect-square w-full overflow-hidden">
          <CoverImage
            src={game.cover}
            alt={game.title}
            fill
            sizes="(max-width: 768px) 45vw, 220px"
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
          {game.badge && (
            <span className="absolute left-2 top-2">
              <BadgeTag variant={game.badge === 'NEW' ? 'new' : 'hot'}>{game.badge}</BadgeTag>
            </span>
          )}

          {/* Десктоп: hover доп. кнопки (клик по обложке всё равно запускает) */}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 hidden translate-y-2 items-center justify-center gap-2 p-3 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
            <span className="pointer-events-auto inline-flex h-8 items-center gap-1 rounded-xl bg-accent px-3 text-xs font-semibold text-white">
              <Play className="h-3.5 w-3.5" /> Играть
            </span>
            {game.hasDemo && (
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation()
                  launchDemo(game)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.stopPropagation()
                    launchDemo(game)
                  }
                }}
                className="pointer-events-auto inline-flex h-8 items-center rounded-xl border border-line bg-bg-primary/90 px-3 text-xs font-semibold text-ink-muted hover:text-white"
              >
                Демо
              </span>
            )}
          </span>
        </span>
      </button>

      {/* «i» — превью: провайдер, RTP, демо, избранное */}
      <button
        type="button"
        onClick={() => openGamePreview(game.slug)}
        aria-label={`Превью ${game.title}`}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-black/45 text-white backdrop-blur transition-colors hover:bg-accent hover:border-accent"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {!compact && (
        <div className="mt-2 px-0.5">
          <p className="truncate text-sm font-medium text-white">{game.title}</p>
          <button
            type="button"
            onClick={() => router.push(`/providers/${game.provider.slug}`)}
            className="truncate text-xs text-ink-muted transition-colors hover:text-accent"
          >
            {game.provider.name}
          </button>
        </div>
      )}
    </div>
  )
}

/** Карточка last played: относительное время + мини-кнопка play (§4.3 Части 5.1). */
export function LastPlayedCard({ game, playedAt }: { game: Game; playedAt: string }) {
  const openGamePreview = useUIStore((state) => state.openGamePreview)
  const { launch } = useLaunch()

  return (
    <div className="relative w-[132px] shrink-0 snap-start">
      <button
        type="button"
        onClick={() => launch(game)}
        className="block w-full overflow-hidden rounded-2xl border border-line bg-bg-card transition-colors hover:border-accent/50"
      >
        <span className="relative block aspect-square w-full">
          <CoverImage src={game.cover} alt={game.title} fill sizes="132px" className="object-cover" />
        </span>
      </button>
      <button
        type="button"
        aria-label={`Продолжить ${game.title}`}
        onClick={() => launch(game)}
        className="absolute bottom-10 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-lift transition-transform hover:scale-105"
      >
        <Play className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => openGamePreview(game.slug)}
        className="mt-2 block w-full truncate text-left text-xs font-medium text-white"
      >
        {game.title}
      </button>
      <p className="text-2xs text-ink-dim">{formatRelativeTime(playedAt)}</p>
    </div>
  )
}
