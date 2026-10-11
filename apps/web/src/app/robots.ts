import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/env'

/**
 * robots.txt: индексируем витрину и SEO-страницы, закрываем приватные разделы и игровые экраны.
 * Приватные страницы дополнительно помечены noindex в своих metadata (§20) — robots это подстраховка.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/wallet',
          '/profile',
          '/history',
          '/kyc',
          '/support',
          '/referral',
          '/favorites',
          '/play',
          '/login',
          '/register',
          '/verify-email',
          '/forgot-password',
          '/reset-password'
        ]
      }
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl()
  }
}
