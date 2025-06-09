/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600
          hover: '#1d4ed8', // blue-700
        },
        secondary: {
          DEFAULT: '#64748b', // slate-500
          text: '#334155', // slate-700
          'text-dark': '#cbd5e1', // slate-300
        },
        background: {
          light: '#f8fafc', // slate-50
          dark: '#0f172a', // slate-900
        },
        feedback: {
          success: '#10b981', // green-500
          warning: '#eab308', // yellow-500
          error: '#dc2626', // red-600
          info: '#0ea5e9', // sky-500
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '12px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} 