'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  type ThemeMode,
  type AccentId,
  type RadiusId,
  type ThemeConfig,
  DEFAULT_THEME,
} from '@/design-system';

const STORAGE_KEY = 'vaultbill-theme';

interface ThemeContextValue extends ThemeConfig {
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentId) => void;
  setRadius: (radius: RadiusId) => void;
  setReducedMotion: (reduced: boolean) => void;
  toggleTheme: () => void;
  resolved: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function loadConfig(): ThemeConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_THEME };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_THEME, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_THEME };
}

function saveConfig(config: ThemeConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch { /* ignore */ }
}

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = loadConfig();
    setConfig(stored);
    setMounted(true);
  }, []);

  /* system preference listener */
  useEffect(() => {
    if (config.mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      applyTheme(config);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [config]);

  /* reduced motion listener */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      setConfig((prev) => ({ ...prev, reducedMotion: e.matches }));
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const applyTheme = useCallback((cfg: ThemeConfig) => {
    const root = document.documentElement;
    const resolved = resolveMode(cfg.mode);

    root.classList.toggle('dark', resolved === 'dark');
    root.setAttribute('data-accent', cfg.accent);
    root.setAttribute('data-radius', cfg.radius);
    root.setAttribute('data-reduced-motion', String(cfg.reducedMotion));

    saveConfig(cfg);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(config);
  }, [config, mounted, applyTheme]);

  const resolved = resolveMode(config.mode);

  const setMode = useCallback((mode: ThemeMode) => {
    setConfig((prev) => ({ ...prev, mode }));
  }, []);

  const setAccent = useCallback((accent: AccentId) => {
    setConfig((prev) => ({ ...prev, accent }));
  }, []);

  const setRadius = useCallback((radius: RadiusId) => {
    setConfig((prev) => ({ ...prev, radius }));
  }, []);

  const setReducedMotion = useCallback((reducedMotion: boolean) => {
    setConfig((prev) => ({ ...prev, reducedMotion }));
  }, []);

  const toggleTheme = useCallback(() => {
    setConfig((prev) => {
      const next = resolved === 'dark' ? 'light' : 'dark';
      return { ...prev, mode: next };
    });
  }, [resolved]);

  /* prevent flash of wrong theme */
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        ...config,
        setMode,
        setAccent,
        setRadius,
        setReducedMotion,
        toggleTheme,
        resolved,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}