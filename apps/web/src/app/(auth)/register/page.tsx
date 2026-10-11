import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthRedirect } from '@/components/auth/AuthRedirect'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = { title: 'Регистрация', robots: { index: false, follow: false } }

export default function RegisterPage({ searchParams }: { searchParams: { ref?: string } }) {
  return (
    <AuthRedirect>
      <h1 className="text-xl font-semibold text-white">Создать аккаунт</h1>
      <p className="mb-5 mt-1 text-sm text-ink-muted">20 секунд — и можно крутить. Подтверждение почты попросим позже, на выводе.</p>
      <RegisterForm referralCode={searchParams.ref} redirectTo="/" />
      <p className="mt-4 text-center text-sm text-ink-muted">
        Уже с нами?{' '}
        <Link href="/login" className="font-semibold text-accent hover:text-accent-hover">
          Войти
        </Link>
      </p>
    </AuthRedirect>
  )
}
