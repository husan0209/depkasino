/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Каверы и логотипы провайдеров — доверенные локальные SVG, поэтому оптимизатору
    // разрешаем SVG с жёстким CSP и attachment-диспозицией (рекомендация Next для своих ассетов).
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // CDN провайдеров и раздача ассетов. Реальные URL подставляются бэком/каталогом.
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.pragmaticplay.net' },
      { protocol: 'https', hostname: 'cdn.bgaming.com' },
      { protocol: 'https', hostname: 'static.hacksawgaming.com' },
      { protocol: 'https', hostname: 'cdn.nolimitcity.com' },
      { protocol: 'https', hostname: 'cdn.relaxgaming.com' },
      { protocol: 'https', hostname: 'assets.playngo.com' },
      { protocol: 'https', hostname: 'cdn.pushgaming.com' },
      { protocol: 'https', hostname: 'cdn.netent.com' },
      { protocol: 'https', hostname: '3oaks.com' },
      { protocol: 'https', hostname: 'cdn.amusnet.com' },
      { protocol: 'https', hostname: '*.depkasino.dev' },
      { protocol: 'https', hostname: 'images.unsplash.com' }
    ]
  }
}

export default nextConfig
