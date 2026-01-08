/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6fffa',
          100: '#b2fff0',
          200: '#80ffe6',
          300: '#4dffdc',
          400: '#1affd2',
          500: '#00e6c8',
          600: '#00b39e',
          700: '#008075',
          800: '#004d4c',
          900: '#001a1a',
        },
        accent: {
          50: '#f3edff',
          100: '#e4d7ff',
          200: '#c7adff',
          300: '#a27bff',
          400: '#8258ff',
          500: '#6938ef',
          600: '#4f25c7',
          700: '#3d1c9f',
          800: '#2e167d',
          900: '#1f0f59',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        dark: {
          50: '#f2f5fb',
          100: '#d7dce7',
          200: '#aeb6c7',
          300: '#8590a7',
          400: '#606f8a',
          500: '#45556f',
          600: '#2f3b53',
          700: '#233042',
          800: '#182432',
          900: '#0e1721',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.6s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2.5s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'gradient': 'gradient 18s ease infinite',
        'neural-pulse': 'neural-pulse 4s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(0, 230, 200, 0.4), 0 0 25px rgba(105, 56, 239, 0.35)' },
          '100%': { boxShadow: '0 0 25px rgba(0, 230, 200, 0.55), 0 0 45px rgba(105, 56, 239, 0.45)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'neural-pulse': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundImage: {
        'grid-glow': 'radial-gradient(circle at 20% 20%, rgba(0,230,200,0.08), transparent 35%), radial-gradient(circle at 80% 0%, rgba(105,56,239,0.10), transparent 35%)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
      },
    },
  },
  plugins: [],
}

