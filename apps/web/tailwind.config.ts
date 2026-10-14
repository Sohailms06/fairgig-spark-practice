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
        ivory: '#FAFAF8',
        surface: '#FFFFFF',
        forest: {
          50: '#F2F7F4',
          100: '#E2ECE6',
          200: '#C5D9CE',
          600: '#2D5A47',
          700: '#234737',
          800: '#1A3428',
          900: '#11221A',
        },
        sage: {
          50: '#F4F7F5',
          100: '#E5EBE7',
          200: '#C8D5CD',
          400: '#7F9E8B',
          500: '#62836E',
          600: '#4D6B57',
        },
        charcoal: {
          100: '#78716C',
          300: '#57534E',
          500: '#44403C',
          700: '#292524',
          900: '#1C1917',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          'Inter',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
export default config;
