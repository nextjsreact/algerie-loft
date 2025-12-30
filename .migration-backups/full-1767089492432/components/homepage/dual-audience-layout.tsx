'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { Locale } from '@/i18n'
import { isRTL, getRTLClasses } from '@/lib/rtl'
import { LanguageSelector } from '@/components/language-selector'
import { CurrencySelector } from '@/components/currency-selector'
import { useContextRestoration } from '@/hooks/use-context-restoration'

interface DualAudienceLayoutProps {
  children: React.ReactNode
  className?: string
}

/**
 * Main layout component for dual-audience homepage with multilingual and currency support
 */
export function DualAudienceLayout({ children, className = '' }: DualAudienceLayoutProps) {
  const locale = useLocale() as Locale
  const { isRestored, currency, updateCurrency } = useContextRestoration()
  
  const isCurrentRTL = isRTL(locale)
  const rtlClasses = getRTLClasses(locale)

  return (
    <div 
      className={`min-h-screen ${rtlClasses} ${className}`}
      dir={isCurrentRTL ? 'rtl' : 'ltr'}
    >
      {/* Header with language and currency selectors */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4">
          <div className={`flex items-center justify-between h-16 ${isCurrentRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold">
                {locale === 'ar' ? 'لوفت الجزائر' : 'Loft Algérie'}
              </h1>
            </div>

            {/* Language and Currency Selectors */}
            <div className={`flex items-center gap-2 ${isCurrentRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              <CurrencySelector 
                value={currency}
                onChange={updateCurrency}
              />
              <LanguageSelector />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {isRestored ? children : (
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  {locale === 'ar' ? 'جاري التحميل...' : 
                   locale === 'fr' ? 'Chargement...' : 
                   'Loading...'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className={`text-center text-sm text-muted-foreground ${isCurrentRTL ? 'text-right' : 'text-left'}`}>
            <p>
              {locale === 'ar' ? '© 2024 لوفت الجزائر. جميع الحقوق محفوظة.' :
               locale === 'fr' ? '© 2024 Loft Algérie. Tous droits réservés.' :
               '© 2024 Loft Algeria. All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/**
 * Section wrapper component with RTL support
 */
interface SectionProps {
  children: React.ReactNode
  className?: string
  id?: string
}

export function Section({ children, className = '', id }: SectionProps) {
  const locale = useLocale() as Locale
  const isCurrentRTL = isRTL(locale)

  return (
    <section 
      id={id}
      className={`py-12 ${isCurrentRTL ? 'text-right' : 'text-left'} ${className}`}
    >
      <div className="container mx-auto px-4">
        {children}
      </div>
    </section>
  )
}

/**
 * Grid component with RTL support
 */
interface GridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function Grid({ children, columns = 3, className = '' }: GridProps) {
  const locale = useLocale() as Locale
  const isCurrentRTL = isRTL(locale)

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div 
      className={`grid gap-6 ${gridClasses[columns]} ${isCurrentRTL ? 'text-right' : 'text-left'} ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * Card component with RTL support
 */
interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  const locale = useLocale() as Locale
  const isCurrentRTL = isRTL(locale)

  return (
    <div 
      className={`bg-card text-card-foreground rounded-lg border shadow-sm p-6 ${
        isCurrentRTL ? 'text-right' : 'text-left'
      } ${className}`}
    >
      {children}
    </div>
  )
}