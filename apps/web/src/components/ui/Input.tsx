'use client'

import { forwardRef, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  hint?: string
  error?: string
  success?: boolean
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  /** Тип password получает кнопку показать/скрыть и индикатор силы отдельно. */
  revealToggle?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, success, prefix, suffix, revealToggle, className, type = 'text', id, ...props },
  ref
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const [revealed, setRevealed] = useState(false)
  const actualType = revealToggle && type === 'password' ? (revealed ? 'text' : 'password') : type

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm text-ink-muted">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex h-11 items-center gap-2 rounded-xl border bg-bg-secondary px-3 transition-colors',
          error ? 'border-danger' : success ? 'border-money/60' : 'border-line focus-within:border-accent',
          props.disabled && 'opacity-60'
        )}
      >
        {prefix && <span className="shrink-0 text-sm text-ink-muted">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          type={actualType}
          aria-invalid={!!error}
          className={cn(
            'h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-dim md:text-sm',
            className
          )}
          {...props}
        />
        {revealToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? 'Скрыть пароль' : 'Показать пароль'}
            className="shrink-0 p-1 text-ink-muted hover:text-ink"
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        {suffix && <span className="shrink-0 text-sm text-ink-muted">{suffix}</span>}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
})
