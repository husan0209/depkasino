'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Пагинация — для десктопных таблиц истории. На телефоне работает infinite scroll. */
export function Pagination({
  page,
  totalPages,
  onChange,
  className
}: {
  page: number
  totalPages: number
  onChange(page: number): void
  className?: string
}) {
  if (totalPages <= 1) return null

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="inline-flex h-9 items-center gap-1 rounded-xl border border-line px-3 text-sm text-ink-muted disabled:opacity-40 hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Назад
      </button>
      <span className="money-tabular text-sm text-ink-muted">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="inline-flex h-9 items-center gap-1 rounded-xl border border-line px-3 text-sm text-ink-muted disabled:opacity-40 hover:text-ink"
      >
        Вперёд <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
