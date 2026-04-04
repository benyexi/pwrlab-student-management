import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a3a2a',
          50:  '#f0f7f3',
          100: '#d9ede2',
          200: '#b3dbc6',
          300: '#7ec2a2',
          400: '#4da37c',
          500: '#2e8460',
          600: '#1f6a4a',
          700: '#1a3a2a',
          800: '#162f22',
          900: '#12261c',
        },
        accent: '#4da37c',
      },
      fontFamily: {
        sans: ['"DM Sans"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', '"Noto Serif SC"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
