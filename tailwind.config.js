/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#080A0D',
        surface: {
          DEFAULT: '#101318',
          elevated: '#151920',
        },
        primary: {
          DEFAULT: '#F4F6F8',
          secondary: '#9299A3',
          muted: '#626A75',
        },
        border: 'rgba(255,255,255,0.07)',
        accent: {
          DEFAULT: '#00D2FF',
          glow: 'rgba(0, 210, 255, 0.5)',
        },
        status: {
          red: '#FF3B30',
          amber: '#FF9500',
          green: '#34C759',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'SF Pro Display', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
