import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './e2e/harness/**/*.{ts,tsx,html}',
    './src/**/*.stories.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:           'rgb(var(--color-bg) / <alpha-value>)',
        surface:      'rgb(var(--color-surface) / <alpha-value>)',
        fg:           'rgb(var(--color-fg) / <alpha-value>)',
        'muted-fg':   'rgb(var(--color-muted-fg) / <alpha-value>)',
        border:       'rgb(var(--color-border) / <alpha-value>)',
        primary:      'rgb(var(--color-primary) / <alpha-value>)',
        'primary-fg': 'rgb(var(--color-primary-fg) / <alpha-value>)',
        danger:       'rgb(var(--color-danger) / <alpha-value>)',
        'danger-fg':  'rgb(var(--color-danger-fg) / <alpha-value>)',
        'focus-ring': 'rgb(var(--color-focus-ring) / <alpha-value>)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
      },
    },
  },
  plugins: [],
};

export default config;
