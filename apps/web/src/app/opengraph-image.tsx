import { ImageResponse } from 'next/og'
import { OgCard, ogContentType, ogFonts, ogSize } from '@/lib/og-card'

/** OG-картинка витрины: тэглайн и честные обещания, без «выигрышей» в заголовке. */
export const size = ogSize
export const contentType = ogContentType
export const alt = 'Depkasino — слоты онлайн в своей валюте'

export default async function Image() {
  return new ImageResponse(
    (
      <OgCard
        eyebrow="Слоты онлайн · СНГ"
        title="Твой следующий большой спин."
        badges={['Демо без регистрации', 'Без конвертации валют']}
        footnote="₽ · ₸ · ₴ · Br · soʻm · USDT · BTC — отдельные кошельки, честные выплаты"
      />
    ),
    { ...size, fonts: await ogFonts() }
  )
}
