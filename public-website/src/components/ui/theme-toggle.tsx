'use client';

import { useTheme } from '@/contexts/theme-context';
import { useTranslations } from 'next-intl';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState } from 'react';

const themes = [
  { key: 'light', icon: Sun, label: 'light' },
  { key: 'dark', icon: Moon, label: 'dark' },
  { key: 'system', icon: Monitor, label: 'system' },
] as const;

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = useTranslations('theme');
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme = themes.find(t => t.key === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        aria-label={t('toggle')}
        title={t('current', { theme: t(currentTheme.label) })}
      >
        <CurrentIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 z-20 border border-gray-200 dark:border-gray-700">
            <div className="py-1" role="menu">
              {themes.map((themeOption) => {
                const Icon = themeOption.icon;
                const isSelected = theme === themeOption.key;
                
                return (
                  <button
                    key={themeOption.key}
                    onClick={() => handleThemeChange(themeOption.key)}
                    className={`flex items-center gap-3 w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                    role="menuitem"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">
                      {t(themeOption.label)}
                    </span>
                    {isSelected && (
                      <span className="text-blue-600 dark:text-blue-400">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}