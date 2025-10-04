"use client"

import { 
  Building2, Calendar, DollarSign, Home, LogOut, Settings, Users, 
  ClipboardList, UserCheck, ChevronDown, ChevronRight, LayoutDashboard, CreditCard, MessageSquare, Bell, CalendarCheck, Shield
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/types"
import { logout } from "@/lib/auth"
import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSelector } from "@/components/ui/language-selector"
import { NotificationBadge } from "@/components/ui/notification-badge"
import { useEnhancedRealtime } from "@/components/providers/enhanced-realtime-provider"
import { useNotifications } from "@/components/providers/notification-context"
import { useTranslations, useLocale } from "next-intl"

interface EnhancedSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  user: User;
  unreadCount: number | null;
}

export function EnhancedSidebar({ user, unreadCount, className }: EnhancedSidebarProps) {
  const pathname = usePathname()
  const [isSettingsOpen, setIsSettingsOpen] = useState(pathname?.startsWith('/settings') || false)
  const { unreadMessagesCount } = useEnhancedRealtime()
  const { unreadCount: realtimeUnreadCount } = useNotifications()
  const locale = useLocale()
  const t = useTranslations('nav')
  const tRoles = useTranslations('roles')
  const tAuth = useTranslations('auth')

  const navigation = [
    { name: t('executive'), href: `/${locale}/executive`, icon: LayoutDashboard, roles: ["executive"], className: "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold" },
    { name: t('dashboard'), href: `/${locale}/dashboard`, icon: LayoutDashboard, roles: ["admin", "manager", "member"] },
    { name: 'Login', href: `/${locale}/login`, icon: LogOut, roles: ['guest'] },
    { name: 'Register', href: `/${locale}/register`, icon: UserCheck, roles: ['guest'] },
    { name: t('conversations'), href: `/${locale}/conversations`, icon: MessageSquare, roles: ["admin", "manager", "member", "executive"] },
    { name: t('notifications'), href: `/${locale}/notifications`, icon: Bell, roles: ["admin", "manager", "member"] },
    { name: t('lofts'), href: `/${locale}/lofts`, icon: Building2, roles: ["admin", "manager"] },
    { name: t('reservations'), href: `/${locale}/reservations`, icon: Calendar, roles: ["admin", "manager"] },
    { name: t('availability'), href: `/${locale}/availability`, icon: CalendarCheck, roles: ["admin", "manager"] },
    { name: t('tasks'), href: `/${locale}/tasks`, icon: ClipboardList, roles: ["admin", "manager", "member"] },
    { name: t('teams'), href: `/${locale}/teams`, icon: Users, roles: ["admin", "manager"] },
    { name: t('owners'), href: `/${locale}/owners`, icon: UserCheck, roles: ["admin"] },
    { name: t('transactions'), href: `/${locale}/transactions`, icon: DollarSign, roles: ["admin", "manager"] },
    { name: t('reports'), href: `/${locale}/reports`, icon: Calendar, roles: ["admin", "manager", "executive"] },
    { 
      name: t('settings'), 
      href: `/${locale}/settings`, 
      icon: Settings, 
      roles: ["admin", "manager"],
      subItems: [
        { name: t('categories'), href: `/${locale}/settings/categories`, icon: ClipboardList, roles: ["admin"] },
        { name: t('currencies'), href: `/${locale}/settings/currencies`, icon: DollarSign, roles: ["admin"] },
        { name: t('zoneAreas'), href: `/${locale}/settings/zone-areas`, icon: Home, roles: ["admin"] },
        { name: t('paymentMethods'), href: `/${locale}/settings/payment-methods`, icon: CreditCard, roles: ["admin"] },
        { name: t('internetConnections'), href: `/${locale}/settings/internet-connections`, icon: Building2, roles: ["admin"] },
        { name: 'Audit', href: `/${locale}/settings/audit`, icon: Shield, roles: ["admin", "manager"] },
        { name: t('application'), href: `/${locale}/settings/application`, icon: Settings, roles: ["admin"] }
      ]
    },
  ]

  const filteredNavigation = user.role === 'guest' 
    ? navigation.filter(item => item.roles.includes('guest'))
    : navigation.filter((item) => item.roles.includes(user.role))

  return (
    <div className={cn("flex h-full w-72 flex-col bg-gray-900 dark:bg-gray-900", className)}>
      <div className="flex h-16 shrink-0 items-center justify-between px-3 border-b border-gray-700 dark:border-gray-700">
        <Link href={`/${locale}/dashboard`} className="flex items-center group min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <Building2 className="h-7 w-7 text-white transition-transform group-hover:scale-110" />
            <div className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-gray-900 bg-blue-500"></div>
          </div>
          <span className="ml-2 text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 truncate">
            {t('loftManager')}
          </span>
        </Link>
        <div className="flex items-center bg-gray-700/50 dark:bg-gray-800 rounded-md p-0.5 gap-0.5 flex-shrink-0">
          <LanguageSelector />
          <ThemeToggle variant="ghost" size="sm" className="text-white hover:text-white h-8 w-8" />
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || 
                         (item.subItems && item.subItems.some(sub => pathname === sub.href))

          if (item.subItems) {
            return (
              <Collapsible 
                key={item.name as string}
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                className="space-y-1"
              >
                <CollapsibleTrigger className={cn(
                  "w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md",
                  isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )}>
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </div>
                  {isSettingsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-8 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.name as string}
                      href={subItem.href}
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                        pathname === subItem.href ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
                      )}
                    >
                      <subItem.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {subItem.name}
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )
          }

          return (
            <Link
              key={item.name as string}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md",
                isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
                item.className
              )}
            >
              <div className="flex items-center">
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </div>
              
              {item.href === `/${locale}/conversations` && unreadMessagesCount > 0 && (
                <NotificationBadge count={unreadMessagesCount} className="ml-2" />
              )}
              {item.href === `/${locale}/notifications` && realtimeUnreadCount > 0 && (
                <NotificationBadge count={realtimeUnreadCount} className="ml-2 animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="flex-shrink-0 p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{(user.full_name || '').charAt(0).toUpperCase()}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-gray-900 bg-green-500"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.full_name === 'member1' ? t('conversations.member1') : user.full_name}
            </p>
            <p className="text-xs text-gray-300 capitalize">{tRoles(user.role)}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {tAuth('signOut')}
        </Button>
      </div>
    </div>
  )
}