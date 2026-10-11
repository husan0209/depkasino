import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Конфиденциальность', alternates: { canonical: '/privacy' } }

export default function PrivacyPage() {
  return (
    <div className="container-page mt-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-white md:text-2xl">Политика конфиденциальности</h1>
      <div className="mt-4 space-y-3 text-sm text-ink-muted">
        <p>Мы храним минимум данных: email, страну, историю операций и документы верификации — только для проверки личности и требований платёжных партнёров.</p>
        <p>Данные не продаются третьим лицам. Платёжные данные обрабатываются поставщиками платежей.</p>
        <p>Запросить удаление аккаунта можно через поддержку.</p>
      </div>
    </div>
  )
}
