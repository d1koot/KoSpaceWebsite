import type { Config } from 'tailwindcss'
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { ink: '#0b0b0f', void: '#07070b' },
    fontFamily: { cond: ['"Barlow Semi Condensed"', '"Roboto Condensed"', '"Arial Narrow"', 'sans-serif'], script: ['Yellowtail', 'cursive'], wide: ['Michroma', 'Eurostile', 'Arial', 'sans-serif'], sans: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'] },
    transitionTimingFunction: { ko: 'cubic-bezier(0.76,0,0.24,1)' } } },
} satisfies Config
