import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * The design system's "rule book". It maps friendly color names like
 * `bg-background` or `text-primary` to CSS variables defined in globals.css.
 * Because they're variables, the whole theme (including dark mode) changes by
 * swapping a few values — no hunting through components.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'aurora':
          'radial-gradient(40% 40% at 20% 20%, hsl(252 90% 60% / 0.25), transparent), radial-gradient(40% 40% at 80% 30%, hsl(190 90% 50% / 0.20), transparent), radial-gradient(50% 50% at 50% 90%, hsl(280 90% 60% / 0.18), transparent)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'scan-down': {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(220px)', opacity: '0' },
        },
        'ai-ping': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '75%, 100%': { transform: 'scale(2.6)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        shimmer: 'shimmer 1.5s infinite',
        'scan-down': 'scan-down 2.2s ease-in-out infinite',
        'ai-ping': 'ai-ping 1.8s cubic-bezier(0,0,0.2,1) infinite',
      },
    },
  },
  plugins: [animate],
};

export default config;
