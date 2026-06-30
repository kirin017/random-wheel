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
        // Live Bếp Yêu Thương tokens, mirrored from bepyeuthuong.com.vn.
        brand: {
          cream: '#fff8ea',
          surface: '#ffffff',
          inset: '#f6fbf7',
          mint: '#eaf7ef',
          line: '#d8e5dd',
          'line-strong': '#9fc7ae',
          ink: '#17231f',
          muted: '#66756f',
          forest: '#155e3b',
          leaf: '#4baa65',
          tomato: '#e94f37',
          citrus: '#f6c744',
          focus: '#f6c744',
        },
        // Compatibility aliases used by the current components.
        cream: {
          50: '#fff8ea',
          100: '#f6fbf7',
          200: '#eaf7ef',
          300: '#d8e5dd',
        },
        sage: {
          50: '#eaf7ef',
          100: '#d8e5dd',
          400: '#9fc7ae',
          500: '#4baa65',
          600: '#155e3b',
          700: '#17231f',
        },
        clay: {
          // Tomato CTA and error ramp from the brand storefront.
          300: '#f6a497',
          400: '#f0745f',
          500: '#e94f37',
          600: '#a33022',
        },
        cocoa: {
          // Storefront ink and muted copy.
          500: '#66756f',
          700: '#355044',
          900: '#17231f',
        },
        honey: {
          // Brand citrus accent.
          300: '#ffe08a',
          400: '#f6c744',
        },
      },
      boxShadow: {
        // Storefront shadows are tinted green, not generic black.
        soft: '0 14px 34px rgba(21, 94, 59, 0.08)',
        lift: '0 18px 36px rgba(233, 79, 55, 0.22), 0 8px 20px rgba(21, 94, 59, 0.10)',
        wheel: '0 18px 42px rgba(23, 35, 31, 0.18)',
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
