import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GamePlayer } from '@/components/game/GamePlayer'
import { findGame } from '@/mocks/games'
import type { Currency } from '@/types'

export const metadata: Metadata = { title: 'Игра', robots: { index: false, follow: false } }

/**
 * Игровой экран. Сюда ведёт launch из карточки, превью и last played.
 * В мок-режиме рендерится имитация игрового поля, в live — iframe провайдера (/play/remote).
 */
export default function PlayPage({
  searchParams
}: {
  searchParams: { game?: string; currency?: string; demo?: string }
}) {
  const slug = searchParams.game
  if (!slug) notFound()

  const game = findGame(slug)
  if (!game) notFound()

  const currency = (searchParams.currency as Currency) ?? 'RUB'
  const demo = searchParams.demo === '1'

  return <GamePlayer gameTitle={game.title} gameSlug={game.slug} currency={currency} demo={demo} />
}
