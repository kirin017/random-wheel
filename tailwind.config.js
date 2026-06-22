/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Warm, moderately-rounded display for headings (BYT visual brain)
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        // Clear, Vietnamese-diacritic-optimised body
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Bếp Yêu Thương brand palette (warm kitchen, sage-led)
        cream: {
          50: '#fdfaf3',
          100: '#fbf5ea',
          200: '#f5ecd9',
          300: '#ecdfc4',
        },
        sage: {
          50: '#eef4ef',
          100: '#dce8df',
          400: '#7aa386',
          500: '#5f8a6c',
          600: '#4c7257',
          700: '#3d5c47',
        },
        clay: {
          // earth-orange / terracotta — secondary warmth
          300: '#e6b491',
          400: '#d99468',
          500: '#cd7c4d',
          600: '#b66639',
        },
        cocoa: {
          // warm brown / charcoal — primary text & trust
          500: '#6b5d4f',
          700: '#473b30',
          900: '#2f2620',
        },
        honey: {
          // soft morning/membership yellow
          300: '#f4dca3',
          400: '#eecb7e',
        },
      },
      boxShadow: {
        // tinted-to-background soft shadows, never pure black
        soft: '0 2px 12px rgba(71, 59, 48, 0.07), 0 1px 3px rgba(71, 59, 48, 0.05)',
        lift: '0 12px 32px rgba(71, 59, 48, 0.12), 0 4px 10px rgba(71, 59, 48, 0.07)',
        wheel: '0 18px 48px rgba(71, 59, 48, 0.16)',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.85) translateY(16px)', opacity: '0' },
          '60%': { transform: 'scale(1.03) translateY(-2px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        floatSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      animation: {
        'bounce-in': 'bounceIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in': 'fadeIn 0.3s ease-out',
        'float-soft': 'floatSoft 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
