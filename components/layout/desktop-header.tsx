"use client"

import { LanguageSelector } from "@/components/ui/language-selector"
import { UserAvatarDropdown } from "@/components/auth/user-avatar-dropdown"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLocale } from "next-intl"

export function DesktopHeader() {
  const locale = useLocale()

  return (
    <header className="hidden md:flex h-16 items-center justify-end bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 shadow-sm">
      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Language and Theme Controls */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1 border border-gray-200 dark:border-gray-700">
          <LanguageSelector showText={true} />
          <ThemeToggle variant="ghost" size="sm" className="h-8 w-8" />
        </div>
        
        {/* User Avatar with Dropdown (includes logout) */}
        <UserAvatarDropdown locale={locale} />
      </div>
    </header>
  )
}