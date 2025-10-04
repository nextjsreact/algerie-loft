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
import { useTranslations, useLocale, useMessages } from "next-intl"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  user: User;
  unreadCount: number | null;
}

export function Sidebar({ user, unreadCount, className }: SidebarProps) {
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
    { name: t('conversations'), href: `/${locale}/conversations`, icon: MessageSquare, roles: ["admin", "manager", "member", "executive"] },
    { name: t('notifications'), href: `/${locale}/notifications`, icon: Bell, roles: ["admin", "manager", "member"] },
    { name: t('lofts'), href: `/${locale}/lofts`, icon: Building2, roles: ["admin", "manager", "member"] },
    { name: t('customers'), href: `/${locale}/customers`, icon: Users, roles: ["admin", "manager"] },
    { name: t('reservations'), href: `/${locale}/reservations`, icon: Calendar, roles: ["admin", "manager"] },
    { name: t('availability'), href: `/${locale}/availability`, icon: CalendarCheck, roles: ["admin", "manager"] },
    { name: t('tasks'), href: `/${locale}/tasks`, icon: ClipboardList, roles: ["admin", "manager", "member"] },
    { name: t('teams'), href: `/${locale}/teams`, icon: Users, roles: ["admin", "manager"] },
    { name: t('owners'), href: `/${locale}/owners`, icon: UserCheck, roles: ["admin"] },
    { name: t('transactions'), href: `/${locale}/transactions`, icon: DollarSign, roles: ["admin", "manager"] },
    { name: t('reportsNav'), href: `/${locale}/reports`, icon: Calendar, roles: ["admin", "manager", "executive"] },
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

  const filteredNavigation = navigation.filter((item) => item.roles.includes(user.role))

  return (
     <div className={cn("flex h-full w-full max-w-72 flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 backdrop-blur-xl border-r border-white/10", className)}>
      <div className="flex h-16 shrink-0 items-center justify-between px-3 border-b border-white/20 bg-white/5 backdrop-blur-md">
        <Link href={`/${locale}/dashboard`} className="flex items-center group min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <div className="p-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg group-hover:shadow-cyan-500/25 transition-all duration-300 group-hover:scale-110">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-indigo-900 bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse"></div>
          </div>
          <span className="ml-2 text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 truncate group-hover:from-cyan-200 group-hover:to-pink-200 transition-all duration-300">
            {t('loftManager')}
          </span>
        </Link>
        <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl p-1 gap-1 flex-shrink-0 border border-white/20">
          <LanguageSelector />
          <ThemeToggle variant="ghost" size="sm" className="text-white hover:text-cyan-300 h-8 w-8 hover:bg-white/10 transition-all duration-300" />
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto">
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
                  "w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-[1.02]",
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border-cyan-400/30 shadow-lg shadow-cyan-500/10"
                    : "text-gray-200 hover:bg-white/10 hover:text-white border-white/10 hover:border-white/20"
                )}>
                  <div className="flex items-center">
                    <div className={cn(
                      "p-2 rounded-lg mr-3 transition-all duration-300",
                      isActive
                        ? "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25"
                        : "bg-white/10 group-hover:bg-white/20"
                    )}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                    </div>
                    {item.name}
                  </div>
                  {isSettingsOpen ? (
                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-12 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.name as string}
                      href={subItem.href}
                      className={cn(
                        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-[1.02]",
                        pathname === subItem.href
                          ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border-l-2 border-emerald-400"
                          : "text-gray-300 hover:bg-white/10 hover:text-white hover:border-l-2 hover:border-white/30",
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-md mr-3 transition-all duration-300",
                        pathname === subItem.href
                          ? "bg-gradient-to-r from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25"
                          : "bg-white/10 group-hover:bg-white/20"
                      )}>
                        <subItem.icon className="h-3.5 w-3.5 flex-shrink-0" />
                      </div>
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
                "group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border-cyan-400/30 shadow-lg shadow-cyan-500/10"
                  : "text-gray-200 hover:bg-white/10 hover:text-white border-white/10 hover:border-white/20",
                item.className
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center relative z-10">
                <div className={cn(
                  "p-2 rounded-lg mr-3 transition-all duration-300",
                  isActive
                    ? "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25"
                    : "bg-white/10 group-hover:bg-white/20"
                )}>
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                </div>
                {item.name}
              </div>
              
              <div className="flex items-center gap-2 relative z-10">
                {item.href === `/${locale}/conversations` && unreadMessagesCount > 0 && (
                  <NotificationBadge count={unreadMessagesCount} className="bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg shadow-pink-500/25 animate-bounce" />
                )}
                {item.href === `/${locale}/notifications` && realtimeUnreadCount > 0 && (
                  <NotificationBadge count={realtimeUnreadCount} className="bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/25 animate-pulse" />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="flex-shrink-0 p-4 border-t border-white/20 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-cyan-500/10">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/30 transition-all duration-300">
              <span className="text-sm font-bold text-white">{(user.full_name || '').charAt(0).toUpperCase()}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-indigo-900 bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse shadow-lg shadow-green-500/25"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.full_name === 'member1' ? t('conversations.member1') : user.full_name}
            </p>
            <p className="text-xs text-cyan-200 capitalize font-medium">{tRoles(user.role)}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start text-gray-200 hover:text-white hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 transition-all duration-300 rounded-xl border border-white/10 hover:border-red-400/30 hover:shadow-lg hover:shadow-red-500/10"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {tAuth('signOut')}
        </Button>
      </div>
    </div>
  )
}