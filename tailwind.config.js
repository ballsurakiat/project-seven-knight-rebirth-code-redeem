import type { Config } from 'tailwindcss'
import daisyui from 'daisyui'

export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Kanit', 'sans-serif'],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        "sevenknight": {
          "primary": "#ef4444",
          "secondary": "#f87171",
          "accent": "#dc2626",
          "neutral": "#1f2937",
          "base-100": "#161b24",
          "base-200": "#0f172a",
          "base-300": "#020617",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
      "dark",
      "light",
    ],
  }
} satisfies Config
