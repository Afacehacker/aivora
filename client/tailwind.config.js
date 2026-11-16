/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        aivora: {
          dark: '#fff5f7',          // Soft light pink/white primary background
          navy: '#ffffff',          // Crisp pure white cards and surfaces
          'navy-light': '#fdf2f8',  // Delicate blush pink accent surface
          pink: '#ec4899',          // Primary vibrant pink
          'pink-light': '#fce7f3',  // Light pastel pink
          'pink-dark': '#db2777',   // Deep rose pink
          rose: '#f43f5e',          // Rose accent
          indigo: '#ec4899',        // Mapped to pink for seamless compatibility
          purple: '#f43f5e',        // Mapped to rose for seamless compatibility
          cyan: '#db2777',          // Mapped to deep pink
          magenta: '#ec4899',       // Pink
          blue: '#f43f5e',          // Rose
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Lexend', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #fff1f5 0%, #fdf2f8 50%, #ffffff 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(236,72,153,0.06), rgba(244,63,94,0.03))',
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
        'glow-indigo': '0 4px 20px rgba(236,72,153,0.25)',
        'glow-purple': '0 4px 20px rgba(244,63,94,0.25)',
        'glow-cyan': '0 4px 20px rgba(219,39,119,0.25)',
        'card': '0 2px 16px rgba(244,63,94,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 30px rgba(244,63,94,0.12), 0 2px 6px rgba(0,0,0,0.04)',
      }
    }
  },
  plugins: [],
}
