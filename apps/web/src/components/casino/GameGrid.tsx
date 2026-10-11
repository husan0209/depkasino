'use client'

import { GameCard } from './GameCard'
import { SkeletonCard } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Game } from '@/types'

/** Сетка слотов: 2 колонки на телефоне, 5–6 на десктопе (§21). */
export function GameGrid({ games, priorityCount = 4, className }: { games: Game[]; priorityCount?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6', className)}>
      {games.map((game, index) => (
        <GameCard key={game.slug} game={game} priority={index < priorityCount} />
      ))}
    </div>
  )
}

export function GameGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  )
}
