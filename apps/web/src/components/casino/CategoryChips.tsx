'use client'

import { cn } from '@/lib/cn'

/** Порядок чипов: Все → Слоты → Новые → Популярные → Избранное (§4.6). */
export type CategoryValue = 'all' | 'slots' | 'new' | 'popular' | 'favorites'

const CHIPS: Array<{ value: CategoryValue; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'slots', label: 'Слоты' },
  { value: 'new', label: 'Новые' },
  { value: 'popular', label: 'Популярные' },
  { value: 'favorites', label: 'Избранное' }
]

export function CategoryChips({
  value,
  onChange,
  className
}: {
  value: CategoryValue
  onChange(value: CategoryValue): void
  className?: string
}) {
  return (
    <div className={cn('scroll-row', className)} role="tablist" aria-label="Категории игр">
      {CHIPS.map((chip) => (
        <button
          key={chip.value}
          type="button"
          role="tab"
          aria-selected={value === chip.value}
          onClick={() => onChange(chip.value)}
          className={cn(
            'shrink-0 snap-start rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
            value === chip.value
              ? 'border-accent bg-accent/15 text-white'
              : 'border-line bg-bg-secondary text-ink-muted hover:text-ink'
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
