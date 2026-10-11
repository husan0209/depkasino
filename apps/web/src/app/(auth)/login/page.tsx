import type { Metadata } from 'next'
import { AuthRedirect } from '@/components/auth/AuthRedirect'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Вход', robots: { index: false, follow: false } }

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <AuthRedirect>
      <h1 className="text-xl font-semibold text-white">Вход</h1>
      <p className="mb-5 mt-1 text-sm text-ink-muted">Продолжим с того места, где остановились.</p>
      <LoginForm redirectTo={searchParams.next} />
    </AuthRedirect>
  )
}
