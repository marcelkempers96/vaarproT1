/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Marine theme colors (keeping some for nautical feel)
        'marine-blue': '#1e3a8a',
        'ocean-deep': '#0f172a',
        'wave-light': '#e0f2fe',
        'sand-warm': '#fef3c7',
        'coral': '#f87171',
        'seafoam': '#5eead4',
        
        // Modern UI system (from the reference)
        base: {
          50:  "#F8F9FA",
          100: "#F5F4F7", 
          200: "#DDE0E3",
          300: "#C5C6CA",
          400: "#A7A7AB",
          500: "#79797A",
          600: "#696C71",
          700: "#5F6565",
          800: "#201E23"
        },
        brand: { 
          DEFAULT: "#A2E5F8", 
          50: "#E6F8FE", 
          100: "#D8F3FD", 
          500: "#A2E5F8" 
        },
        accent: { 
          DEFAULT: "#D7346A", 
          600: "#D7435C" 
        },
        success: { 
          DEFAULT: "#34C759" 
        },
        warn: { 
          DEFAULT: "#FFB020" 
        },
      },
      fontFamily: {
        'Inter': ['Inter', 'system-ui', 'sans-serif'],
        'Poppins': ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
      },
      boxShadow: {
        'soft': '0 6px 24px rgba(0,0,0,0.06)',
        'card': '0 12px 32px rgba(0,0,0,0.07)',
        'focus': '0 0 0 3px rgba(162,229,248,0.6)'
      },
      spacing: { 
        13: '3.25rem' // keeps 8px/16px rhythm flexible
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'wave': 'wave 2s ease-in-out infinite',
        'enter': 'enter 180ms ease-out',
        'menu': 'menu 140ms ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(10deg)' },
        },
        enter: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        menu: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
