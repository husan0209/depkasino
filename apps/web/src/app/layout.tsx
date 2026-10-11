import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import '@/styles/globals.css'
import { SESSION_HINT_SCRIPT } from '@/lib/session-hint'
import { AppProviders } from '@/components/shared/AppProviders'
import { env, siteUrl } from '@/lib/env'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${env.siteName} — слоты онлайн`,
    template: `%s | ${env.siteName}`
  },
  description:
    'Онлайн-слоты без лишних шагов: играйте сразу, пополняйте кошелёк в своей валюте. RUB, UAH, BYN, KZT, UZS, USDT и BTC — отдельные балансы без конвертации.',
  applicationName: env.siteName,
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: env.siteName,
    title: `${env.siteName} — твой следующий большой спин`,
    description: 'Слоты, честные выплаты и кошельки без конвертации.'
  },
  robots: { index: true, follow: true }
}

export const viewport: Viewport = {
  themeColor: '#0F0F1A',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body>
        {/* Роль для первого кадра: гость/свой — без вспышки чужого контента. */}
        <Script id="session-hint" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: SESSION_HINT_SCRIPT }} />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
