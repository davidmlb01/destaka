import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        floresta: {
          DEFAULT: '#14532D',
          medio: '#166534',
        },
        verde: {
          vivo: '#16A34A',
          claro: '#DCFCE7',
          minimo: '#F0FDF4',
        },
        ambar: {
          DEFAULT: '#D97706',
          claro: '#F59E0B',
          bg: '#FFFBEB',
        },
        dark: '#1C1917',
        stone: {
          destaka: '#57534E',
          claro: '#E7E5E4',
        },
        creme: {
          DEFAULT: '#FAFAF9',
          quente: '#FEFCE8',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
