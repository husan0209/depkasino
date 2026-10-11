'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useMounted } from '@/hooks/useMounted'

/** Modal/Dialog — подтверждения и десктопные сценарии (§3.1). */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md'
}: {
  open: boolean
  onClose(): void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const mounted = useMounted()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" aria-label="Закрыть" onClick={onClose} className="absolute inset-0 animate-fade-in bg-black/75" />
      <div
        className={cn(
          'relative w-full animate-scale-in rounded-3xl border border-line bg-bg-primary p-5 shadow-card',
          size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md'
        )}
      >
        <div className="flex items-start justify-between gap-4">
          {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="-mr-1 -mt-1 rounded-xl p-2 text-ink-muted hover:bg-bg-secondary hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3">{children}</div>
        {footer && <div className="mt-5 flex flex-col gap-2 md:flex-row md:justify-end">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
