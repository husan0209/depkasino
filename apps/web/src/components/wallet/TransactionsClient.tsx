'use client'

import { useState } from 'react'
import { Receipt } from 'lucide-react'
import { Button, EmptyState, Pagination, Select, SkeletonRow } from '@/components/ui'
import { TransactionRow } from './TransactionRow'
import { useTransactions } from '@/hooks/useWalletData'
import { ALL_CURRENCIES, TRANSACTION_TYPE_LABELS } from '@/constants/currencies'

const PAGE_SIZE = 12

/** История транзакций (§11): фильтры тип/валюта/период, карточки на телефоне, таблица на десктопе. */
export function TransactionsClient() {
  const [type, setType] = useState('all')
  const [currency, setCurrency] = useState('all')
  const [period, setPeriod] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useTransactions({ type, currency, period, page, pageSize: PAGE_SIZE })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <div className="container-page mt-6">
      <p className="section-label">История</p>
      <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">Транзакции</h1>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Select
          value={type}
          onChange={(value) => {
            setType(value)
            setPage(1)
          }}
          options={[
            { value: 'all', label: 'Все операции' },
            ...Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({ value, label }))
          ]}
        />
        <Select
          value={currency}
          onChange={(value) => {
            setCurrency(value)
            setPage(1)
          }}
          options={[{ value: 'all', label: 'Все валюты' }, ...ALL_CURRENCIES.map((item) => ({ value: item, label: item }))]}
        />
        <Select
          value={period}
          onChange={(value) => {
            setPeriod(value)
            setPage(1)
          }}
          options={[
            { value: 'all', label: 'За всё время' },
            { value: '7d', label: 'Последние 7 дней' },
            { value: '30d', label: 'Последний месяц' },
            { value: '365d', label: 'Год' }
          ]}
        />
      </div>

      <div className="mt-5 space-y-1.5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />)
        ) : data && data.items.length > 0 ? (
          data.items.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)
        ) : (
          <EmptyState
            icon={<Receipt className="h-5 w-5" />}
            title="Операций не нашлось"
            description="Смените фильтры или пополните кошелёк — операции появятся здесь."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setType('all')
                  setCurrency('all')
                  setPeriod('all')
                  setPage(1)
                }}
              >
                Сбросить фильтры
              </Button>
            }
          />
        )}
      </div>

      {data && data.total > PAGE_SIZE && (
        <div className="mt-5 flex justify-center">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  )
}
