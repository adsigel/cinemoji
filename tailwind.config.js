/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'movie-purple': '#6366f1',
        'movie-pink': '#ec4899',
        'movie-yellow': '#f59e0b',
        'movie-green': '#10b981',
      },
      fontFamily: {
        'game': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 