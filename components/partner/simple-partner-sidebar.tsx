"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  Settings,
  DollarSign,
} from 'lucide-react'

interface SimplePartnerSidebarProps {
  locale: string
  userProfile?: {
    name: string
    email: string
    avatar?: string
  }
}

export function SimplePartnerSidebar({ locale, userProfile }: SimplePartnerSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('partner.navigation')
  const brandingT = useTranslations('partner.branding')

  const navigationItems = [
    {
      name: 'dashboard',
      translationKey: 'dashboard',
      href: `/${locale}/partner/dashboard`,
      icon: LayoutDashboard,
    },
    {
      name: 'properties',
      translationKey: 'properties',
      href: `/${locale}/partner/properties`,
      icon: Building2,
    },
    {
      name: 'bookings',
      translationKey: 'bookings',
      href: `/${locale}/partner/bookings`,
      icon: Calendar,
    },
    {
      name: 'revenue',
      translationKey: 'revenue',
      href: `/${locale}/partner/revenue`,
      icon: DollarSign,
    },
    {
      name: 'analytics',
      translationKey: 'analytics',
      href: `/${locale}/partner/analytics`,
      icon: BarChart3,
    },
    {
      name: 'messages',
      translationKey: 'messages',
      href: `/${locale}/partner/messages`,
      icon: MessageSquare,
    },
    {
      name: 'settings',
      translationKey: 'settings',
      href: `/${locale}/partner/settings`,
      icon: Settings,
    },
  ]

  return (
    <aside 
      className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen sticky top-0 flex-shrink-0 z-50"
      data-sidebar="partner-sidebar"
      style={{ minWidth: '16rem', maxWidth: '16rem' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          {brandingT('title')}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {brandingT('subtitle')}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{t(item.translationKey)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
