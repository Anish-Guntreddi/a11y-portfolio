import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Courier New', 'monospace'],
      },
      colors: {
        // CSS variable bridging for Tailwind utilities
        canvas: 'var(--canvas)',
        ink: 'var(--ink)',
        accent: 'var(--accent)',
        danger: 'var(--danger)',
        muted: 'var(--muted)',
        surface: 'var(--surface)',
        hairline: 'var(--hairline)',
        // NovaUI token references (channel triplets)
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-fg': 'rgb(var(--color-primary-fg) / <alpha-value>)',
        fg: 'rgb(var(--color-fg) / <alpha-value>)',
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};

export default config;
