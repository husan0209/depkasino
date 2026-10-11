'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LifeBuoy, MessageSquarePlus } from 'lucide-react'
import { Badge, Button, EmptyState, Input, Select, Sheet, SkeletonRow } from '@/components/ui'
import { supportApi, queryKeys } from '@/lib/api'
import { TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from '@/constants/currencies'
import { formatShortDate } from '@/lib/dates'
import { toast } from '@/stores/toast'
import type { TicketCategory } from '@/types'

const statusVariant = { open: 'warning', answered: 'success', closed: 'neutral' } as const

/** Поддержка (§15): список тикетов, создание, категории. Real-time чата нет. */
export function SupportClient() {
  const queryClient = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<TicketCategory>('payments')
  const [message, setMessage] = useState('')

  const { data: tickets, isLoading } = useQuery({ queryKey: queryKeys.tickets, queryFn: () => supportApi.tickets() })

  const createTicket = useMutation({
    mutationFn: () => supportApi.create({ subject, category, message }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tickets })
      toast.success('Тикет создан', 'Ответ придёт на почту и появится в треде')
      setSheetOpen(false)
      setSubject('')
      setMessage('')
    },
    onError: (error) => toast.error('Тикет не создан', (error as Error).message)
  })

  return (
    <div className="container-page mt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-label">Поддержка</p>
          <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">Поможем</h1>
        </div>
        <Button onClick={() => setSheetOpen(true)} leftIcon={<MessageSquarePlus className="h-4 w-4" />} className="shrink-0">
          Создать тикет
        </Button>
      </div>

      <div className="mt-5 space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => <SkeletonRow key={index} />)
        ) : tickets && tickets.length > 0 ? (
          tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/support/${ticket.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-bg-card p-3.5 transition-colors hover:border-accent/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{ticket.subject}</p>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  {TICKET_CATEGORY_LABELS[ticket.category]} · обновлён {formatShortDate(ticket.updatedAt)}
                </p>
              </div>
              <Badge variant={statusVariant[ticket.status]}>{TICKET_STATUS_LABELS[ticket.status]}</Badge>
            </Link>
          ))
        ) : (
          <EmptyState
            icon={<LifeBuoy className="h-5 w-5" />}
            title="Тикетов нет"
            description="Если что-то не работает — напишите, разберёмся."
            action={<Button onClick={() => setSheetOpen(true)}>Создать тикет</Button>}
          />
        )}
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Новый тикет"
        footer={
          <Button
            variant="primary"
            fullWidth
            size="lg"
            loading={createTicket.isPending}
            disabled={!subject || message.length < 10}
            onClick={() => createTicket.mutate()}
          >
            Отправить
          </Button>
        }
      >
        <div className="space-y-4">
          <Select
            label="Категория"
            value={category}
            onChange={(value) => setCategory(value as TicketCategory)}
            options={Object.entries(TICKET_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Input label="Тема" placeholder="Например: не зачислился депозит" value={subject} onChange={(event) => setSubject(event.target.value)} />
          <div>
            <label htmlFor="ticket-message" className="mb-1.5 block text-sm text-ink-muted">
              Сообщение
            </label>
            <textarea
              id="ticket-message"
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Опишите, что случилось: сумма, метод, время операции"
              className="w-full rounded-xl border border-line bg-bg-secondary p-3 text-sm text-ink outline-none transition-colors focus:border-accent placeholder:text-ink-dim"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-muted">
            <span className="rounded-lg border border-dashed border-line px-2 py-1">Прикрепить файл</span>
            <input
              type="file"
              className="hidden"
              onChange={() => toast.info('Вложения появятся после подключения хранилища', 'В мок-режиме файлы не загружаются')}
            />
          </label>
        </div>
      </Sheet>
    </div>
  )
}
