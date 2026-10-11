import type { Metadata } from 'next'
import { Protected } from '@/components/shared/Protected'
import { SupportClient } from '@/components/support/SupportClient'

export const metadata: Metadata = {
  title: 'Поддержка',
  robots: { index: false, follow: false }
}

export default function SupportPage() {
  return (
    <Protected>
      <SupportClient />
    </Protected>
  )
}
