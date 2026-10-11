import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GameGrid } from '@/components/casino/GameGrid'
import { allProviderSlugs, getProvider } from '@/lib/data/catalog'

export const revalidate = 300

export function generateStaticParams() {
  return allProviderSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getProvider(params.slug)
  if (!data) return { title: 'Провайдер не найден' }
  return {
    title: `${data.provider.name} — игры`,
    description: `Слоты ${data.provider.name}: ${data.games.length} игр в каталоге. Играйте в своей валюте без конвертации.`,
    alternates: { canonical: `/providers/${data.provider.slug}` }
  }
}

export default async function ProviderPage({ params }: { params: { slug: string } }) {
  const data = await getProvider(params.slug)
  if (!data) notFound()

  return (
    <div className="container-page mt-6">
      <p className="section-label">Провайдер</p>
      <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">{data.provider.name}</h1>
      <p className="mt-2 text-sm text-ink-muted">
        {data.games.length} игр в каталоге · валюты: {data.provider.currencies.join(' · ')}
      </p>

      <GameGrid games={data.games} className="mt-6" />
    </div>
  )
}
