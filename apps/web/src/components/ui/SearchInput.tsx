'use client'

import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Поиск игр и провайдеров',
  autoFocus,
  className
}: {
  value: string
  onChange(value: string): void
  onSubmit?(value: string): void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}) {
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.(value)
      }}
      className={cn(
        'flex h-11 items-center gap-2 rounded-xl border border-line bg-bg-secondary px-3 transition-colors focus-within:border-accent',
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-ink-muted" />
      <input
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Поиск"
        className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-dim md:text-sm"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Очистить" className="text-ink-muted hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  )
}
