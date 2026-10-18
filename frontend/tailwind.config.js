/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nature: {
          50: '#F4F7F4',
          100: '#E5EDE5',
          200: '#CADBCA',
          300: '#A4C1A4',
          400: '#75A176',
          500: '#4D824E',
          600: '#3A683B',
          700: '#2F5230',
          800: '#28422A',
          900: '#1A3C2B',
          950: '#0F2319',
        },
        cream: {
          50: '#FCFBF9',
          100: '#FAF8F5',
          200: '#F3EFE6',
          300: '#E9E3D3',
          400: '#DDD4BF',
        },
        earth: {
          50: '#FAF6F0',
          100: '#F4ECE1',
          200: '#E7D8C4',
          500: '#D4A373',
          600: '#BC8A5F',
          700: '#A47148',
          800: '#8B5A2B',
          900: '#5C3A1E',
        },
        terracotta: {
          500: '#E07A5F',
          600: '#C96248',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(26, 60, 43, 0.08)',
        'card': '0 10px 30px -4px rgba(26, 60, 43, 0.12)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}
