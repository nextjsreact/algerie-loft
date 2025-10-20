'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { AppAccessButton } from './app-access-button';
import { Menu, X, Home, Briefcase, FolderOpen, Users, MessageCircle, BookOpen } from 'lucide-react';
import { useParams } from 'next/navigation';
import { handleKeyDown, ariaExpanded, landmarks } from '@/lib/accessibility';

const navigationItems = [
  { key: 'home', href: '/', icon: Home },
  { key: 'services', href: '/services', icon: Briefcase },
  { key: 'portfolio', href: '/portfolio', icon: FolderOpen },
  { key: 'about', href: '/about', icon: Users },
  { key: 'contact', href: '/contact', icon: MessageCircle },
  { key: 'blog', href: '/blog', icon: BookOpen },
];

export function Header() {
  const t = useTranslations('navigation');
  const params = useParams();
  const locale = params.locale as string;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    // Return focus to menu button when closing
    menuButtonRef.current?.focus();
  };

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header 
      className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm safe-area-top"
      role={landmarks.banner}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
            aria-label={t('logoAlt')}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm" aria-hidden="true">LA</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 hidden sm:block">
              LoftAlgérie
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav 
            className="hidden lg:flex items-center space-x-6 xl:space-x-8"
            role={landmarks.navigation}
            aria-label={t('mainNavigation')}
            id="navigation"
          >
            {navigationItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 flex items-center space-x-1 touch-manipulation py-2 px-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={t(`${item.key}Description`)}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm lg:text-base">{t(item.key)}</span>
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-3 xl:space-x-4">
            <LanguageSwitcher />
            <AppAccessButton locale={locale} />
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <button
              ref={menuButtonRef}
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={isMobileMenuOpen ? t('closeMobileMenu') : t('openMobileMenu')}
              {...ariaExpanded(isMobileMenuOpen)}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            id="mobile-menu"
            className="lg:hidden border-t border-gray-200 py-4 animate-slide-down bg-white"
            role={landmarks.navigation}
            aria-label={t('mobileNavigation')}
          >
            <nav className="flex flex-col space-y-2">
              {navigationItems.map((item, index) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200 touch-manipulation min-h-[48px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mx-2"
                  onClick={closeMobileMenu}
                  onKeyDown={(e) => handleKeyDown(e, {
                    onEnter: closeMobileMenu,
                    onSpace: closeMobileMenu,
                  })}
                  aria-label={t(`${item.key}Description`)}
                  tabIndex={0}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium text-base">{t(item.key)}</span>
                </Link>
              ))}
              
              {/* Mobile Language Switcher (only show on very small screens) */}
              <div className="sm:hidden px-4 py-2" role="region" aria-label={t('languageSelection')}>
                <LanguageSwitcher />
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4 px-4">
                <div onClick={closeMobileMenu}>
                  <AppAccessButton locale={locale} className="w-full" />
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}