"use client"

import { LanguageSelector } from "@/components/ui/language-selector"
import { UserAvatarDropdown } from "@/components/auth/user-avatar-dropdown"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/layout/notification-bell"
import { useLocale } from "next-intl"
import Image from "next/image"

export function DesktopHeader() {
  const locale = useLocale()
  return (
    <header className="hidden md:flex h-16 items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 shadow-sm sticky top-0 z-50">
      {/* Left side - Logo */}
      <div className="flex items-center">
        <Image 
          src="/logo.jpg" 
          alt="Loft Algérie" 
          width={230} 
          height={80} 
          priority
          className="w-auto object-contain"
          style={{ maxHeight: '65px', height: '65px' }}
        />
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Notifications bell dropdown */}
        <NotificationBell />

        {/* Language and Theme Controls */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1 border border-gray-200 dark:border-gray-700">
          <LanguageSelector showText={true} />
          <ThemeToggle variant="ghost" size="sm" className="h-8 w-8" />
        </div>
        
        {/* User Avatar with Dropdown */}
        <UserAvatarDropdown locale={locale} />
      </div>
    </header>
  )
}