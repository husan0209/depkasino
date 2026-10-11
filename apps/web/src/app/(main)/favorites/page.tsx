import type { Metadata } from 'next'
import { Protected } from '@/components/shared/Protected'
import { FavoritesClient } from '@/components/casino/FavoritesClient'

export const metadata: Metadata = {
  title: 'Избранное',
  description: 'Слоты, которые вы отметили.',
  robots: { index: false, follow: false }
}

export default async function FavoritesPage() {
  return (
    <Protected>
      <FavoritesClient />
    </Protected>
  )
}
