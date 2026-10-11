'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send } from 'lucide-react'
import { Badge, Button, ConfirmModal, EmptyState, Input, Skeleton } from '@/components/ui'
import { supportApi, queryKeys } from '@/lib/api'
import { TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from '@/constants/currencies'
import { formatShortDate } from '@/lib/dates'
import { toast } from '@/stores/toast'
import { cn } from '@/lib/cn'

const statusVariant = { open: 'warning', answered: 'success', closed: 'neutral' } as const

/** Тред тикета: переписка, статусы, закрытие через ConfirmModal (§16.1). */
export function TicketThread({ ticketId }: { ticketId: string }) {
  const queryClient = useQueryClient()
  const [reply, setReply] = useState('')
  const [confirmClose, setConfirmClose] = useState(false)

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: queryKeys.ticket(ticketId),
    queryFn: () => supportApi.ticket(ticketId)
  })

  const send = useMutation({
    mutationFn: () => supportApi.reply(ticketId, reply),
    onSuccess: async () => {
      setReply('')
      await queryClient.invalidateQueries({ queryKey: queryKeys.ticket(ticketId) })
      // Real-time чата нет: достаточно toast + обновления треда при открытии (§15).
      toast.success('Сообщение отправлено', 'Ответ придёт на почту')
    }
  })

  const close = useMutation({
    mutationFn: () => supportApi.close(ticketId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.ticket(ticketId) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.tickets })
      toast.success('Тикет закрыт')
    }
  })

  if (isError) {
    return (
      <div className="container-page mt-6 max-w-2xl">
        <EmptyState
          title="Тикет не найден"
          description="Возможно, ссылка устарела или заявка закрыта и удалена."
          action={
            <Link href="/support" className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white">
              Все тикеты
            </Link>
          }
        />
      </div>
    )
  }

  if (isLoading || !ticket) {
    return (
      <div className="container-page mt-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="container-page mt-6 max-w-2xl">
      <Link href="/support" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Все тикеты
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">{ticket.subject}</h1>
          <p className="mt-1 text-xs text-ink-muted">
            {ticket.id} · {TICKET_CATEGORY_LABELS[ticket.category]} · создан {formatShortDate(ticket.createdAt)}
          </p>
        </div>
        <Badge variant={statusVariant[ticket.status]}>{TICKET_STATUS_LABELS[ticket.status]}</Badge>
      </div>

      <div className="mt-5 space-y-3">
        {ticket.messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'max-w-[85%] rounded-2xl border p-3.5 text-sm',
              message.author === 'user'
                ? 'ml-auto border-accent/30 bg-accent/10 text-white'
                : 'border-line bg-bg-card text-ink-muted'
            )}
          >
            <p className={message.author === 'user' ? 'text-xs text-accent' : 'text-xs text-ink-dim'}>
              {message.author === 'user' ? 'Вы' : 'Поддержка'} · {formatShortDate(message.createdAt)}
            </p>
            <p className="mt-1.5 whitespace-pre-line">{message.text}</p>
          </div>
        ))}
      </div>

      {ticket.status !== 'closed' ? (
        <div className="mt-5 space-y-3">
          <Input
            label="Ответить"
            placeholder="Напишите сообщение"
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            suffix={
              <button
                type="button"
                aria-label="Отправить"
                disabled={reply.trim().length < 2}
                onClick={() => send.mutate()}
                className="p-1 text-accent disabled:text-ink-dim"
              >
                <Send className="h-4 w-4" />
              </button>
            }
          />
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setConfirmClose(true)}>
              Закрыть тикет
            </Button>
            <Button size="sm" loading={send.isPending} disabled={reply.trim().length < 2} onClick={() => send.mutate()}>
              Отправить
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-line bg-bg-secondary/40 p-4 text-sm text-ink-muted">
          Тикет закрыт. Если проблема вернётся — создайте новый, история сохранится.
        </p>
      )}

      <ConfirmModal
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={() => {
          close.mutate()
          setConfirmClose(false)
        }}
        title="Закрыть тикет?"
        description="Переписка сохранится, но написать в этот тред будет нельзя."
        confirmLabel="Закрыть"
        variant="danger"
      />
    </div>
  )
}
