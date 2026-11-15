import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        primary: colors.rose,
        gray: colors.zinc,
        slate: colors.zinc,
        // Dark theme surfaces. Light theme uses plain white / zinc directly
        // in components, so only the dark-mode-specific surfaces need
        // custom tokens here.
        surface: {
          DEFAULT: colors.zinc[950], // deep background
          raised: colors.zinc[900],  // card surfaces
          overlay: colors.zinc[800], // popup/overlay surfaces
        },
      },
      boxShadow: {
        panel: '0 24px 48px -12px rgba(15, 23, 42, 0.18)',
        'panel-dark': '0 24px 48px -12px rgba(0, 0, 0, 0.6)',
      },
      keyframes: {
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 180ms ease-out',
      },
    },
  },
  plugins: [],
};
