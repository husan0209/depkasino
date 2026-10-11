'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Clock, Search as SearchIcon } from 'lucide-react'
import { Button, EmptyState, SearchInput, Skeleton } from '@/components/ui'
import { GameGrid } from './GameGrid'
import { SectionHeading } from './SectionHeading'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useFavorites, useLastPlayed } from '@/hooks/useWalletData'
import { casinoApi, queryKeys } from '@/lib/api'
import { readJson, writeJson, STORAGE_KEYS } from '@/lib/storage'
import type { Game } from '@/types'

/**
 * Поиск (§4.4 и §5.8): недавние запросы, last played, пустой результат —
 * похожие слоты и сброс. Одно поле поиска на экран.
 */
export function SearchClient({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  // Читаем localStorage после гидратации: на сервере список всегда пуст, иначе разошлись бы разметки.
  const [recent, setRecent] = useState<string[]>([])
  useEffect(() => {
    setRecent(readJson<string[]>(STORAGE_KEYS.recentSearches, []))
  }, [])
  const debounced = useDebouncedValue(query, 300)
  const { data: lastPlayed } = useLastPlayed()
  const { data: favorites } = useFavorites()

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.games({ q: debounced, sort: 'popular' }),
    queryFn: () => casinoApi.games({ q: debounced, sort: 'popular' }),
    enabled: debounced.trim().length > 1
  })

  const { data: fallback } = useQuery({
    queryKey: ['games', 'search-fallback'] as const,
    queryFn: () => casinoApi.games({ sort: 'popular', pageSize: 6 }),
    enabled: !isLoading && debounced.trim().length > 1 && (data?.items.length ?? 0) === 0
  })

  useEffect(() => {
    if (debounced.trim().length > 1) router.replace(`/search?q=${encodeURIComponent(debounced)}`, { scroll: false })
  }, [debounced, router])

  const remember = (value: string) => {
    const next = [value, ...recent.filter((item) => item !== value)].slice(0, 5)
    setRecent(next)
    writeJson(STORAGE_KEYS.recentSearches, next)
  }

  const results = data?.items ?? []
  const tooShort = debounced.trim().length <= 1

  return (
    <div className="container-page mt-6">
      <p className="section-label">Поиск</p>
      <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">Что будем крутить?</h1>

      <SearchInput
        value={query}
        onChange={setQuery}
        onSubmit={remember}
        autoFocus
        className="mt-4"
        placeholder="Sweet Bonanza, Pragmatic Play…"
      />

      {recent.length > 0 && tooShort && (
        <div className="mt-5">
          <p className="section-label mb-2">Недавние запросы</p>
          <div className="flex flex-wrap gap-2">
            {recent.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuery(item)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-secondary px-3 py-1.5 text-sm text-ink-muted hover:text-white"
              >
                <Clock className="h-3.5 w-3.5" />
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {tooShort ? (
        <div className="mt-8 space-y-8">
          {lastPlayed && lastPlayed.length > 0 && (
            <section>
              <SectionHeading label="Твоя история" title="Продолжить играть" href="/history" hrefLabel="История" />
              <GameGrid games={lastPlayed.slice(0, 6).map((entry) => entry.game)} priorityCount={0} />
            </section>
          )}
          {favorites && favorites.items.length > 0 && (
            <section>
              <SectionHeading label="Твоё" title="Избранное" href="/favorites" />
              <GameGrid games={favorites.items.slice(0, 6)} priorityCount={0} />
            </section>
          )}
        </div>
      ) : isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square w-full rounded-2xl" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="mt-6">
          <SectionHeading label="Нашли" title={`${results.length} игр по запросу`} />
          <GameGrid games={results} />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <EmptyState
            icon={<SearchIcon className="h-5 w-5" />}
            title={`Ничего не нашли по «${debounced}»`}
            description="Проверьте написание или посмотрите похожие слоты."
            action={
              <Button variant="secondary" onClick={() => setQuery('')}>
                Сбросить запрос
              </Button>
            }
          />
          {fallback && fallback.items.length > 0 && (
            <section>
              <SectionHeading label="Похожие слоты" title="Может подойти" href="/casino" hrefLabel="Каталог" />
              <GameGrid games={fallback.items as Game[]} priorityCount={0} />
            </section>
          )}
        </div>
      )}
    </div>
  )
}
