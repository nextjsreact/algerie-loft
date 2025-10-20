'use client'

import { FlagIcon } from '@/components/ui/flag-icon';

interface MobileLanguageSelectorProps {
  locale: string;
  onLanguageChange?: () => void;
}

const languages = [
  { code: 'fr', name: 'Français', flagCode: 'FR' as const },
  { code: 'en', name: 'English', flagCode: 'GB' as const },
  { code: 'ar', name: 'العربية', flagCode: 'DZ' as const }
];

export default function MobileLanguageSelector({ locale, onLanguageChange }: MobileLanguageSelectorProps) {
  const changeLanguage = (newLocale: string) => {
    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    
    // Call callback if provided
    if (onLanguageChange) {
      onLanguageChange();
    }
    
    // Navigate to new locale
    window.location.href = `/${newLocale}/public`;
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
            locale === lang.code 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
          }`}
        >
          <FlagIcon country={lang.flagCode} className="w-6 h-4" />
          <span className="font-medium">{lang.name}</span>
          {locale === lang.code && (
            <svg className="w-5 h-5 ml-auto text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}