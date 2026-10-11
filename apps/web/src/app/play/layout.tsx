import { RootSheets } from '@/components/layout/RootSheets'

/** Игровой экран живёт вне основной навигации: никакой панели, только планка и игра. */
export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg-primary">
      {children}
      <RootSheets />
    </div>
  )
}
