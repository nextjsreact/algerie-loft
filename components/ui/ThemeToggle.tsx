'use client'

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  
  const toggleTheme = () => {
    setIsToggling(true);
    setTheme(theme === 'light' ? 'dark' : 'light');
    // Reset the toggling state after animation
    setTimeout(() => setIsToggling(false), 200);
  };

  // Fix hydration issue
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut (Ctrl/Cmd + Shift + T)
  useEffect(() => {
    if (!mounted) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        toggleTheme();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mounted, theme, setTheme]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </button>
    );
  }

  // Use resolvedTheme to avoid hydration issues
  const currentTheme = resolvedTheme || theme;

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 ${
        isToggling ? 'scale-95 rotate-180' : 'scale-100 rotate-0'
      }`}
      aria-label={currentTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={`${currentTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} (Ctrl+Shift+T)`}
    >
      {currentTheme === 'light' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </button>
  );
}