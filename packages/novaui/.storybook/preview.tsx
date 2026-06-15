import React from 'react';
import type { Preview, Decorator } from '@storybook/react';
import { ThemeProvider } from '../src/theme/ThemeProvider';

// Import design tokens and Tailwind utilities so components are correctly styled.
import '../src/tokens/tokens.css';
import '../src/styles/tailwind.css';

// ── Global toolbar control ────────────────────────────────────────────────────

const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Switch between light and dark theme',
    defaultValue: 'light',
    toolbar: {
      icon: 'sun',
      items: [
        { value: 'light', icon: 'sun', title: 'Light' },
        { value: 'dark', icon: 'moon', title: 'Dark' },
      ],
      showName: true,
      dynamicTitle: true,
    },
  },
};

// ── Theme decorator ───────────────────────────────────────────────────────────
// Wraps every story in ThemeProvider, sets data-theme on <html> via the
// ThemeProvider's initialTheme prop, and adjusts the canvas background.

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals['theme'] as 'light' | 'dark') ?? 'light';

  return (
    <ThemeProvider initialTheme={theme}>
      <div
        data-theme={theme}
        style={{
          minHeight: '100vh',
          background: theme === 'dark' ? 'rgb(13, 15, 17)' : 'rgb(255, 255, 255)',
          padding: '1.5rem',
          color: theme === 'dark' ? 'rgb(241, 245, 249)' : 'rgb(13, 15, 17)',
        }}
      >
        <Story />
      </div>
    </ThemeProvider>
  );
};

// ── Preview config ────────────────────────────────────────────────────────────

const preview: Preview = {
  globalTypes,
  decorators: [withTheme],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // Run axe on every story automatically.
      element: '#storybook-root',
      config: {},
      options: {},
    },
    backgrounds: { disable: true }, // We control background via our decorator.
  },
};

export default preview;
