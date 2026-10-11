'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useMounted } from '@/hooks/useMounted'

/**
 * Sheet — нижняя модалка телефона и основной контейнер кассы (§3.1).
 * Одна рука: ручка сверху, крупные элементы, скролл внутри, закрытие по фону и «✕».
 */
export interface SheetProps {
  open: boolean
  onClose(): void
  title?: string
  /** Подзаголовок — микрокоп доверия, сеть, остаток лимита. */
  subtitle?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  /** Широкий вариант для десктопа-модалки. */
  size?: 'md' | 'lg'
  closeOnBackdrop?: boolean
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true
}: SheetProps) {
  const mounted = useMounted()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Закрыть"
        onClick={() => closeOnBackdrop && onClose()}
        className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-[2px]"
      />
      <div
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-bg-primary shadow-sheet animate-sheet-up',
          'md:max-h-[86dvh] md:rounded-3xl',
          size === 'lg' ? 'md:max-w-xl' : 'md:max-w-md'
        )}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
            {subtitle && <div className="mt-1 text-xs text-ink-muted">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="-mr-1 -mt-1 rounded-xl p-2 text-ink-muted transition-colors hover:bg-bg-secondary hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
        {footer && (
          <div className="border-t border-line bg-bg-primary px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
