/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        'user-light': '#3b82f6',
        'user-dark': '#60a5fa',
        'assistant-light': '#10b981',
        'assistant-dark': '#34d399',
        'tool-light': '#f59e0b',
        'tool-dark': '#fbbf24',
        'tool-result-light': '#8b5cf6',
        'tool-result-dark': '#a78bfa',
        'summary-light': '#ef4444',
        'summary-dark': '#f87171',
      }
    },
  },
  plugins: [],
}

