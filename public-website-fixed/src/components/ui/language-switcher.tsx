'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';

const localeNames = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية'
} as const;

const localeFlags = {
  fr: '🇫🇷',
  en: '🇺🇸',
  ar: '🇩🇿'
} as const;

export function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-colors"
        aria-label={t('select')}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">
          {localeFlags[locale as keyof typeof localeFlags]} {localeNames[locale as keyof typeof localeNames]}
        </span>
        <span className="sm:hidden">
          {localeFlags[locale as keyof typeof localeFlags]}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1" role="menu">
              {routing.locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocaleChange(loc)}
                  className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors ${
                    locale === loc ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                  role="menuitem"
                >
                  <span className="text-lg">
                    {localeFlags[loc as keyof typeof localeFlags]}
                  </span>
                  <span>
                    {localeNames[loc as keyof typeof localeNames]}
                  </span>
                  {locale === loc && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}