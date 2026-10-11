'use client'

import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  placeholder
}: {
  value: T | ''
  onChange(value: T): void
  options: Array<SelectOption<T>>
  label?: string
  className?: string
  placeholder?: string
}) {
  const id = useId()

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm text-ink-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          className="h-11 w-full appearance-none rounded-xl border border-line bg-bg-secondary px-3 pr-9 text-sm text-ink outline-none transition-colors focus:border-accent"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      </div>
    </div>
  )
}
