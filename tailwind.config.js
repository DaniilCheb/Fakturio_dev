/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#fcfcfa',
        'surface/inverted': '#141414',
        'border/default': 'rgba(21,21,20,0.14)',
        'content/default': '#141414',
        'content/weak': 'rgba(21,21,20,0.8)',
        'surface/gray': '#f5f5f3',
      },
      fontFamily: {
        'sans': ['Radio Canada Big', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
