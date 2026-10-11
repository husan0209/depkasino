import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton h-4 w-full', className)} />
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-xl border border-line/60 bg-bg-card p-3', className)}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  )
}
