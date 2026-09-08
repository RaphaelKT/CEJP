import type { Config } from 'tailwindcss';

/**
 * Design tokens da Missao Evangelica do Brasil.
 * Paleta institucional: Branco (marfim) / Dourado / Vermelho (carmim),
 * com apoios analogos (bordo, terracota, oliva) para estados e detalhes.
 */
const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2rem', '2xl': '3rem' },
      screens: { '2xl': '1360px' },
    },
    extend: {
      colors: {
        /* ---------- Núcleo institucional ---------- */
        ivory: {
          50: '#FFFDF9',
          100: '#FDF9F1',
          200: '#F8F1E3',
          300: '#F1E6D2',
          400: '#E6D7BC',
          500: '#D8C4A2',
        },
        gold: {
          50: '#FDF8EA',
          100: '#F9EDCB',
          200: '#F1DC9C',
          300: '#E5C468',
          400: '#D8AE41',
          500: '#C8992B',
          600: '#AB7B1F',
          700: '#875E1A',
          800: '#6B4A1B',
          900: '#583D1B',
          950: '#33210C',
        },
        crimson: {
          50: '#FEF2F2',
          100: '#FDE3E3',
          200: '#FBCBCC',
          300: '#F7A5A7',
          400: '#F07174',
          500: '#E24448',
          600: '#C4162A',
          700: '#A31621',
          800: '#87161F',
          900: '#711920',
          950: '#3E070C',
        },
        /* ---------- Apoios ---------- */
        bordeaux: { 500: '#6E0D1A', 600: '#5A0A15', 700: '#460810' },
        olive: { 400: '#8B9A6B', 500: '#6F7F52', 600: '#57663F' },
        ink: {
          50: '#F6F5F4',
          100: '#E8E5E2',
          200: '#CFC9C4',
          300: '#ABA29B',
          400: '#7F746C',
          500: '#5E534C',
          600: '#463D38',
          700: '#332C28',
          800: '#231E1B',
          900: '#171310',
          950: '#0D0A08',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Fraunces', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
        display: ['clamp(2.75rem, 6.5vw, 5.5rem)', { lineHeight: '0.98', letterSpacing: '-0.03em' }],
        headline: ['clamp(2rem, 4vw, 3.25rem)', { lineHeight: '1.06', letterSpacing: '-0.02em' }],
        title: ['clamp(1.5rem, 2.4vw, 2.125rem)', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(35,30,27,.04), 0 8px 24px -12px rgba(35,30,27,.14)',
        lift: '0 2px 4px rgba(35,30,27,.05), 0 18px 44px -20px rgba(35,30,27,.28)',
        gold: '0 10px 40px -14px rgba(200,153,43,.55)',
        crimson: '0 10px 40px -14px rgba(163,22,33,.45)',
        inset: 'inset 0 1px 0 rgba(255,255,255,.6)',
      },
      backgroundImage: {
        'gold-sheen':
          'linear-gradient(100deg,#875E1A 0%,#C8992B 22%,#F1DC9C 45%,#D8AE41 60%,#AB7B1F 82%,#E5C468 100%)',
        'crimson-deep': 'linear-gradient(140deg,#711920 0%,#A31621 45%,#6E0D1A 100%)',
        'ivory-veil': 'linear-gradient(180deg,#FFFDF9 0%,#F8F1E3 100%)',
        noise:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.32'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'none' } },
        'sheen': { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
        'pulse-ring': {
          '0%': { transform: 'scale(.85)', opacity: '.7' },
          '80%,100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'marquee': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'float': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      animation: {
        'fade-up': 'fade-up .7s cubic-bezier(.16,1,.3,1) both',
        sheen: 'sheen 6s linear infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(.24,.9,.35,1) infinite',
        marquee: 'marquee 42s linear infinite',
        float: 'float 7s ease-in-out infinite',
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(.16,1,.3,1)',
      },
    },
  },
  plugins: [],
};

export default config;
