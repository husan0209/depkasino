import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/env'
import { allGameSlugs, allProviderSlugs, getGames, getProviders } from '@/lib/data/catalog'

/**
 * sitemap.xml: только публичные страницы (Часть 5, §20).
 * Приватные разделы, авторизация и игровые экраны в карту не попадают вовсе —
 * их закрывают и robots.txt, и noindex.
 *
 * Даты берём из данных каталога: releasedAt для игр и актуальность витрины для разделов.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/casino`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/providers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/responsible-gaming`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 }
  ]

  const [games, providers] = await Promise.all([getGames(), getProviders()])
  const releasedAt = new Map(games.items.map((game) => [game.slug, new Date(game.releasedAt)]))

  const gamePages: MetadataRoute.Sitemap = allGameSlugs().map((slug) => ({
    url: `${base}/casino/${slug}`,
    lastModified: releasedAt.get(slug) ?? now,
    changeFrequency: 'weekly',
    priority: 0.8
  }))

  const providerPages: MetadataRoute.Sitemap = providers.map((provider) => ({
    url: `${base}/providers/${provider.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6
  }))

  const providerSlugs = new Set(providers.map((provider) => provider.slug))
  const missing = allProviderSlugs().filter((slug) => !providerSlugs.has(slug))
  if (missing.length > 0) {
    // Каталог и список студий разошлись — не молчим, это ошибка данных.
    console.warn(`[sitemap] провайдеры без страниц: ${missing.join(', ')}`)
  }

  return [...staticPages, ...gamePages, ...providerPages]
}
