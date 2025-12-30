"use client"

import { 
  Building2, Calendar, DollarSign, Home, LogOut, Settings, Users, 
  ClipboardList, UserCheck, ChevronDown, ChevronRight, LayoutDashboard, CreditCard, MessageSquare, Bell, Search
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/types"
import { logout } from "@/lib/auth"
import { useState, useEffect } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBadge } from "@/components/ui/notification-badge"
import { useEnhancedRealtime } from "@/components/providers/enhanced-realtime-provider"
import { useTranslations } from "next-intl"

interface EnhancedSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  user: User;
  unreadCount: number | null;
}

export function EnhancedSidebar({ user, unreadCount, className }: EnhancedSidebarProps) {
  const pathname = usePathname()
  const [isSettingsOpen, setIsSettingsOpen] = useState(pathname?.startsWith('/settings') || false)
  const { unreadMessagesCount, unreadNotificationsCount, playSound } = useEnhancedRealtime()
  const t = useTranslations('nav')
  const tRoles = useTranslations('roles')
  const tAuth = useTranslations('auth')
  const tConversations = useTranslations('conversations')

  useEffect(() => {
    const handleNotificationReceived = (event: CustomEvent) => {
      playSound(event.detail.type)
    }

    window.addEventListener('notification-received', handleNotificationReceived as EventListener)
    
    return () => {
      window.removeEventListener('notification-received', handleNotificationReceived as EventListener)
    }
  }, [playSound])

  const navigation = [
    { name: t('dashboard'), href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "member"] },
    { name: t('conversations'), href: "/conversations", icon: MessageSquare, roles: ["admin", "manager", "member", "executive"] },
    { name: t('notifications'), href: "/notifications", icon: Bell, roles: ["admin", "manager", "member"] },
    { name: t('lofts'), href: "/lofts", icon: Building2, roles: ["admin", "manager"] },
    { name: t('tasks'), href: "/tasks", icon: ClipboardList, roles: ["admin", "manager", "member"] },
    { name: t('teams'), href: "/teams", icon: Users, roles: ["admin", "manager"] },
    { name: t('owners'), href: "/owners", icon: UserCheck, roles: ["admin"] },
    { name: t('transactions'), href: "/transactions", icon: DollarSign, roles: ["admin", "manager"] },
    { name: t('reports'), href: "/reports", icon: Calendar, roles: ["admin", "manager", "executive"] },
    { name: t('availability'), href: "/availability", icon: Search, roles: ["admin", "manager", "member"] },
    { 
      name: t('settings'), 
      href: "/settings", 
      icon: Settings, 
      roles: ["admin", "manager", "member"],
      subItems: [
        { name: t('categories'), href: "/settings/categories", icon: ClipboardList, roles: ["admin"] },
        { name: t('currencies'), href: "/settings/currencies", icon: DollarSign, roles: ["admin"] },
        { name: t('zoneAreas'), href: "/settings/zone-areas", icon: Home, roles: ["admin"] },
        { name: t('paymentMethods'), href: "/settings/payment-methods", icon: CreditCard, roles: ["admin"] },
        { name: t('internetConnections'), href: "/settings/internet-connections", icon: Building2, roles: ["admin"] },
        { name: t('application'), href: "/settings/application", icon: Settings, roles: ["admin"] }
      ]
    },
  ]

  const filteredNavigation = navigation.filter((item) => item.roles.includes(user.role))

  return (
    <div className={cn("flex h-full w-64 flex-col bg-gray-900", className)}>
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-gray-700">
        <Link href="/dashboard" className="flex items-center group">
          <div className="relative">
            <Building2 className="h-8 w-8 text-white transition-transform group-hover:scale-110" />
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-gray-900 bg-blue-500"></div>
          </div>
          <span className="ml-3 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            {tConversations('loftManager')}
          </span>
        </Link>
        <div className="hover:bg-gray-800/50 transition-colors rounded-md">
          <ThemeToggle />
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
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
              )}
            >
              <div className="flex items-center">
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </div>
              
              {item.name === t('conversations') && unreadMessagesCount > 0 && (
                <NotificationBadge 
                  count={unreadMessagesCount} 
                  className="ml-2 animate-pulse" 
                />
              )}
              {item.name === t('notifications') && unreadNotificationsCount > 0 && (
                <NotificationBadge 
                  count={unreadNotificationsCount} 
                  className="ml-2 animate-pulse" 
                />
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