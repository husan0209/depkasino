import type { Metadata } from 'next'
import Link from 'next/link'
import { ProviderTile } from '@/components/casino/ProviderTile'
import { getProviders } from '@/lib/data/catalog'
import { Badge } from '@/components/ui'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Провайдеры',
  description: 'Студии, чьи слоты есть в каталоге: Pragmatic Play, BGaming, Hacksaw Gaming, Nolimit City и другие.',
  alternates: { canonical: '/providers' }
}

export default async function ProvidersPage() {
  const providers = await getProviders()

  return (
    <div className="container-page mt-6">
      <p className="section-label">Проверенные студии</p>
      <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">Провайдеры</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Игры приходят из студий, которые принимают ваши кошельки. Если валюта не поддерживается — игра честно об этом скажет.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <div key={provider.slug} className="card-surface flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <Link href={`/providers/${provider.slug}`} className="text-base font-semibold text-white hover:text-accent">
                {provider.name}
              </Link>
              <p className="mt-1 text-xs text-ink-muted">{provider.gamesCount} игр в каталоге</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {provider.currencies.slice(0, 4).map((currency) => (
                  <Badge key={currency} variant="neutral">
                    {currency}
                  </Badge>
                ))}
              </div>
            </div>
            <ProviderTile provider={provider} className="h-16 w-28 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
