/**
 * Генератор обложек и логотипов провайдеров для мок-режима.
 *
 * В проде обложки приходят с CDN провайдера (next.config.mjs → remotePatterns),
 * а этот скрипт нужен, чтобы витрина выглядела как игровое лобби без живого каталога Части 4.
 * Правила: на обложке нет названия игры (имя один раз, под обложкой), нет эмодзи-плейсхолдеров.
 *
 * Запуск: node scripts/generate-art.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const publicDir = join(here, '..', 'public')

const GAMES = [
  ['sweet-bonanza', 'sweet'], ['gates-of-olympus', 'sky'], ['big-bass-bonanza', 'ocean'],
  ['the-dog-house-megaways', 'jungle'], ['sugar-rush', 'sweet'], ['starlight-princess', 'sky'],
  ['fruit-party', 'fruit'], ['wild-west-gold', 'jungle'], ['book-of-fallen', 'egypt'],
  ['book-of-dead', 'egypt'], ['reactoonz', 'gems'], ['legacy-of-dead', 'egypt'],
  ['bonanza-billion', 'coins'], ['elvis-frog-in-vegas', 'coins'], ['fire-portals', 'flame'],
  ['book-of-cats', 'egypt'], ['wanted-dead-or-a-wild', 'noir'], ['le-bandit', 'noir'],
  ['chaos-crew', 'noir'], ['crystal-caverns', 'gems'], ['san-quentin-xways', 'noir'],
  ['mental', 'noir'], ['dieseldas', 'noir'], ['money-train-3', 'coins'],
  ['temple-tumble', 'jungle'], ['big-atlantis-frenzy', 'ocean'], ['razor-shark', 'ocean'],
  ['jammin-jars', 'fruit'], ['burning-wins', 'flame'], ['buffalo-power-megaways', 'jungle'],
  ['sun-of-egypt-3', 'egypt'], ['green-chilli', 'jungle'], ['sun-of-egypt-2', 'egypt'],
  ['40-super-hot', 'fruit'], ['fruit-super-nova', 'fruit'], ['starburst', 'gems'],
  ['gonzo-quest', 'egypt'], ['wild-tiger', 'jungle'], ['curse-of-the-pyramid', 'egypt']
]

const PALETTES = {
  sweet: { a: '#FF4E9B', b: '#7B2FF7', c: '#FFD166', d: '#2A0B3B' },
  sky: { a: '#00D2FF', b: '#6C63FF', c: '#FFE29A', d: '#0B1030' },
  ocean: { a: '#00C6AE', b: '#0B5FA5', c: '#8BE9FD', d: '#04182B' },
  jungle: { a: '#7ED957', b: '#1F7A3D', c: '#FFC93C', d: '#08210F' },
  fruit: { a: '#FF7A00', b: '#D62828', c: '#FFE066', d: '#2B0A0A' },
  egypt: { a: '#FFB300', b: '#B8860B', c: '#7FE3FF', d: '#1B1004' },
  gems: { a: '#8C6BFF', b: '#00D2FF', c: '#FF9FF3', d: '#0C0A22' },
  coins: { a: '#FFC93C', b: '#FF8A00', c: '#FFF3B0', d: '#241100' },
  flame: { a: '#FF6B00', b: '#FF2D55', c: '#FFD166', d: '#210304' },
  noir: { a: '#FF3D71', b: '#6C63FF', c: '#E7E7FF', d: '#0A0A16' }
}

/** Мотивы рисуются крупной геометрией: без текста, без эмодзи. */
function motif(kind, p) {
  const shapes = []
  const push = (s) => shapes.push(s)

  const gem = (x, y, r, fill, rotate = 0) =>
    push(
      `<g transform="translate(${x} ${y}) rotate(${rotate})">
        <path d="M0 ${-r} L${r * 0.85} ${-r * 0.25} L0 ${r} L${-r * 0.85} ${-r * 0.25} Z" fill="${fill}" opacity="0.95"/>
        <path d="M0 ${-r} L${r * 0.85} ${-r * 0.25} L0 ${-r * 0.2} Z" fill="#ffffff" opacity="0.45"/>
        <path d="M${-r * 0.85} ${-r * 0.25} L0 ${-r * 0.2} L0 ${r} Z" fill="#000000" opacity="0.18"/>
      </g>`
    )
  const coin = (x, y, r) =>
    push(
      `<g transform="translate(${x} ${y})">
        <circle r="${r}" fill="url(#coinGrad)"/>
        <circle r="${r * 0.7}" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="${r * 0.12}"/>
        <path d="M0 ${-r * 0.42} L${r * 0.36} 0 L0 ${r * 0.42} L${-r * 0.36} 0 Z" fill="#8A5A00" opacity="0.75"/>
      </g>`
    )
  const star = (x, y, r, fill) =>
    push(
      `<path transform="translate(${x} ${y})" d="${starPath(r)}" fill="${fill}" opacity="0.95"/>`
    )
  const ring = (x, y, r, fill) =>
    push(`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${fill}" stroke-width="${r * 0.22}" opacity="0.8"/>`)
  const blob = (x, y, r, fill) => push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="0.85"/>`)
  const wave = (y, fill) =>
    push(
      `<path d="M0 ${y} C 120 ${y - 32}, 240 ${y + 32}, 360 ${y} C 480 ${y - 32}, 560 ${y + 16}, 600 ${y} L600 600 L0 600 Z" fill="${fill}" opacity="0.55"/>`
    )
  const stripes = (fill) => {
    for (let i = 0; i < 5; i += 1) {
      push(`<path d="M${60 + i * 120} -20 C ${100 + i * 120} 180, ${20 + i * 120} 360, ${70 + i * 120} 620" stroke="${fill}" stroke-width="22" fill="none" opacity="0.5"/>`)
    }
  }
  const pyramid = () =>
    push(`<path d="M300 120 L520 470 L80 470 Z" fill="url(#pyramidGrad)"/>
          <path d="M300 120 L300 470 L80 470 Z" fill="#000" opacity="0.18"/>
          <ellipse cx="300" cy="360" rx="46" ry="22" fill="#fff" opacity="0.55"/>
          <circle cx="300" cy="360" r="14" fill="#0F0F1A" opacity="0.7"/>`)

  switch (kind) {
    case 'sweet':
      blob(150, 210, 66, p.c); blob(430, 180, 54, p.b); blob(320, 400, 84, p.a)
      ring(300, 300, 210, p.a); ring(300, 300, 250, p.b)
      gem(300, 300, 62, p.a, 12); gem(150, 210, 30, '#fff', -10); gem(430, 180, 24, '#fff', 20)
      star(190, 430, 26, p.c); star(450, 420, 34, p.c)
      break
    case 'sky':
      ring(300, 300, 190, p.a); ring(300, 300, 236, p.b)
      push(`<path d="M120 420 L300 130 L480 420 Z" fill="none" stroke="${p.c}" stroke-width="14" opacity="0.85"/>`)
      push(`<path d="M300 130 L340 400 L260 400 Z" fill="${p.c}" opacity="0.35"/>`)
      star(150, 170, 34, p.c); star(470, 210, 24, '#fff'); star(430, 450, 30, p.a)
      gem(300, 300, 46, p.a, 0)
      break
    case 'ocean':
      wave(300, p.a); wave(400, p.b); wave(500, p.d)
      ring(430, 190, 84, p.c); blob(150, 160, 40, p.c)
      gem(210, 380, 52, p.c, -14); gem(400, 360, 34, '#fff', 10)
      star(120, 250, 22, p.c)
      break
    case 'jungle':
      gem(300, 300, 70, p.c, 8)
      push(`<path d="M70 460 C 180 300, 420 300, 530 460" stroke="${p.a}" stroke-width="26" fill="none" opacity="0.8"/>`)
      push(`<path d="M70 500 C 180 360, 420 360, 530 500" stroke="${p.b}" stroke-width="20" fill="none" opacity="0.7"/>`)
      star(160, 170, 30, p.c); star(450, 190, 22, p.a)
      break
    case 'fruit':
      blob(190, 380, 84, p.b); blob(390, 400, 70, p.a)
      blob(300, 220, 96, p.c); blob(300, 220, 60, p.a)
      ring(300, 300, 205, p.a)
      star(140, 180, 26, p.c); star(470, 210, 32, p.a)
      break
    case 'egypt':
      pyramid()
      star(120, 140, 26, p.c); star(300, 90, 32, p.c); star(480, 150, 22, p.c)
      gem(160, 460, 34, p.a, -12); gem(450, 450, 28, p.a, 14)
      break
    case 'gems':
      gem(300, 260, 96, p.a, 0); gem(180, 380, 54, p.b, -18); gem(420, 390, 44, p.c, 24)
      ring(300, 320, 210, p.c); star(140, 170, 26, p.c); star(460, 190, 30, p.b)
      break
    case 'coins':
      coin(210, 340, 96); coin(390, 300, 74); coin(300, 190, 58)
      star(150, 190, 26, p.c); star(460, 180, 30, p.c)
      break
    case 'flame':
      push(`<path d="M300 90 C 380 220, 430 260, 430 350 C 430 430, 370 500, 300 500 C 230 500, 170 430, 170 350 C 170 260, 220 220, 300 90 Z" fill="url(#flameGrad)"/>`)
      push(`<path d="M300 220 C 340 300, 360 320, 360 370 C 360 420, 330 450, 300 450 C 270 450, 240 420, 240 370 C 240 320, 260 300, 300 220 Z" fill="${p.c}" opacity="0.85"/>`)
      star(140, 180, 24, p.c); star(470, 210, 28, p.a)
      break
    case 'noir':
    default:
      stripes(p.b)
      gem(300, 290, 84, p.a, 6)
      push(`<rect x="90" y="90" width="420" height="420" rx="34" fill="none" stroke="${p.c}" stroke-opacity="0.25" stroke-width="3"/>`)
      star(160, 440, 24, p.a); star(450, 160, 28, p.c)
      break
  }
  return shapes.join('')
}

function starPath(r) {
  const points = []
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.45
    const angle = (Math.PI / 5) * i - Math.PI / 2
    points.push(`${(Math.cos(angle) * radius).toFixed(1)} ${(Math.sin(angle) * radius).toFixed(1)}`)
  }
  return `M${points.join(' L')} Z`
}

function coverSvg(slug, kind) {
  const p = PALETTES[kind] ?? PALETTES.noir
  // XML-пролог обязателен: оптимизатор next/image определяет SVG по первым байтам `<?xml`.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" role="img" aria-label="${slug}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="72%">
      <stop offset="0%" stop-color="${p.b}" stop-opacity="0.95"/>
      <stop offset="52%" stop-color="${p.d}"/>
      <stop offset="100%" stop-color="#08080F"/>
    </radialGradient>
    <linearGradient id="coinGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.c}"/>
      <stop offset="100%" stop-color="${p.b}"/>
    </linearGradient>
    <linearGradient id="pyramidGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.c}"/>
      <stop offset="100%" stop-color="${p.b}"/>
    </linearGradient>
    <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="${p.b}"/>
      <stop offset="100%" stop-color="${p.a}"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="18" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <g opacity="0.22">${Array.from({ length: 9 })
    .map((_, i) => `<path d="M300 300 L${300 + Math.cos((i / 9) * Math.PI * 2) * 460} ${300 + Math.sin((i / 9) * Math.PI * 2) * 460}" stroke="${p.a}" stroke-width="26" stroke-linecap="round"/>`)
    .join('')}</g>
  <g filter="url(#glow)">${motif(kind, p)}</g>
  <rect x="10" y="10" width="580" height="580" rx="26" fill="none" stroke="#ffffff" stroke-opacity="0.07"/>
  <rect width="600" height="600" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="16"/>
</svg>
`
}

