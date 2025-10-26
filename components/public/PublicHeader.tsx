'use client'

import { useState } from 'react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import PublicLanguageSelector from './PublicLanguageSelector';
import MobileLanguageSelector from './MobileLanguageSelector';
import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';
import RobustLogo from '@/components/futuristic/RobustLogo';

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
          <div className="flex items-center">
            <RobustLogo variant="header" />
          </div>
          
          {/* Desktop Navigation */}
          <div className={`hidden md:flex items-center ${locale === 'ar' ? 'space-x-reverse space-x-6 flex-row-reverse' : 'space-x-6'}`}>
            {/* Main Navigation */}
            <nav className={`flex ${locale === 'ar' ? 'arabic-nav' : 'space-x-6'}`}>
              <a 
                href={`/${locale}/public`}
                className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors ${locale === 'ar' ? 'arabic-text' : ''}`}
              >
                {locale === 'fr' ? 'Accueil' : locale === 'en' ? 'Home' : 'الرئيسية'}
              </a>
              <a 
                href={`/${locale}/public/services`}
                className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors ${locale === 'ar' ? 'arabic-text' : ''}`}
              >
                {locale === 'fr' ? 'Services' : locale === 'en' ? 'Services' : 'الخدمات'}
              </a>
              <a 
                href={`/${locale}/public/portfolio`}
                className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors ${locale === 'ar' ? 'arabic-text' : ''}`}
              >
                {locale === 'fr' ? 'Portfolio' : locale === 'en' ? 'Portfolio' : 'المعرض'}
              </a>
              <a 
                href={`/${locale}/public/about`}
                className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors ${locale === 'ar' ? 'arabic-text' : ''}`}
              >
                {locale === 'fr' ? 'À Propos' : locale === 'en' ? 'About' : 'حولنا'}
              </a>
              <a 
                href={`/${locale}/public/contact`}
                className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors ${locale === 'ar' ? 'arabic-text' : ''}`}
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
            
            {/* Login Dropdown */}
            <div className="relative group">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                🔐 {text.login}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <a 
                    href={`/${locale}/login?role=client`}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    🏠 Client - Réserver
                  </a>
                  <a 
                    href={`/${locale}/login?role=partner`}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  >
                    🏢 Partenaire - Gérer
                  </a>
                  <a 
                    href={`/${locale}/login?role=admin`}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    ⚙️ Employé - Admin
                  </a>
                  <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                  <a 
                    href={`/${locale}/login`}
                    className="block px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    🔑 Connexion générale
                  </a>
                </div>
              </div>
            </div>
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
              
              {/* Mobile Login Options */}
              <div className="px-2 pt-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-2">
                  🔐 Connexion
                </p>
                <div className="space-y-2">
                  <a 
                    href={`/${locale}/login?role=client`}
                    className="block w-full bg-blue-600 dark:bg-blue-700 text-white text-center px-4 py-2 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🏠 Client - Réserver
                  </a>
                  <a 
                    href={`/${locale}/login?role=partner`}
                    className="block w-full bg-green-600 dark:bg-green-700 text-white text-center px-4 py-2 rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🏢 Partenaire - Gérer
                  </a>
                  <a 
                    href={`/${locale}/login?role=admin`}
                    className="block w-full bg-red-600 dark:bg-red-700 text-white text-center px-4 py-2 rounded-lg font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    ⚙️ Employé - Admin
                  </a>
                  <a 
                    href={`/${locale}/login`}
                    className="block w-full bg-gray-600 dark:bg-gray-700 text-white text-center px-4 py-2 rounded-lg font-medium hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🔑 Connexion générale
                  </a>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}