import type { Metadata } from 'next'
import { Protected } from '@/components/shared/Protected'
import { ProfileClient } from '@/components/profile/ProfileClient'

export const metadata: Metadata = {
  title: 'Профиль',
  robots: { index: false, follow: false }
}

export default function ProfilePage() {
  return (
    <Protected>
      <ProfileClient tab="data" />
    </Protected>
  )
}
