/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#e50914',
          hover: '#b80710',
        },
        secondary: '#6d1cb4',
        dark: {
          DEFAULT: '#0e0e10',
          lighter: '#1f1f23',
        },
      },
    },
  },
  plugins: [],
}