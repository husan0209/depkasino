'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import { authApi } from '@/lib/api'

/** Forgot всегда отвечает одинаково — не раскрываем существование аккаунта (§5.4). */
export function ForgotPasswordClient() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="text-lg font-semibold text-white">Письмо отправлено</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Если аккаунт с адресом <span className="text-white">{email}</span> существует, письмо уже в пути. Проверьте папку «Спам».
        </p>
        <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-accent">
          Вернуться ко входу
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        setLoading(true)
        try {
          await authApi.forgotPassword(email)
          setSent(true)
        } finally {
          setLoading(false)
        }
      }}
    >
      <h1 className="text-xl font-semibold text-white">Забыли пароль?</h1>
      <p className="mb-5 mt-1 text-sm text-ink-muted">Отправим ссылку для сброса. Ответ одинаковый для любого адреса.</p>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
      />
      <Button type="submit" fullWidth size="lg" className="mt-4" loading={loading} disabled={!email.includes('@')}>
        Отправить ссылку
      </Button>
      <p className="mt-4 text-center text-sm text-ink-muted">
        Вспомнили?{' '}
        <Link href="/login" className="font-semibold text-accent">
          Войти
        </Link>
      </p>
    </form>
  )
}
