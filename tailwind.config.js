/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        card: '#111118',
        border: '#1e1e2e',
        up: '#22c55e',
        down: '#ef4444',
        neutral: '#94a3b8',
        accent: '#6366f1',
        muted: '#1a1a2e',
        'muted-foreground': '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
