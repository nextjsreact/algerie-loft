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
  LogOut,
  User,
  DollarSign,
  ChevronDown
} from 'lucide-react'
import { logout } from '@/lib/auth'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PartnerSidebarProps {
  locale: string
  userProfile?: {
    name: string
    email: string
    avatar?: string
  }
}

interface NavigationItem {
  name: string
  translationKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export function PartnerSidebar({ locale, userProfile }: PartnerSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('partner.navigation')
  const brandingT = useTranslations('partner.branding')

  const navigationItems: NavigationItem[] = [
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

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar collapsible="offcanvas" aria-label="Partner navigation sidebar">
      {/* Header with branding */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex flex-col gap-1 px-2 py-3" role="banner">
          <h1 className="text-lg font-bold text-sidebar-foreground">
            {brandingT('title')}
          </h1>
          <p className="text-xs text-sidebar-foreground/70">
            {brandingT('subtitle')}
          </p>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <nav aria-label="Main navigation">
          <SidebarMenu>
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={t(item.translationKey)}
                  >
                    <Link 
                      href={item.href}
                      aria-label={t(item.translationKey)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      <span>{t(item.translationKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </nav>
      </SidebarContent>

      {/* Footer removed - User profile/logout now in header only */}
    </Sidebar>
  )
}