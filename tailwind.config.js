/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          900: '#03081c',
          800: '#0e082a',
          700: '#141d3d',
        },
        neon: {
          cyan: '#37f5ff',
          purple: '#af7dff',
          pink: '#ff5fb4',
          yellow: '#ffeb96',
          green: '#64ffb4',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
