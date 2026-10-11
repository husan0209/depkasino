import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GameDetail } from '@/components/game/GameDetail'
import { allGameSlugs, getGame } from '@/lib/data/catalog'
import { formatPercent } from '@/lib/format'
import { env } from '@/lib/env'

export const revalidate = 60

export function generateStaticParams() {
  return allGameSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getGame(params.slug)
  if (!data) return { title: 'Игра не найдена' }
  const { game } = data

  return {
    title: `${game.title} — играть онлайн`,
    description: `${game.title} от ${game.provider.name}: RTP ${formatPercent(game.rtp)}, минимальная ставка ${game.minBet}. Играйте в демо или на деньги в своей валюте.`,
    alternates: { canonical: `/casino/${game.slug}` },
    openGraph: {
      title: `${game.title} — играть онлайн | ${env.siteName}`,
      description: `${game.title} от ${game.provider.name}. RTP ${formatPercent(game.rtp)}.`,
      images: [{ url: game.cover, width: 600, height: 600, alt: game.title }]
    }
  }
}

export default async function GamePage({ params }: { params: { slug: string } }) {
  const data = await getGame(params.slug)
  if (!data) notFound()

  return <GameDetail game={data.game} similar={data.similar} />
}
