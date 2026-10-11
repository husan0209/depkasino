import Image from 'next/image'
import { cn } from '@/lib/cn'

/**
 * Обложки и логотипы провайдеров.
 *
 * Локальные SVG (мок-режим) отдаём обычным <img>: оптимизатор next/image для SVG
 * не даёт выигрыша (вектор уже лёгкий), зато самообращение оптимизатора к своему же
 * серверу периодически заканчивалось висящими запросами и 400. Абсолютные URL
 * (боевой CDN провайдера) по-прежнему идут через next/image с оптимизацией.
 */
export function CoverImage({
  src,
  alt,
  fill = false,
  sizes,
  width,
  height,
  priority = false,
  className
}: {
  src: string
  alt: string
  fill?: boolean
  sizes?: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
}) {
  const remote = src.startsWith('http://') || src.startsWith('https://')

  if (remote) {
    return fill ? (
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />
    ) : (
      <Image src={src} alt={alt} width={width} height={height} priority={priority} className={className} />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- локальные SVG минуют оптимизатор осознанно: см. комментарий к компоненту
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={cn(fill && 'absolute inset-0 h-full w-full', className)}
    />
  )
}
