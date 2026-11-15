import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

export type ThemeMode = 'light' | 'dark' | 'contextual';
export type ResolvedTheme = 'light' | 'dark' | 'reading';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
  setPostCategory: (category: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');
  
  const [postCategory, setPostCategory] = useState<string | null>(null);

  // Load theme mode from localStorage, defaulting to 'contextual'
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('themeMode');
    if (stored === 'light' || stored === 'dark' || stored === 'contextual') {
      return stored as ThemeMode;
    }
    return 'contextual';
  });

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('themeMode', mode);
  };

  // State to track browser system preference
  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Determine current active category context (URL param wins, then page-specific override)
  const currentCategory = activeCategory || postCategory;

  // Resolve active theme based on mapping
  const resolvedTheme = React.useMemo<ResolvedTheme>(() => {
    if (themeMode === 'light') return 'light';
    if (themeMode === 'dark') return 'dark';

    // mode === 'contextual'
    if (!currentCategory || currentCategory.toLowerCase() === 'all') {
      return systemDark ? 'dark' : 'light';
    }

    const cat = currentCategory.toLowerCase();

    // Mapping:
    // Technology, Science, Code -> forces Dark Mode
    if (['technology', 'science', 'code'].includes(cat)) {
      return 'dark';
    }
    // Writing, History, Psychology, Books -> forces Light/Reading Mode
    if (['writing', 'history', 'psychology', 'books'].includes(cat)) {
      return 'reading';
    }
    // General, Movies -> follows system default
    if (['general', 'movies'].includes(cat)) {
      return systemDark ? 'dark' : 'light';
    }

    // Default fallback (e.g. music, food_cooking, fashion_style, business, health) to system default
    return systemDark ? 'dark' : 'light';
  }, [themeMode, currentCategory, systemDark]);

  // Synchronize CSS class on document element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'reading', 'light');
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else if (resolvedTheme === 'reading') {
      root.classList.add('reading');
    } else {
      root.classList.add('light');
    }
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ themeMode, resolvedTheme, setThemeMode, setPostCategory }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
