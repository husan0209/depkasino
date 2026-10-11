import type { Metadata } from 'next'
import { Protected } from '@/components/shared/Protected'
import { ReferralClient } from '@/components/referral/ReferralClient'

export const metadata: Metadata = {
  title: 'Приглашай друзей',
  robots: { index: false, follow: false }
}

export default function ReferralPage() {
  return (
    <Protected>
      <ReferralClient />
    </Protected>
  )
}
