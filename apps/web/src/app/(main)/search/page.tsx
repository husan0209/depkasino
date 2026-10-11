import type { Metadata } from 'next'
import { SearchClient } from '@/components/casino/SearchClient'

export const metadata: Metadata = {
  title: 'Поиск игр',
  description: 'Поиск слотов и провайдеров по названию.',
  alternates: { canonical: '/search' },
  robots: { index: false, follow: true }
}

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  return <SearchClient initialQuery={searchParams.q ?? ''} />
}
