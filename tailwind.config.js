/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'am-bg': '#000000',
        'am-sidebar': 'rgba(28, 28, 30, 0.85)',
        'am-card': '#1c1c1e',
        'am-card-hover': '#2c2c2e',
        'am-red': '#fa243c',
        'am-red-hover': '#ff3b53',
        'am-text': '#ffffff',
        'am-text-secondary': 'rgba(255, 255, 255, 0.55)',
        'am-text-muted': 'rgba(255, 255, 255, 0.35)',
        'am-border': 'rgba(255, 255, 255, 0.08)',
        'am-player': 'rgba(30, 30, 32, 0.85)',
        'am-input': 'rgba(255, 255, 255, 0.1)',
        'am-input-hover': 'rgba(255, 255, 255, 0.15)',
        'am-highlight': '#fa243c',
      },
      fontFamily: {
        'sf': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'xxs': '0.65rem',
      },
      width: {
        'sidebar': '220px',
      },
      spacing: {
        'player': '72px',
        'topbar': '48px',
      },
      animation: {
        'marquee': 'marquee 15s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.97)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(250, 36, 60, 0.3)',
        'album': '0 8px 24px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
