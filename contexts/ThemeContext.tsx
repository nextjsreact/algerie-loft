'use client';

import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (!mounted) {
      console.log('Theme toggle called but not mounted yet');
      return;
    }
    
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    console.log('Current theme:', resolvedTheme, 'Switching to:', newTheme);
    setTheme(newTheme);
  };

  // Return the resolved theme (actual theme being used)
  const currentTheme = (resolvedTheme || 'light') as Theme;

  return { 
    theme: currentTheme, 
    toggleTheme, 
    mounted 
  };
}