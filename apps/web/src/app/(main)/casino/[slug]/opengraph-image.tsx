import { ImageResponse } from 'next/og'
import { getGame } from '@/lib/data/catalog'
import { formatPercent } from '@/lib/format'
import { OgCard, ogContentType, ogFonts, ogSize } from '@/lib/og-card'

/**
 * OG-картинка карточки игры (§20, SEO-прослойка): генерируется на сборке для каждой игры.
 * Только текст и графика бренда — каверы провайдеров это SVG, их растрирование в OG нестабильно.
 */
export const size = ogSize
export const contentType = ogContentType
export const alt = 'Слот в браузере: играть в демо или на деньги'

export default async function Image({ params }: { params: { slug: string } }) {
  const data = await getGame(params.slug)
  const game = data?.game

  return new ImageResponse(
    (
      <OgCard
        eyebrow={game ? game.provider.name : 'Слоты онлайн'}
        title={game ? game.title : 'Твой следующий большой спин'}
        badges={
          game
            ? [`RTP ${formatPercent(game.rtp)}`, `мин. ставка ${game.minBet} ${game.minBetCurrency}`]
            : undefined
        }
        footnote="Демо без регистрации · кошельки ₽ ₸ ₴ Br soʻm USDT BTC"
      />
    ),
    { ...size, fonts: await ogFonts() }
  )
}
