/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#14b8a6',
          light: '#5eead4',
          dark: '#0d9488',
        },
        page: {
          bg: '#f6f1e3',
        },
        button: {
          primary: '#344c36',
          'primary-hover': '#2a3d2c',
        },
      },
    },
  },
  plugins: [],
}

