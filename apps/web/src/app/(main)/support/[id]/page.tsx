import type { Metadata } from 'next'
import { Protected } from '@/components/shared/Protected'
import { TicketThread } from '@/components/support/TicketThread'

export const metadata: Metadata = {
  title: 'Тикет',
  robots: { index: false, follow: false }
}

export default function TicketPage({ params }: { params: { id: string } }) {
  return (
    <Protected>
      <TicketThread ticketId={params.id} />
    </Protected>
  )
}
