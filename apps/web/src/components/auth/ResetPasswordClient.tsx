'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import { PasswordStrength, scorePassword } from './PasswordStrength'
import { authApi } from '@/lib/api'

/** Reset по токену, успех ведёт на логин (§5.4). */
export function ResetPasswordClient({ token }: { token?: string }) {
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [state, setState] = useState<'idle' | 'done'>('idle')
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-lg font-semibold text-white">Ссылка недействительна</h1>
        <p className="mt-2 text-sm text-ink-muted">Запросите новое письмо — это займёт минуту.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-accent">
          Запросить письмо
        </Link>
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div className="text-center">
        <h1 className="text-lg font-semibold text-white">Пароль обновлён</h1>
        <p className="mt-2 text-sm text-ink-muted">Теперь можно войти с новым паролем.</p>
        <Link href="/login" className="mt-5 inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white">
          Войти
        </Link>
      </div>
    )
  }

  const weak = scorePassword(password).score < 2
  const mismatch = repeat.length > 0 && password !== repeat

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        setLoading(true)
        try {
          await authApi.resetPassword(token, password)
          setState('done')
        } finally {
          setLoading(false)
        }
      }}
    >
      <h1 className="text-xl font-semibold text-white">Новый пароль</h1>
      <p className="mb-5 mt-1 text-sm text-ink-muted">Придумайте пароль, который не используется на других сайтах.</p>
      <Input
        label="Пароль"
        type="password"
        revealToggle
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={password && weak ? 'Добавьте цифры или заглавные буквы' : undefined}
      />
      <PasswordStrength value={password} />
      <div className="mt-3">
        <Input
          label="Повторите пароль"
          type="password"
          revealToggle
          value={repeat}
          onChange={(event) => setRepeat(event.target.value)}
          error={mismatch ? 'Пароли не совпадают' : undefined}
        />
      </div>
      <Button type="submit" fullWidth size="lg" className="mt-4" loading={loading} disabled={weak || mismatch || !password}>
        Сохранить пароль
      </Button>
    </form>
  )
}
