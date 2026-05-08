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
        base: {
          DEFAULT: '#0F1117',
          light: '#161B26',
        },
        ink: {
          DEFAULT: '#0F2A1F',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          bright: 'var(--accent-bright)',
        },
        dark: '#0a0a0a',
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
