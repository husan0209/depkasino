'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import type { Provider } from '@/types'

/** Логотип провайдера — цветная карточка, не серая буквенная иконка (§Don't-лист). */
export function ProviderTile({ provider, className }: { provider: Provider; className?: string }) {
  return (
    <Link
      href={`/providers/${provider.slug}`}
      className={cn(
        'group flex h-20 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-bg-card transition-colors hover:border-accent/50',
        className
      )}
      aria-label={`Игры ${provider.name}`}
    >
      <Image
        src={`/providers/${provider.slug}.svg`}
        alt={provider.name}
        width={240}
        height={120}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
    </Link>
  )
}

/** Тонкая лента провайдеров — не полноценная полка-сетка игр (§6.3). */
export function ProviderStrip({ providers }: { providers: Provider[] }) {
  return (
    <div className="scroll-row">
      {providers.map((provider) => (
        <ProviderTile key={provider.slug} provider={provider} />
      ))}
    </div>
  )
}
