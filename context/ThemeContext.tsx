"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} });

type ThemeProviderProps = {
  children: ReactNode;
  initialTheme?: Theme;
};

function resolveInitialTheme(fallback?: Theme): Theme {
  if (typeof window === 'undefined') {
    return fallback ?? 'light';
  }

  try {
    const stored = window.localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {}

  const fromDom = document.documentElement.getAttribute('data-theme');
  if (fromDom === 'light' || fromDom === 'dark') {
    return fromDom;
  }

  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return fallback ?? 'light';
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => resolveInitialTheme(initialTheme));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.setAttribute('data-theme', theme);

    try {
      window.localStorage.setItem('theme', theme);
    } catch {}

    try {
      const maxAge = 60 * 60 * 24 * 365;
      document.cookie = `theme=${theme}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}