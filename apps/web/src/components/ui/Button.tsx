'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

/**
 * Button. `money` — только для «Пополнить» и успешной оплаты (§3.1).
 * `primary` — бренд и «Играть». Зелёный в навигации не используется.
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'money'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-accent',
  secondary: 'bg-bg-secondary text-ink border border-line hover:border-accent/60 hover:text-white',
  ghost: 'bg-transparent text-ink-muted hover:bg-bg-secondary hover:text-ink',
  danger: 'bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25',
  money: 'bg-money text-[#04220F] hover:bg-money-hover shadow-money'
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl gap-1.5',
  md: 'h-11 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-5 text-base rounded-2xl gap-2'
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? <Spinner size={size === 'lg' ? 'md' : 'sm'} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
})
