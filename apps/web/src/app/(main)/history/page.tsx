import type { Metadata } from 'next'
import { Protected } from '@/components/shared/Protected'
import { HistoryClient } from '@/components/profile/HistoryClient'

export const metadata: Metadata = {
  title: 'История игр',
  robots: { index: false, follow: false }
}

export default function HistoryPage() {
  return (
    <Protected>
      <HistoryClient />
    </Protected>
  )
}
