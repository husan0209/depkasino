'use client'

import { Modal } from './Modal'
import { Button } from './Button'

/** ConfirmModal обязателен на вывод, закрытие тикета и завершение сессий (§16.1). */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  variant = 'primary',
  loading = false
}: {
  open: boolean
  onClose(): void
  onConfirm(): void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'money' | 'danger'
  loading?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description ? <div className="text-sm text-ink-muted">{description}</div> : null}
    </Modal>
  )
}
