/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        blue: {
          dim: '#1D4ED8',
          DEFAULT: '#2563EB',
          bright: '#3B82F6',
          glow: '#60A5FA',
          faint: '#0f1f35',
          subtle: '#1e3a5f',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'blink': 'blink 2s ease-in-out infinite',
        'spin-slow': 'spin 1.2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [],
}