function providerSvg(name, color, short) {
  const light = '#ffffff'
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120" width="240" height="120" role="img" aria-label="${name}">
  <defs>
    <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="#141428"/>
    </linearGradient>
  </defs>
  <rect width="240" height="120" rx="18" fill="url(#pg)"/>
  <rect x="1" y="1" width="238" height="118" rx="17" fill="none" stroke="${light}" stroke-opacity="0.16"/>
  <text x="20" y="50" fill="${light}" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="30" font-weight="700">${short}</text>
  <text x="20" y="86" fill="${light}" fill-opacity="0.72" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="17">${name}</text>
</svg>
`
}

const PROVIDERS = [
  ['pragmatic-play', 'Pragmatic Play', '#D0021B', 'PP'],
  ['playn-go', "Play'n GO", '#00A3E0', 'PG'],
  ['bgaming', 'BGaming', '#7B61FF', 'BG'],
  ['hacksaw-gaming', 'Hacksaw', '#FF7A00', 'HS'],
  ['nolimit-city', 'Nolimit City', '#4B5563', 'NC'],
  ['relax-gaming', 'Relax Gaming', '#22C55E', 'RG'],
  ['push-gaming', 'Push Gaming', '#F59E0B', 'PU'],
  ['playson', 'Playson', '#EF4444', 'PL'],
  ['three-oaks', '3 Oaks', '#0EA5E9', '3O'],
  ['amusnet', 'Amusnet', '#A855F7', 'AM'],
  ['netent', 'NetEnt', '#2563EB', 'NE'],
  ['booming-games', 'Booming', '#14B8A6', 'BM']
]

mkdirSync(join(publicDir, 'covers'), { recursive: true })
mkdirSync(join(publicDir, 'providers'), { recursive: true })

GAMES.forEach(([slug, kind]) => {
  writeFileSync(join(publicDir, 'covers', `${slug}.svg`), coverSvg(slug, kind))
})

PROVIDERS.forEach(([slug, name, color, short]) => {
  writeFileSync(join(publicDir, 'providers', `${slug}.svg`), providerSvg(name, color, short))
})

console.log(`Обложки: ${GAMES.length}, логотипы провайдеров: ${PROVIDERS.length}`)
