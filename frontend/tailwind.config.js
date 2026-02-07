/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gmail: {
          red: '#c5221f',
          blue: '#1a73e8',
          gray: '#5f6368',
          lightGray: '#f1f3f4',
          hover: '#f5f5f5',
          selected: '#e8f0fe',
        }
      }
    },
  },
  plugins: [],
}
