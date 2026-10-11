/**
 * Подсказка сессии для первого кадра (§4.2–4.3 Части 5.1).
 *
 * SSR всегда отдаёт витрину гостя: её видят поисковики и новый игрок без задержки.
 * «Своему» маркетинговый герой не показывается даже на мгновение — до гидратации
 * роль видна по наличию токена в localStorage, поэтому inline-скрипт ставит
 * атрибут `data-session` на <html>, а CSS прячет неподходящие блоки.
 * Подсказка влияет только на видимость: данные и логика живут в сторах.
 */

export const SESSION_HINT_ATTR = 'data-session'

const TOKEN_KEY = 'dk_access_token'

/** Выполняется до первой отрисовки (next/script · beforeInteractive). */
export const SESSION_HINT_SCRIPT = `(function(){try{var t=window.localStorage.getItem('${TOKEN_KEY}');document.documentElement.setAttribute('${SESSION_HINT_ATTR}',t?'player':'guest')}catch(e){document.documentElement.setAttribute('${SESSION_HINT_ATTR}','guest')}})();`

/** Держим подсказку в синхроне при входе/выходе/протухшем токене. */
export function syncSessionHint(isPlayer: boolean): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute(SESSION_HINT_ATTR, isPlayer ? 'player' : 'guest')
}
