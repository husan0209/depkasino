import { readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Общий каркас OG-картинок (§20): одна и та же сетка, палитра и подпись для главной и карточек игр.
 * Шрифты читаем из репозитория: у набора next/og нет кириллицы, без TTF текст превратится в квадраты.
 */

const fontsDir = path.join(process.cwd(), 'src', 'assets', 'fonts')

export interface OgCardData {
  eyebrow: string
  title: string
  badges?: string[]
  footnote?: string
}

let cachedFonts: [Buffer, Buffer] | null = null

export async function ogFonts(): Promise<Array<{ name: string; data: Buffer; weight: 400 | 700; style: 'normal' }>> {
  if (!cachedFonts) {
    cachedFonts = await Promise.all([
      readFile(path.join(fontsDir, 'DejaVuSans.ttf')),
      readFile(path.join(fontsDir, 'DejaVuSans-Bold.ttf'))
    ])
  }
  return [
    { name: 'DejaVu Sans', data: cachedFonts[0], weight: 400, style: 'normal' },
    { name: 'DejaVu Sans', data: cachedFonts[1], weight: 700, style: 'normal' }
  ]
}

/** Размер и формат у всех карточек одинаковые — мета-теги не расходятся. */
export const ogSize = { width: 1200, height: 630 }
export const ogContentType = 'image/png'

export function OgCard({ eyebrow, title, badges = [], footnote }: OgCardData) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        background: '#0F0F1A',
        color: '#FFFFFF',
        fontFamily: 'DejaVu Sans'
      }}
    >
      {/* Брендовое свечение: цвет акцента, без баннерного мусора */}
      <div style={{ position: 'absolute', top: -180, right: -120, width: 620, height: 620, borderRadius: 620, background: 'rgba(108, 99, 255, 0.35)' }} />
      <div style={{ position: 'absolute', bottom: -200, left: -140, width: 520, height: 520, borderRadius: 520, background: 'rgba(0, 210, 255, 0.14)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: '#6C63FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700 }}>D</div>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 0.5 }}>Depkasino</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 840 }}>
        <div style={{ display: 'flex', fontSize: 26, color: '#9A9AB5' }}>{eyebrow}</div>
        <div style={{ display: 'flex', fontSize: title.length > 22 ? 68 : 84, fontWeight: 700, lineHeight: 1.08 }}>{title}</div>
        {badges.length > 0 && (
          <div style={{ display: 'flex', gap: 14 }}>
            {badges.map((badge, index) => (
              // Первый бейдж — акцент бренда, а не зелёный: зелёный отдан деньгам и успеху (§2.4).
              <div
                key={badge}
                style={{
                  display: 'flex',
                  padding: '10px 20px',
                  borderRadius: 999,
                  background: index === 0 ? 'rgba(108, 99, 255, 0.22)' : '#1A1A2E',
                  color: index === 0 ? '#CFCBFF' : '#C9C9DC',
                  fontSize: 24,
                  fontWeight: index === 0 ? 600 : 400
                }}
              >
                {badge}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', maxWidth: 720, fontSize: 23, color: '#9A9AB5' }}>
          {footnote ?? 'Демо без регистрации · кошельки ₽ ₸ ₴ Br soʻm USDT BTC'}
        </div>
        {/* Три барабана: тот же мотив, что в герое витрины */}
        <div style={{ display: 'flex', gap: 12 }}>
          {['◆', '7', '★'].map((glyph) => (
            <div key={glyph} style={{ display: 'flex', width: 54, height: 132, borderRadius: 14, background: '#15152A', border: '1px solid #2A2A4A', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>
              {glyph}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
