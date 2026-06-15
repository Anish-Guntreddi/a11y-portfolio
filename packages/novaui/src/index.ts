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

export { Modal } from './components/Modal';
export type { ModalProps } from './components/Modal';

export { Menu } from './components/Menu';
export type { MenuProps, MenuItem } from './components/Menu';

// Hooks
export { useFocusTrap } from './hooks/useFocusTrap';
export type { UseFocusTrapOptions } from './hooks/useFocusTrap';

export { useRovingTabindex } from './hooks/useRovingTabindex';
export type { UseRovingTabindexOptions, UseRovingTabindexReturn } from './hooks/useRovingTabindex';

// Theme
export { ThemeProvider, useTheme } from './theme/ThemeProvider';

// A11y utilities
export { contrastRatio, relativeLuminance } from './a11y/contrast';
