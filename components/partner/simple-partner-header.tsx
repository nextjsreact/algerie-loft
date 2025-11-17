'use client'

import Link from 'next/link'
import { Building2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Import dynamically to avoid SSR issues
const LanguageSelector = dynamic(() => import('@/components/language-selector').then(mod => ({ default: mod.LanguageSelector })), { ssr: false })
const ThemeToggle = dynamic(() => import('@/components/theme-toggle').then(mod => ({ default: mod.ThemeToggle })), { ssr: false })

interface SimplePartnerHeaderProps {
  locale: string
}

export function SimplePartnerHeader({ locale }: SimplePartnerHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href={`/${locale}`} className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">Loft Algérie</span>
        </Link>

        <div className="flex items-center space-x-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
