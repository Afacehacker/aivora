/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        aivora: {
          dark: '#030712',
          navy: '#0f172a',
          'navy-light': '#1e293b',
          indigo: '#6366f1',
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          magenta: '#ec4899',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Lexend', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #030712 0%, #0f172a 50%, #1e1b4b 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        }
      },
      boxShadow: {
        'glow-indigo': '0 0 30px rgba(99,102,241,0.3)',
        'glow-purple': '0 0 30px rgba(139,92,246,0.3)',
        'glow-cyan': '0 0 30px rgba(6,182,212,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.5)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.2)',
      }
    }
  },
  plugins: [],
}
