import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans Thai Looped', 'sans-serif'],
      },
      colors: {
        dark: {
          bg: '#0a0a0a',
          panel: '#121212',
          border: '#1f1f1f',
          hover: '#1a1a1a',
        },
      },
    },
  },
  plugins: [],
}
export default config
