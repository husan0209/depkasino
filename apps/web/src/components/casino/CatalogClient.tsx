'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useInfiniteQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button, EmptyState, Select, Sheet, SearchInput } from '@/components/ui'
import { GameGrid, GameGridSkeleton } from './GameGrid'
import { CategoryChips, type CategoryValue } from './CategoryChips'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { casinoApi, queryKeys } from '@/lib/api'
import { useFavorites } from '@/hooks/useWalletData'
import { cn } from '@/lib/cn'
import type { Game, GameFilters, GameSort, Paginated, Provider } from '@/types'

/**
 * Каталог (§7 и §4.6): один поиск, чипы, фильтры в URL, счётчик «Найдено N»,
 * infinite scroll со скелетонами, ошибкой с «повторить» и концом «больше игр нет».
 */
export function CatalogClient({
  providers,
  initial,
  initialPage
}: {
  providers: Provider[]
  initial: { q: string; category: CategoryValue; provider: string; sort: GameSort }
  /** Первая страница каталога пришла из SSR — сетка и «Найдено N» видны сразу. */
  initialPage?: Paginated<Game>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: favorites } = useFavorites()

  const [query, setQuery] = useState(initial.q)
  const [category, setCategory] = useState<CategoryValue>(initial.category ?? 'all')
  const [provider, setProvider] = useState(initial.provider ?? 'all')
  const [sort, setSort] = useState<GameSort>(initial.sort ?? 'popular')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const debouncedQuery = useDebouncedValue(query, 350)
  const sentinel = useRef<HTMLDivElement>(null)

  const applyUrl = useCallback(
    (next: { q?: string; category?: CategoryValue; provider?: string; sort?: GameSort }) => {
      const params = new URLSearchParams(searchParams.toString())
      const merged = { q: debouncedQuery, category, provider, sort, ...next }
      const set = (key: string, value?: string) => {
        if (!value || value === 'all' || (key === 'q' && !value)) params.delete(key)
        else params.set(key, value)
      }
      set('q', merged.q)
      set('category', merged.category)
      set('provider', merged.provider === 'all' ? '' : merged.provider)
      set('sort', merged.sort === 'popular' ? '' : merged.sort)
      router.replace(`/casino${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })
    },
    [category, debouncedQuery, provider, router, searchParams, sort]
  )

  useEffect(() => {
    applyUrl({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  const filters: GameFilters & { favoritesOnly?: boolean } = useMemo(
    () => ({
      q: debouncedQuery || undefined,
      category: category === 'favorites' ? undefined : category,
      provider: provider === 'all' ? undefined : provider,
      sort,
      favoritesOnly: category === 'favorites'
    }),
    [category, debouncedQuery, provider, sort]
  )

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: queryKeys.games({ ...filters, page: 1 }),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => casinoApi.games({ ...filters, page: pageParam as number, pageSize: 12 }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialData: initialPage ? { pages: [initialPage], pageParams: [1] } : undefined
  })

  // Infinite scroll: Intersection Observer (§7).
  useEffect(() => {
    const node = sentinel.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) void fetchNextPage()
      },
      { rootMargin: '400px 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const games = data?.pages.flatMap((page) => page.items) ?? []
  const total = data?.pages[0]?.total ?? 0
  const filtersActive = !!debouncedQuery || category !== 'all' || provider !== 'all' || sort !== 'popular'

  const resetFilters = () => {
    setQuery('')
    setCategory('all')
    setProvider('all')
    setSort('popular')
    router.replace('/casino', { scroll: false })
  }

  return (
    <div className="container-page mt-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-label">Каталог</p>
          <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">Слоты, которые хочется крутить</h1>
        </div>
        <span className="hidden shrink-0 rounded-xl border border-line bg-bg-secondary px-3 py-1.5 text-xs text-ink-muted sm:block">
          Найдено <span className="money-tabular font-semibold text-white">{total}</span>
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            onSubmit={(value) => {
              setQuery(value)
              applyUrl({ q: value })
            }}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={cn(
              'inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors lg:hidden',
              filtersActive ? 'border-accent text-white' : 'border-line text-ink-muted'
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Фильтры
          </button>
        </div>

        <CategoryChips value={category} onChange={(value) => { setCategory(value); applyUrl({ category: value }) }} />

        {/* Десктоп: сортировка и провайдер прямо в строке */}
        <div className="hidden gap-3 lg:flex">
          <Select
            value={sort}
            onChange={(value) => {
              setSort(value)
              applyUrl({ sort: value })
            }}
            options={[
              { value: 'popular', label: 'Популярные' },
              { value: 'new', label: 'Новые' },
              { value: 'az', label: 'А–Я' }
            ]}
            className="max-w-[220px]"
          />
          <Select
            value={provider}
            onChange={(value) => {
              setProvider(value)
              applyUrl({ provider: value })
            }}
            options={[{ value: 'all', label: 'Все провайдеры' }, ...providers.map((p) => ({ value: p.slug, label: p.name }))]}
            className="max-w-[260px]"
          />
          {filtersActive && (
            <Button variant="ghost" size="md" leftIcon={<X className="h-4 w-4" />} onClick={resetFilters}>
              Сбросить
            </Button>
          )}
        </div>

        {filtersActive && (
          <div className="flex items-center justify-between text-xs text-ink-muted sm:hidden">
            <span>
              Найдено <span className="money-tabular font-semibold text-white">{total}</span>
            </span>
            <button type="button" onClick={resetFilters} className="font-semibold text-accent">
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <GameGridSkeleton count={12} />
        ) : isError ? (
          <EmptyState
            title="Каталог не ответил"
            description="Провайдер не отдал список игр. Попробуйте ещё раз — это быстро."
            action={<Button onClick={() => void refetch()}>Повторить</Button>}
          />
        ) : games.length === 0 ? (
          <EmptyState
            title="Ничего не нашли"
            description={debouncedQuery ? `По запросу «${debouncedQuery}» игр нет. Попробуйте другое название.` : 'Под этими фильтрами игр нет.'}
            action={
              <div className="flex gap-2">
                <Button variant="secondary" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
                <Button onClick={() => router.push('/casino?sort=popular')}>Популярные слоты</Button>
              </div>
            }
          />
        ) : (
          <>
            <GameGrid games={games} />
            <div ref={sentinel} className="h-10" />
            {isFetchingNextPage && <GameGridSkeleton count={6} />}
            {!hasNextPage && games.length > 0 && (
              <p className="mt-6 text-center text-sm text-ink-muted">Больше игр нет</p>
            )}
          </>
        )}
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Фильтры">
        <div className="space-y-4">
          <Select
            label="Сортировка"
            value={sort}
            onChange={(value) => {
              setSort(value)
              applyUrl({ sort: value })
            }}
            options={[
              { value: 'popular', label: 'Популярные' },
              { value: 'new', label: 'Новые' },
              { value: 'az', label: 'А–Я' }
            ]}
          />
          <Select
            label="Провайдер"
            value={provider}
            onChange={(value) => {
              setProvider(value)
              applyUrl({ provider: value })
            }}
            options={[{ value: 'all', label: 'Все провайдеры' }, ...providers.map((p) => ({ value: p.slug, label: p.name }))]}
          />
          <p className="text-xs text-ink-muted">
            Найдено <span className="money-tabular font-semibold text-white">{total}</span> игр
            {category === 'favorites' && favorites ? ` · в избранном ${favorites.slugs.length}` : ''}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={resetFilters}>
              Сбросить
            </Button>
            <Button fullWidth onClick={() => setFiltersOpen(false)}>
              Показать {total}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
