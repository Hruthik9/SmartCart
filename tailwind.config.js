/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ios: {
          bg: '#000000',
          card: '#1C1C1E',
          cardLight: '#2C2C2E',
          surface: '#121214',
          blue: '#0A84FF',
          green: '#30D158',
          mint: '#63E6E2',
          orange: '#FF9F0A',
          red: '#FF453A',
          purple: '#BF5AF2',
          yellow: '#FFD60A',
          separator: '#38383A',
          subtext: '#8E8E93',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Inter"',
          'system-ui',
          'sans-serif'
        ],
      },
      keyframes: {
        laser: {
          '0%, 100%': { transform: 'translateY(0%)', opacity: '0.8' },
          '50%': { transform: 'translateY(280px)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.05)' },
        },
        wave: {
          '0%, 100%': { height: '8px' },
          '50%': { height: '32px' },
        }
      },
      animation: {
        laser: 'laser 2.2s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
        wave: 'wave 1.2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
