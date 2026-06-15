import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'novaui-theme';

/**
 * `useLayoutEffect` on the client, `useEffect` on the server (SSR-safe).
 * Using layout effect for the DOM attribute write prevents FOUC: the attribute
 * is set synchronously before the browser paints.
 */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Resolve initial theme: localStorage → prefers-color-scheme → 'light'. SSR-safe. */
function resolveInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage may be unavailable (private browsing, security policy, etc.)
  }
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

interface ThemeProviderProps {
  /** React subtree to wrap. */
  children: React.ReactNode;
  /**
   * DOM element to set `data-theme` on. Defaults to `document.documentElement`.
   * Pass a ref's `.current` for isolated testing.
   */
  target?: HTMLElement | null;
  /** Override initial theme (e.g. from URL param). */
  initialTheme?: Theme;
}

export function ThemeProvider({ children, target, initialTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme ?? resolveInitialTheme);

  // Track whether the user has explicitly set a theme override.
  // If `initialTheme` is provided, treat that as an explicit override.
  const hasExplicitOverride = useRef<boolean>(
    initialTheme !== undefined || (() => {
      if (typeof window === 'undefined') return false;
      try {
        return localStorage.getItem(STORAGE_KEY) !== null;
      } catch {
        return false;
      }
    })(),
  );

  // Sync data-theme attribute to the target element pre-paint (layout effect).
  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const el = target ?? document.documentElement;
    el.setAttribute('data-theme', theme);
  }, [theme, target]);

  // Subscribe to OS colour-scheme changes when there is no explicit override.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasExplicitOverride.current) return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!hasExplicitOverride.current) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    hasExplicitOverride.current = true;
    setThemeState(t);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, t);
      } catch {
        // ignore write errors (private mode / quota exceeded)
      }
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Access the current theme and controls. Must be used inside `ThemeProvider`. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
