"use client"

import { Building2 } from "lucide-react"
import Link from "next/link"
import { LanguageSelector } from "@/components/ui/language-selector"
import { UserAvatarDropdown } from "@/components/auth/user-avatar-dropdown"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTranslations, useLocale } from "next-intl"

export function DesktopHeader() {
  const locale = useLocale()
  const t = useTranslations('nav')

  return (
    <header className="hidden md:flex h-16 items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 shadow-sm">
      {/* Logo and Brand */}
      <Link href={`/${locale}`} className="flex items-center group">
        <div className="relative">
          <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-105">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse"></div>
        </div>
        <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
          {t('loftManager')}
        </span>
      </Link>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* Controls group */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1 border border-gray-200 dark:border-gray-700">
          <LanguageSelector />
          <ThemeToggle variant="ghost" size="sm" className="h-8 w-8" />
        </div>
        
        {/* User Avatar */}
        <UserAvatarDropdown locale={locale} />
      </div>
    </header>
  )
}