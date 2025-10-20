'use client'

import { useState } from 'react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import PublicLanguageSelector from './PublicLanguageSelector';
import MobileLanguageSelector from './MobileLanguageSelector';

interface PublicHeaderProps {
  locale: string;
  text: {
    login: string;
  };
}

export default function PublicHeader({ locale, text }: PublicHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">LA</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Loft Algérie</h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Main Navigation */}
            <nav className="flex space-x-6">
              <a 
                href={`/${locale}/public`}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                {locale === 'fr' ? 'Accueil' : locale === 'en' ? 'Home' : 'الرئيسية'}
              </a>
              <a 
                href={`/${locale}/public/services`}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                {locale === 'fr' ? 'Services' : locale === 'en' ? 'Services' : 'الخدمات'}
              </a>
              <a 
                href={`/${locale}/public/portfolio`}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                {locale === 'fr' ? 'Portfolio' : locale === 'en' ? 'Portfolio' : 'المعرض'}
              </a>
              <a 
                href={`/${locale}/public/about`}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                {locale === 'fr' ? 'À Propos' : locale === 'en' ? 'About' : 'حولنا'}
              </a>
              <a 
                href={`/${locale}/public/contact`}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                {locale === 'fr' ? 'Contact' : locale === 'en' ? 'Contact' : 'اتصال'}
              </a>
            </nav>

            {/* Language Switcher */}
            <PublicLanguageSelector locale={locale} />
            
            {/* Theme Toggle */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
            </div>
            
            {/* Login Button */}
            <a 
              href={`/${locale}/login`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              🔐 {text.login}
            </a>
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Mobile Theme Toggle */}
            <ThemeToggle />
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:text-gray-900 dark:focus:text-white p-2"
              aria-label="Toggle mobile menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4 bg-white dark:bg-gray-900">
            <nav className="flex flex-col space-y-1">
              {/* Navigation Links */}
              <a 
                href={`/${locale}/public`}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors px-4 py-3 rounded-lg mx-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {locale === 'fr' ? 'Accueil' : locale === 'en' ? 'Home' : 'الرئيسية'}
              </a>
              <a 
                href={`/${locale}/public/services`}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors px-4 py-3 rounded-lg mx-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {locale === 'fr' ? 'Services' : locale === 'en' ? 'Services' : 'الخدمات'}
              </a>
              <a 
                href={`/${locale}/public/portfolio`}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors px-4 py-3 rounded-lg mx-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {locale === 'fr' ? 'Portfolio' : locale === 'en' ? 'Portfolio' : 'المعرض'}
              </a>
              <a 
                href={`/${locale}/public/about`}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors px-4 py-3 rounded-lg mx-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {locale === 'fr' ? 'À Propos' : locale === 'en' ? 'About' : 'حولنا'}
              </a>
              <a 
                href={`/${locale}/public/contact`}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors px-4 py-3 rounded-lg mx-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {locale === 'fr' ? 'Contact' : locale === 'en' ? 'Contact' : 'اتصال'}
              </a>
              
              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-4 mx-2"></div>
              
              {/* Mobile Language Switcher */}
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  {locale === 'fr' ? 'Langue' : locale === 'en' ? 'Language' : 'اللغة'}
                </p>
                <MobileLanguageSelector 
                  locale={locale} 
                  onLanguageChange={() => setIsMobileMenuOpen(false)}
                />
              </div>
              
              {/* Mobile Login Button */}
              <div className="px-2 pt-4">
                <a 
                  href={`/${locale}/login`}
                  className="block w-full bg-blue-600 dark:bg-blue-700 text-white text-center px-4 py-3 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  🔐 {text.login}
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}