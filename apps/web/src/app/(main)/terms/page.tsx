import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Условия', alternates: { canonical: '/terms' } }

export default function TermsPage() {
  return (
    <div className="container-page mt-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-white md:text-2xl">Условия использования</h1>
      <div className="mt-4 space-y-3 text-sm text-ink-muted">
        <p>Сервис принимает игроков старше 18 лет. Играйте ответственно: азартные игры могут вызывать зависимость.</p>
        <p>Все операции идут в валюте выбранного кошелька. Сервис не выполняет автоматическую конвертацию между кошельками.</p>
        <p>Вывод доступен после проверки личности. Бонусные начисления в текущей версии продукта не используются.</p>
      </div>
    </div>
  )
}
