/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#F7F5F2',
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
