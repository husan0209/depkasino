'use client'

import { cn } from '@/lib/cn'

/** Индикатор силы пароля вместо отдельного поля «подтвердите пароль» (§5.1). */
export function scorePassword(value: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-ZА-Я]/.test(value) && /[a-zа-я]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^\w\s]/.test(value)) score += 1

  const labels = ['Слабый', 'Слабый', 'Средний', 'Хороший', 'Надёжный'] as const
  return { score: Math.min(score, 4) as 0 | 1 | 2 | 3 | 4, label: labels[Math.min(score, 4)] }
}

export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null
  const { score, label } = scorePassword(value)
  const colors = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-accent', 'bg-money'] as const

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={cn('h-1 flex-1 rounded-full', index < score ? colors[score] : 'bg-line')} />
        ))}
      </div>
      <p className="mt-1 text-2xs text-ink-muted">Надёжность пароля: {label}</p>
    </div>
  )
}
