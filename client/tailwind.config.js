/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        shine: {
          '0%': { transform: 'translateX(-100%) skewX(-25deg)' },
          '100%': { transform: 'translateX(200%) skewX(-25deg)' },
        },
        spinReverse: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
      },
      animation: {
        'shine': 'shine 1s ease-in-out infinite',
        'spin-reverse': 'spinReverse 2s linear infinite',
      },
    },
  },
  plugins: [],
}
