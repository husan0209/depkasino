'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Check, Info, Wallet, X } from 'lucide-react'
import { useToastStore } from '@/stores/toast'
import { cn } from '@/lib/cn'

const icons = {
  success: Check,
  money: Wallet,
  error: AlertTriangle,
  info: Info
} as const

const accents = {
  success: 'text-money border-money/30',
  money: 'text-money border-money/30',
  error: 'text-danger border-danger/40',
  info: 'text-accent-secondary border-accent-secondary/30'
} as const

function ToastCard({ id }: { id: string }) {
  const item = useToastStore((state) => state.items.find((t) => t.id === id))
  const dismiss = useToastStore((state) => state.dismiss)

  useEffect(() => {
    if (!item) return
    const timer = setTimeout(() => dismiss(item.id), item.duration)
    return () => clearTimeout(timer)
  }, [item, dismiss])

  if (!item) return null

  const Icon = icons[item.variant]

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-2xl border bg-bg-elevated/95 p-3.5 shadow-card backdrop-blur animate-rise-in',
        accents[item.variant]
      )}
    >
      <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-bg-secondary', accents[item.variant])}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{item.title}</p>
        {item.description && <p className="mt-0.5 text-xs text-ink-muted">{item.description}</p>}
        {item.action && (
          <div className="mt-2">
            {item.action.href ? (
              <Link
                href={item.action.href}
                onClick={() => dismiss(item.id)}
                className="text-xs font-semibold text-accent hover:text-accent-hover"
              >
                {item.action.label} →
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  item.action?.onClick?.()
                  dismiss(item.id)
                }}
                className="text-xs font-semibold text-accent hover:text-accent-hover"
              >
                {item.action.label} →
              </button>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label="Закрыть"
        className="rounded-lg p-1 text-ink-muted hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Стек тостов. Тяжёлых баннеров и live-ticker нет (§16.2). */
export function ToastViewport() {
  const items = useToastStore((state) => state.items)
  if (items.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[90] flex flex-col gap-2 md:inset-x-auto md:right-4 md:top-4 md:w-[360px]">
      {items.map((item) => (
        <ToastCard key={item.id} id={item.id} />
      ))}
    </div>
  )
}
