'use client'

/**
 * Последний рубеж: сбой в самом корневом layout.
 * Здесь нельзя опираться на globals.css и провайдеры — их может не быть, поэтому стили инлайновые.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, background: '#0F0F1A', color: '#FFFFFF', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255, 61, 113, 0.15)', color: '#FF3D71', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
            !
          </div>
          <h1 style={{ margin: '18px 0 0', fontSize: 22, fontWeight: 600 }}>Сайт не открылся</h1>
          <p style={{ margin: '10px 0 0', maxWidth: 380, fontSize: 14, color: '#9A9AB5', lineHeight: 1.5 }}>
            Мы уже знаем о сбое. Обновите страницу — если не помогло, напишите в поддержку, когда сайт вернётся.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 20, height: 44, padding: '0 22px', borderRadius: 12, border: 0, background: '#6C63FF', color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Обновить
          </button>
          {error.digest && <p style={{ marginTop: 16, fontSize: 12, color: '#6E6E8A' }}>Код обращения: {error.digest}</p>}
        </div>
      </body>
    </html>
  )
}
