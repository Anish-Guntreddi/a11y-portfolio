import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/storybook-static/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '.remember/**',
      'docs/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      'react-hooks': reactHooks,
      react,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Security: AST-level enforcement that no component injects raw HTML.
      // If sanitized HTML is ever genuinely required, it must be an explicit,
      // reviewed per-line override (eslint-disable-next-line react/no-danger).
      'react/no-danger': 'error',
    },
  },
);
