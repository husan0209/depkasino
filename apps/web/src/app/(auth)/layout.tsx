import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'

/** Auth layout (§4.7): центр экрана, логотип, карточка формы, тёмный фон. Без казино-навигации. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-6">
        <Logo withTagline linked={false} />
      </Link>
      <div className="w-full max-w-md rounded-3xl border border-line bg-bg-card p-6 shadow-card">{children}</div>
      <p className="mt-6 text-center text-xs text-ink-dim">
        Игра — развлечение. 18+ · <Link href="/responsible-gaming" className="hover:text-ink-muted">Ответственная игра</Link>
      </p>
    </div>
  )
}
