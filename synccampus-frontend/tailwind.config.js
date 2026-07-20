/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        twilight: {
          DEFAULT: '#151B39',
          surface: '#1C2447',
          'surface-hover': '#232C54',
          border: '#2A3563',
        },
        alice: {
          DEFAULT: '#F3F9FF',
          muted: '#9AA5C7',
        },
        usiu: {
          blue: '#2F6FED',
          'blue-hover': '#4C82FF',
          'blue-dark': '#1F4FBF',
        },
        gold: {
          DEFAULT: '#E8B84B',
          hover: '#F0C868',
          dark: '#C99A32',
        },
        success: '#34D399',
        danger: '#F87171',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(232,184,75,0.35), 0 8px 24px -6px rgba(47,111,237,0.35)',
        card: '0 4px 24px -6px rgba(0,0,0,0.45)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.96)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
