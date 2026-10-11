'use client'

import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

/**
 * Единое состояние ошибки запроса (§23 блок I): экран не пустует и не крутит
 * вечный скелет — показываем, что не загрузилось, и даём кнопку «Повторить».
 */
export function QueryError({
  title = 'Не загрузилось',
  description = 'Связь потерялась. Это не ошибка ваших действий — попробуйте ещё раз.',
  onRetry,
  className
}: {
  title?: string
  description?: string
  onRetry?(): void
  className?: string
}) {
  return (
    <EmptyState
      className={className}
      icon={<AlertTriangle className="h-5 w-5" />}
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button variant="secondary" onClick={onRetry} leftIcon={<RotateCw className="h-4 w-4" />}>
            Повторить
          </Button>
        ) : undefined
      }
    />
  )
}
