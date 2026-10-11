'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button, Input, Spinner } from '@/components/ui'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

/** Подтверждение email автозапросом по токену (§5.3). */
export function VerifyEmailClient({ token }: { token?: string }) {
  const user = useAuthStore((store) => store.user)
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('Ссылка недействительна или устарела')
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [resentTo, setResentTo] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)

  // Письмо шлём на почту аккаунта; гостю, открывшему битую ссылку, — на введённый адрес.
  const target = (user?.email ?? email).trim()

  async function resend() {
    setResendError(null)
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target)) {
      setResendError('Укажите email, на который регистрировались')
      return
    }
    setPending(true)
    try {
      const result = await authApi.resendVerification(target)
      setResentTo(result.email || target)
    } catch (resendFailure) {
      setResendError((resendFailure as Error).message)
    } finally {
      setPending(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setState('error')
      return
    }
    authApi
      .verifyEmail(token)
      .then(() => setState('success'))
      .catch((apiError: Error) => {
        setError(apiError.message)
        setState('error')
      })
  }, [token])

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <Spinner size="lg" className="text-accent" />
        <p className="mt-4 text-sm text-ink-muted">Проверяем ссылку…</p>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center py-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-money/15 text-money">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-white">Email подтверждён</h1>
        <p className="mt-1 text-sm text-ink-muted">Лимиты пополнения сняты, вывод доступен.</p>
        <Link href="/" className="mt-5 inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white">
          На главную
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/15 text-danger">
        <XCircle className="h-7 w-7" />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-white">Ссылка не сработала</h1>
      <p className="mt-1 text-sm text-ink-muted">{error}</p>
      {resentTo ? (
        <p className="mt-5 rounded-xl border border-money/30 bg-money/10 px-4 py-3 text-xs text-money">
          Новое письмо ушло на {resentTo}. Проверьте «Спам», если не видно во входящих.
        </p>
      ) : (
        <div className="mt-5 w-full max-w-xs space-y-3">
          {!user?.email && (
            <Input
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="player@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={resendError ?? undefined}
            />
          )}
          {user?.email && resendError && <p className="text-xs text-danger">{resendError}</p>}
          <Button fullWidth loading={pending} onClick={() => void resend()}>
            Отправить письмо ещё раз
          </Button>
        </div>
      )}
      <Link href="/" className="mt-3 text-xs text-ink-muted hover:text-white">
        Играть можно и без подтверждения — вернуться на главную
      </Link>
    </div>
  )
}
