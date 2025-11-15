"use client"

import { LanguageSelector } from "@/components/ui/language-selector"
import { UserAvatarDropdown } from "@/components/auth/user-avatar-dropdown"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { useLocale } from "next-intl"

export function DesktopHeader() {
  const locale = useLocale()

  return (
    <header className="hidden md:flex h-16 items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 shadow-sm fixed top-0 left-0 right-0 z-50">
      {/* Left side - Logo with more padding */}
      <div className="flex items-center pl-16">
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
        {/* Notifications */}
        <button
          onClick={() => alert('Notifications à venir !')}
          className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Notifications"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

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