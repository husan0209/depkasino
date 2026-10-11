import type { Metadata } from 'next'
import { Protected } from '@/components/shared/Protected'
import { KycClient } from '@/components/kyc/KycClient'

export const metadata: Metadata = {
  title: 'Верификация',
  robots: { index: false, follow: false }
}

export default function KycPage() {
  return (
    <Protected>
      <KycClient />
    </Protected>
  )
}
