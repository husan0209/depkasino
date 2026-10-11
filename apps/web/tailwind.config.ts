import type { Config } from 'tailwindcss'

/**
 * Палитра и роли цветов — Часть 5 §2.4 и Часть 5.1 §2.
 * Зелёный — только деньги и успех. Бренд (accent) — навигация и «Играть».
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0F0F1A',
          secondary: '#1A1A2E',
          card: '#16213E',
          elevated: '#1C1C36'
        },
        line: {
          DEFAULT: '#2A2A4A',
          soft: '#22223C'
        },
        accent: {
          DEFAULT: '#6C63FF',
          hover: '#7C74FF',
          soft: 'rgba(108, 99, 255, 0.14)',
          secondary: '#00D2FF'
        },
        money: {
          DEFAULT: '#00C853',
          hover: '#00B24A',
          soft: 'rgba(0, 200, 83, 0.14)'
        },
        danger: '#FF3D71',
        warning: '#FFB300',
        ink: {
          DEFAULT: '#FFFFFF',
          muted: '#8888AA',
          dim: '#5A5A7A'
        }
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ]
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }]
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem'
      },
      boxShadow: {
        sheet: '0 -12px 40px rgba(0, 0, 0, 0.45)',
        card: '0 6px 24px rgba(0, 0, 0, 0.35)',
        accent: '0 8px 24px rgba(108, 99, 255, 0.35)',
        money: '0 8px 24px rgba(0, 200, 83, 0.28)'
      },
      keyframes: {
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' }
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' }
        },
        'flash-up': {
          '0%': { color: '#00C853', transform: 'translateY(0)' },
          '35%': { transform: 'translateY(-3px)' },
          '100%': { color: '#FFFFFF', transform: 'translateY(0)' }
        },
        'flash-down': {
          '0%': { color: '#FF3D71', transform: 'translateY(0)' },
          '35%': { transform: 'translateY(3px)' },
          '100%': { color: '#FFFFFF', transform: 'translateY(0)' }
        },
        'heart-burst': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.35)' },
          '100%': { transform: 'scale(1)' }
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'card-up': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-60%) scale(1.08)', opacity: '0' }
        }
      },
      animation: {
        'sheet-up': 'sheet-up 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in': 'fade-in 180ms ease-out',
        'scale-in': 'scale-in 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        'flash-up': 'flash-up 900ms ease-out',
        'flash-down': 'flash-down 900ms ease-out',
        'heart-burst': 'heart-burst 420ms ease-out',
        shimmer: 'shimmer 1.6s infinite',
        'rise-in': 'rise-in 260ms ease-out both',
        'card-up': 'card-up 320ms ease-in forwards'
      },
      spacing: {
        'safe-b': 'env(safe-area-inset-bottom, 0px)',
        'safe-t': 'env(safe-area-inset-top, 0px)'
      }
    }
  },
  plugins: []
}

export default config
