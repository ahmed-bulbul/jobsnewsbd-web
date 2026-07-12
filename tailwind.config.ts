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
          DEFAULT: '#006A4E',
          50:  '#E6F4F0',
          100: '#C2E3DA',
          200: '#8FCAB5',
          300: '#5CB09B',
          400: '#2E9880',
          500: '#006A4E',
          600: '#005640',
          700: '#004330',
          800: '#003023',
          900: '#001D14',
        },
        accent: {
          DEFAULT: '#F4A825',
          light:   '#F7BC57',
          dark:    '#D4891A',
        },
        cream: {
          DEFAULT: '#FAF7F2',
          dark:    '#F0EBE3',
        },
        warm: {
          border: '#E8E0D5',
          muted:  '#9B8F83',
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
  plugins: [],
};

export default config;
