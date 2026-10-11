import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CatalogClient } from '@/components/casino/CatalogClient'
import { getGames, getProviders } from '@/lib/data/catalog'
import type { GameSort } from '@/types'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Каталог слотов',
  description: 'Все слоты в одном месте: поиск, провайдеры, новинки и популярные игры. Фильтры сохраняются в ссылке.',
  alternates: { canonical: '/casino' }
}

export default async function CasinoPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const flat = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)
  const q = flat(searchParams.q) ?? ''
  const category = (flat(searchParams.category) as CategoryParam) ?? 'all'
  const provider = flat(searchParams.provider) ?? 'all'
  const sort = (flat(searchParams.sort) as GameSort) ?? 'popular'

  // «Избранное» — клиентское состояние (localStorage), его на сервере не собрать.
  const filters = {
    q: q || undefined,
    category: category === 'favorites' ? undefined : category,
    provider: provider === 'all' ? undefined : provider,
    sort
  }

  const [providers, initialPage] = await Promise.all([
    getProviders(),
    category === 'favorites' ? Promise.resolve(undefined) : getGames({ ...filters, page: 1, pageSize: 12 })
  ])

  return (
    <Suspense fallback={null}>
      <CatalogClient
        providers={providers}
        initialPage={initialPage}
        initial={{ q, category, provider, sort }}
      />
    </Suspense>
  )
}

type CategoryParam = 'all' | 'new' | 'popular' | 'favorites'
