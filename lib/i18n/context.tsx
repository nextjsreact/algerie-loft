'use client'

import { useTranslations } from 'next-intl';
import { createContext, useContext, ReactNode } from 'react';

// Temporary compatibility layer for components still using the old i18n context
// This provides a bridge between the old useTranslation hook and next-intl

interface I18nContextType {
  t: (key: string, options?: any) => string;
  language: string;
  changeLanguage: (lng: string) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // This is a compatibility provider - in practice, the OptimizedIntlProvider
  // should be used instead for new components
  return (
    <I18nContext.Provider value={null}>
      {children}
    </I18nContext.Provider>
  );
}

// Compatibility hook that uses next-intl under the hood
export function useTranslation(namespace?: string) {
  // Use next-intl's useTranslations hook
  const t = useTranslations(namespace);
  
  return {
    t: (key: string, options?: any) => {
      try {
        return t(key, options);
      } catch (error) {
        console.warn(`Translation key not found: ${namespace ? namespace + '.' : ''}${key}`);
        return key; // Fallback to key itself
      }
    },
    language: 'fr', // Default language - this should be dynamic in a real implementation
    changeLanguage: (lng: string) => {
      // Trigger language change event for the optimized provider
      window.dispatchEvent(new CustomEvent('languageChange', { 
        detail: { locale: lng } 
      }));
    }
  };
}