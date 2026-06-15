// Side-effect: inject Tailwind utilities and design tokens into the document.
import './styles/tailwind.css';
import './tokens/tokens.css';

// Components
export { Button } from './components/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button';

export { FormField } from './components/FormField';
export type { FormFieldProps } from './components/FormField';

export { Input } from './components/Input';
export type { InputProps } from './components/Input';

// Theme
export { ThemeProvider, useTheme } from './theme/ThemeProvider';

// A11y utilities
export { contrastRatio, relativeLuminance } from './a11y/contrast';
