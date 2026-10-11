'use client'

import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { Button, EmptyState, QueryError } from '@/components/ui'
import { GameGrid, GameGridSkeleton } from './GameGrid'
import { useFavorites, usePopularFallback } from '@/hooks/useWalletData'

/** Избранное (§5.9): пусто → 6 популярных слотов + «В каталог». */
export function FavoritesClient() {
  const router = useRouter()
  const { data, isLoading, isError, refetch } = useFavorites()
  const { data: popular } = usePopularFallback()

  if (isError) {
    return (
      <div className="container-page mt-6">
        <QueryError title="Избранное не загрузилось" onRetry={() => void refetch()} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container-page mt-6">
        <GameGridSkeleton count={6} />
      </div>
    )
  }

  const items = data?.items ?? []

  return (
    <div className="container-page mt-6">
      <p className="section-label">Твоё</p>
      <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">Избранное</h1>

      {items.length === 0 ? (
        <div className="mt-6 space-y-6">
          <EmptyState
            icon={<Heart className="h-5 w-5" />}
            title="Пока пусто"
            description="Отмечайте игры сердечком — вернётесь к ним одной кнопкой."
            action={<Button onClick={() => router.push('/casino')}>В каталог</Button>}
          />
          {popular && popular.items.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-white">Популярные слоты</h2>
              <GameGrid games={popular.items.slice(0, 6)} priorityCount={0} />
            </>
          )}
        </div>
      ) : (
        <GameGrid games={items} className="mt-6" />
      )}
    </div>
  )
}
