'use client';

import { AuthStatus } from '@/components/auth/auth-status';
import { AppAccessLink } from '@/components/auth/app-access-link';
import { Button } from '@/components/ui/button';
import { Building2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface PublicHeaderProps {
  locale?: string;
  className?: string;
}

export function PublicHeader({ locale = 'fr', className = '' }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: locale === 'fr' ? 'Accueil' : locale === 'en' ? 'Home' : locale === 'ar' ? 'الرئيسية' : 'Home',
      href: '/'
    },
    {
      name: locale === 'fr' ? 'Services' : locale === 'en' ? 'Services' : locale === 'ar' ? 'الخدمات' : 'Services',
      href: '/services'
    },
    {
      name: locale === 'fr' ? 'Portfolio' : locale === 'en' ? 'Portfolio' : locale === 'ar' ? 'المعرض' : 'Portfolio',
      href: '/portfolio'
    },
    {
      name: locale === 'fr' ? 'À propos' : locale === 'en' ? 'About' : locale === 'ar' ? 'حولنا' : 'About',
      href: '/about'
    },
    {
      name: locale === 'fr' ? 'Contact' : locale === 'en' ? 'Contact' : locale === 'ar' ? 'اتصل بنا' : 'Contact',
      href: '/contact'
    }
  ];

  return (
    <header className={`bg-white shadow-sm border-b ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                Loft Algérie
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Status and App Access */}
          <div className="hidden md:flex items-center space-x-4">
            <AuthStatus locale={locale} />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t">
                <AuthStatus locale={locale} className="px-3" />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}