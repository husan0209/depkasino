import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-5xl font-bold text-white">404</p>
      <p className="text-sm text-ink-muted">Такой страницы нет. Зато есть слоты.</p>
      <Link
        href="/casino"
        className="mt-2 inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover"
      >
        В каталог
      </Link>
    </div>
  )
}
