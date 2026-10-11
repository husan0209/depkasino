import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GameDetail } from '@/components/game/GameDetail'
import { allGameSlugs, getGame } from '@/lib/data/catalog'
import { formatPercent } from '@/lib/format'
import { env, siteUrl } from '@/lib/env'

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
      // Картинку для соцсетей подставляет Next из opengraph-image.tsx рядом с этой страницей:
      // собственную ссылку не дублируем, иначе в мета-тег попадает путь без хеша и отдаёт 404.
    },
    twitter: { card: 'summary_large_image' }
  }
}

export default async function GamePage({ params }: { params: { slug: string } }) {
  const data = await getGame(params.slug)
  if (!data) notFound()

  const { game } = data
  const base = siteUrl()

  /**
   * Разметка Schema.org для SEO-прослойки (§20): крошки и карточка игры.
   * RTP отдаём как честное свойство слота, рейтинги не выдумываем.
   */
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: `${base}/` },
          { '@type': 'ListItem', position: 2, name: 'Каталог слотов', item: `${base}/casino` },
          { '@type': 'ListItem', position: 3, name: game.provider.name, item: `${base}/providers/${game.provider.slug}` },
          { '@type': 'ListItem', position: 4, name: game.title, item: `${base}/casino/${game.slug}` }
        ]
      },
      {
        '@type': 'SoftwareApplication',
        name: game.title,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Web',
        url: `${base}/casino/${game.slug}`,
        image: `${base}${game.cover}`,
        inLanguage: 'ru',
        datePublished: game.releasedAt,
        publisher: { '@type': 'Organization', name: game.provider.name, url: `${base}/providers/${game.provider.slug}` },
        description: `Слот ${game.title} от ${game.provider.name}: RTP ${formatPercent(game.rtp)}, минимальная ставка ${game.minBet} ${game.minBetCurrency}.`,
        offers: {
          '@type': 'Offer',
          priceCurrency: game.minBetCurrency,
          // Минимальная ставка — единственная честная «цена» слота, вход в демо бесплатный.
          price: game.minBet,
          availability: 'https://schema.org/InStock'
        }
      }
    ]
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <GameDetail game={game} similar={data.similar} />
    </>
  )
}
