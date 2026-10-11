import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { DesktopRail } from '@/components/layout/DesktopRail'
import { Footer } from '@/components/layout/Footer'
import { RootSheets } from '@/components/layout/RootSheets'

/** Каркас основного приложения: sticky-шапка, bottom nav на телефоне, икон-панель на десктопе. */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <DesktopRail />
      <div className="md:pl-[72px]">
        <Header />
        <main className="pb-nav md:pb-0">{children}</main>
        <Footer />
      </div>
      <BottomNav />
      <RootSheets />
    </div>
  )
}
