import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Ответственная игра', alternates: { canonical: '/responsible-gaming' } }

export default function ResponsibleGamingPage() {
  return (
    <div className="container-page mt-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-white md:text-2xl">Ответственная игра</h1>
      <div className="mt-4 space-y-3 text-sm text-ink-muted">
        <p>Игра — развлечение, а не способ заработать. Устанавливайте лимиты заранее и не отыгрывайтесь.</p>
        <p>Признаки проблемы: игра на деньги, которые нельзя терять, попытки вернуть проигрыш, сокрытие игры от близких.</p>
        <p>
          Что можно сделать: пауза в аккаунте, самоисключение, лимиты пополнения. Напишите в{' '}
          <Link href="/support" className="text-accent">
            поддержку
          </Link>{' '}
          — поможем без осуждения.
        </p>
        <p className="text-warning">18+ · Если игра перестала быть развлечением, обратитесь за поддержкой к специалистам.</p>
      </div>
    </div>
  )
}
