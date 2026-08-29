import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#006B52',
          50:  '#E9F6F1',
          100: '#CBEBE0',
          200: '#98D6BE',
          300: '#5FBC9B',
          400: '#2CA37D',
          500: '#0A8F6B',
          600: '#006B52',
          700: '#005A45',
          800: '#004A39',
          900: '#003D32',
        },
        accent: {
          DEFAULT: '#F59E0B',
          light:   '#FBBF4A',
          dark:    '#B45309',
        },
        cream: {
          DEFAULT: '#FAFCFB',
          dark:    '#F1F5F3',
        },
        warm: {
          border: '#E4E9E7',
          muted:  '#667085',
        },
        ink: {
          DEFAULT: '#17212B',
          soft: '#98A2B3',
        },
      },
      fontFamily: {
        bangla: ['var(--font-hind)', 'sans-serif'],
        sans:   ['var(--font-inter)', 'var(--font-hind)', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)',
        hover: '0 4px 12px rgba(0,106,78,0.12), 0 8px 32px rgba(0,0,0,0.08)',
      },
      animation: {
        'ticker': 'ticker 30s linear infinite',
        'fade-up': 'fadeUp 0.4s ease-out',
      },
      keyframes: {
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
