import type { Metadata } from 'next'
import { Protected } from '@/components/shared/Protected'
import { ProfileClient } from '@/components/profile/ProfileClient'

export const metadata: Metadata = {
  title: 'Сессии',
  robots: { index: false, follow: false }
}

export default function ProfileSessionsPage() {
  return (
    <Protected>
      <ProfileClient tab="sessions" />
    </Protected>
  )
}
