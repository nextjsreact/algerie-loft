"use client"

import { LanguageSelector } from "@/components/ui/language-selector"
import { UserAvatarDropdown } from "@/components/auth/user-avatar-dropdown"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { useLocale } from "next-intl"
import Link from "next/link"
import { useNotifications } from "@/components/providers/notification-context"

export function DesktopHeader() {
  const locale = useLocale()
  const { unreadCount } = useNotifications()

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
        {/* Notifications bell — links to notifications page */}
        <Link
          href={`/${locale}/notifications`}
          className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Notifications"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

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