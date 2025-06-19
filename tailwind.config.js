/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Transfer Juice Brand Colors
        brand: {
          black: '#0A0808',
          cream: '#F9F2DF',
          orange: {
            50: '#fff8f1',
            100: '#feecdc',
            200: '#fcd9bd',
            300: '#fdba8c',
            400: '#ff8a4c',
            500: '#ff5a1f',
            600: '#d03801',
            700: '#b43403',
            800: '#8a2c0d',
            900: '#73230d',
          },
        },
        // Dark mode semantic colors
        dark: {
          bg: '#0A0808',
          surface: '#1a1a1a',
          border: '#2a2a2a',
          text: {
            primary: '#F9F2DF',
            secondary: '#d1d5db',
            muted: '#9ca3af',
          },
        },
        // Light mode semantic colors
        light: {
          bg: '#F9F2DF',
          surface: '#ffffff',
          border: '#e5e7eb',
          text: {
            primary: '#0A0808',
            secondary: '#374151',
            muted: '#6b7280',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      fontSize: {
        // Mobile-first responsive typography scale
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },
      spacing: {
        // Consistent spacing scale
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
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
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'inner-lg': 'inset 0 10px 15px -3px rgb(0 0 0 / 0.1)',
        glow: '0 0 20px rgb(255 90 31 / 0.3)',
        'glow-lg': '0 0 40px rgb(255 90 31 / 0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'orange-gradient': 'linear-gradient(135deg, #ff8a4c 0%, #ff5a1f 100%)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
