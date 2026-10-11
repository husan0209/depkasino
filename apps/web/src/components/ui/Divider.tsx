import { cn } from '@/lib/cn'

export function Divider({ className, label }: { className?: string; label?: string }) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-ink-muted">{label}</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    )
  }
  return <div className={cn('h-px w-full bg-line', className)} />
}
