import type { Metadata } from 'next'
import { GamePlayer } from '@/components/game/GamePlayer'
import { findGame } from '@/mocks/games'
import type { Currency } from '@/types'

export const metadata: Metadata = { title: 'Игра', robots: { index: false, follow: false } }

/** Live-касса провайдера: сюда приходит launch URL из API Части 4. */
export default function RemotePlayPage({
  searchParams
}: {
  searchParams: { url?: string; game?: string; currency?: string }
}) {
  if (!searchParams.url) {
    return (
      <div className="flex h-dvh items-center justify-center px-6 text-center text-sm text-ink-muted">
        Launch URL не передан. Вернитесь в каталог и запустите игру снова.
      </div>
    )
  }

  const game = searchParams.game ? findGame(searchParams.game) : undefined

  return (
    <GamePlayer
      gameTitle={game?.title ?? 'Игра'}
      gameSlug={game?.slug ?? ''}
      currency={(searchParams.currency as Currency) ?? 'RUB'}
      demo={false}
      remoteUrl={searchParams.url}
    />
  )
}
