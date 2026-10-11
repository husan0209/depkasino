'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Divider, Input } from '@/components/ui'
import { useGeoStore } from '@/stores/geo'
import { useMounted } from '@/hooks/useMounted'
import { currencySymbol } from '@/lib/format'
import { OAuthButtons } from './OAuthButtons'
import { PasswordStrength, scorePassword } from './PasswordStrength'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/lib/api'

const schema = z.object({
  email: z.string().email('Проверьте email'),
  password: z
    .string()
    .min(8, 'Минимум 8 символов')
    .refine((value) => scorePassword(value).score >= 2, 'Добавьте цифры или заглавные буквы'),
  terms: z.literal(true, { errorMap: () => ({ message: 'Нужно принять условия' }) })
})

type FormValues = z.infer<typeof schema>

/**
 * Регистрация (§5.1): email, пароль, чекбокс условий. Без «подтвердите пароль» —
 * есть показ/скрытие и индикатор силы. Реферальный код из ?ref= подставляется тихо.
 */
export function RegisterForm({
  referralCode,
  redirectTo,
  onSuccess
}: {
  referralCode?: string
  redirectTo?: string
  onSuccess?(): void
}) {
  const router = useRouter()
  const registerUser = useAuthStore((state) => state.register)
  const defaultCurrency = useGeoStore((state) => state.defaultCurrency)
  const mounted = useMounted()
  const [serverError, setServerError] = useState<string | null>(null)

  // Валюту не переспрашиваем (§2.5): берём гео/гостевой выбор и говорим об этом прямо.
  const walletCurrency = mounted ? defaultCurrency() : 'RUB'

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { terms: false as never } })

  const password = watch('password') ?? ''

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await registerUser({
        email: values.email,
        password: values.password,
        terms: values.terms,
        ref: referralCode,
        currency: walletCurrency
      })
      if (redirectTo) router.replace(redirectTo)
      onSuccess?.()
    } catch (error) {
      setServerError((error as ApiError).message ?? 'Не удалось создать аккаунт')
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <OAuthButtons onSuccess={onSuccess} />
      <Divider label="или" className="py-1" />

      <Input label="Email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
      <div>
        <Input
          label="Пароль"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          revealToggle
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordStrength value={password} />
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-muted">
        <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-line bg-bg-secondary accent-accent" {...register('terms')} />
        <span>
          Мне 18+ и я принимаю <span className="text-accent">условия</span> и{' '}
          <span className="text-accent">политику конфиденциальности</span>
        </span>
      </label>
      {errors.terms && <p className="text-xs text-danger">{errors.terms.message}</p>}

      <p className="rounded-xl border border-line bg-bg-secondary/50 p-3 text-xs text-ink-muted">
        Кошелёк создадим в <span className="font-semibold text-white">{currencySymbol(walletCurrency)}</span> — по вашей
        геолокации. Балансы отдельных валют не смешиваются и не конвертируются.
      </p>

      {referralCode && (
        <p className="rounded-xl border border-line bg-bg-secondary/60 p-3 text-xs text-ink-muted">
          Приглашение друга активно — код применится автоматически.
        </p>
      )}

      {serverError && <p className="text-sm text-danger">{serverError}</p>}

      <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
        Создать аккаунт
      </Button>

      {/* После успеха сессия создаётся сразу, письмо уходит фоном и не является тупиком (§5.1) */}
      <p className="text-center text-xs text-ink-dim">
        Играть можно сразу. Подтверждение почты потребуется позже — на выводе.
      </p>
    </form>
  )
}
