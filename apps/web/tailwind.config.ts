import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FAF9F5',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F3F3F0',
        },
        border: '#E1E4EA',
        brand: {
          primary: '#1B4332',
          secondary: '#2D6A4F',
          sage: '#8FA89B',
        },
        ink: {
          primary: '#22252A',
          secondary: '#5B6370',
          muted: '#8C95A3',
        },
        ivory: '#FAF9F5',
        forest: {
          50: '#F2F7F4',
          100: '#E2ECE6',
          200: '#C5D9CE',
          600: '#2D6A4F',
          700: '#1B4332',
          800: '#143125',
          900: '#0E2119',
        },
        sage: {
          50: '#F4F7F5',
          100: '#E5EBE7',
          200: '#C8D5CD',
          400: '#8FA89B',
          500: '#62836E',
          600: '#4D6B57',
        },
        charcoal: {
          100: '#8C95A3',
          300: '#5B6370',
          500: '#44403C',
          700: '#2D3139',
          900: '#22252A',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
export default config;
