'use client'

import { cn } from '@/lib/cn'

export interface TabItem<T extends string = string> {
  value: T
  label: string
  count?: number
}

/** Табы: профиль, история, каталог-фильтры. Скроллятся, если не влезают на телефоне. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  variant = 'underline'
}: {
  items: Array<TabItem<T>>
  value: T
  onChange(value: T): void
  className?: string
  variant?: 'underline' | 'pills'
}) {
  if (variant === 'pills') {
    return (
      <div className={cn('scroll-row', className)} role="tablist">
        {items.map((item) => (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={value === item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              'shrink-0 snap-start rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              value === item.value
                ? 'border-accent bg-accent/15 text-white'
                : 'border-line bg-bg-secondary text-ink-muted hover:text-ink'
            )}
          >
            {item.label}
            {typeof item.count === 'number' && <span className="ml-1.5 text-xs opacity-70">{item.count}</span>}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('scroll-row border-b border-line', className)} role="tablist">
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          type="button"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'relative shrink-0 snap-start px-4 py-3 text-sm font-medium transition-colors',
            value === item.value ? 'text-white' : 'text-ink-muted hover:text-ink'
          )}
        >
          {item.label}
          {typeof item.count === 'number' && <span className="ml-1.5 text-xs opacity-70">{item.count}</span>}
          {value === item.value && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
        </button>
      ))}
    </div>
  )
}
