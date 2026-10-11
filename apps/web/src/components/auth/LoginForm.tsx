'use client'

import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Button, Divider, Input } from '@/components/ui'
import { OAuthButtons } from './OAuthButtons'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/lib/api'
import { cn } from '@/lib/cn'

const schema = z.object({
  email: z.string().email('Проверьте email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  remember: z.boolean().optional()
})

type FormValues = z.infer<typeof schema>

export function LoginForm({
  onSuccess,
  redirectTo,
  showOAuth = true,
  className
}: {
  onSuccess?(): void
  redirectTo?: string
  showOAuth?: boolean
  className?: string
}) {
  const login = useAuthStore((state) => state.login)
  const [serverError, setServerError] = useState<string | null>(null)
  const [needsCaptcha, setNeedsCaptcha] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { remember: true }
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await login(values)
      onSuccess?.()
      if (redirectTo) window.location.assign(redirectTo)
    } catch (error) {
      const apiError = error as ApiError
      const next = attempts + 1
      setAttempts(next)
      // После 5 неудач — captcha (§5.2).
      if (next >= 5) setNeedsCaptcha(true)
      setServerError(apiError.message ?? 'Не удалось войти')
    }
  })

  return (
    <form onSubmit={onSubmit} className={cn('space-y-4', className)}>
      {showOAuth && (
        <>
          <OAuthButtons onSuccess={onSuccess} />
          <Divider label="или" className="py-1" />
        </>
      )}

      <Input
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Пароль"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        revealToggle
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" className="h-4 w-4 rounded border-line bg-bg-secondary accent-accent" {...register('remember')} />
          Запомнить меня
        </label>
        <Link href="/forgot-password" className="text-sm text-accent hover:text-accent-hover">
          Забыли пароль?
        </Link>
      </div>

      {needsCaptcha && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
          Проверка «я не робот» появится здесь после нескольких неудачных попыток.
        </div>
      )}

      {serverError && <p className="text-sm text-danger">{serverError}</p>}

      <Button type="submit" fullWidth loading={isSubmitting} size="lg">
        Войти
      </Button>
    </form>
  )
}
