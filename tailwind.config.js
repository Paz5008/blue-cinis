/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // enable class-based dark mode
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Loire Valley inspired palette
        'river-blue': 'var(--river-blue)',
        'tuffeau-sand': 'var(--tuffeau-sand)',
        'vine-green': 'var(--vine-green)',
        'castle-gray': 'var(--castle-gray)',
        // Accent colors
        'accent': 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        // Utilities (retain subtle neutrals)
        'bg-subtle': 'var(--bg-subtle)',
        'border-subtle': 'var(--border-subtle)',
        'text-heading': 'var(--text-heading)',
        'text-body': 'var(--text-body)',
        'text-body-subtle': 'var(--text-body-subtle)',
      },
      fontFamily: {
        // Typography: classic serif for headings, modern sans for body
        'playfair': ['var(--font-playfair)'],
        'montserrat': ['var(--font-montserrat)'],
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        // Luxury tokens
        'glass-sm': 'var(--shadow-glass-sm)',
        'glass-md': 'var(--shadow-glass-md)',
        'glass-lg': 'var(--shadow-glass-lg)',
        'glass-hero': 'var(--shadow-glass-hero)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'full': 'var(--radius-full)',
      },
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms',
      },
      animation: {
        'pulse-accent': 'subtle-pulse 2s infinite',
        'fade-in': 'fadeIn var(--transition-slow) ease-in-out forwards',
      },
      keyframes: {
        'subtle-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(159, 188, 254, 0.4)' },
          '70%': { boxShadow: '0 0 0 6px rgba(159, 188, 254, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(159, 188, 254, 0)' }
        },
        'fadeIn': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('daisyui'),
  ],
  // DaisyUI configuration
  daisyui: {
    themes: ['light', 'dark'],
  },
}
