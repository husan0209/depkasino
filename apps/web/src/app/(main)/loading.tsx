import { Skeleton } from '@/components/ui'

/**
 * Скелетон перехода между разделами (§23 блок I): шапка и таб-бар остаются на месте,
 * вместо пустого экрана — привычная сетка. Разметка повторяет типовую страницу каталога,
 * поэтому «прыжка» вёрстки при подмене нет.
 */
export default function MainLoading() {
  return (
    <div className="container-page mt-6">
      <Skeleton className="h-4 w-24 rounded-lg" />
      <Skeleton className="mt-3 h-7 w-64 rounded-xl" />

      <div className="mt-5 flex gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <Skeleton className="mt-2 h-3.5 w-3/4 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
