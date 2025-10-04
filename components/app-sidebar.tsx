"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import type { AuthSession } from "@/lib/types"
import {
  Building2,
  Calendar,
  ClipboardList,
  Users,
  DollarSign,
  BarChart3,
  MessageSquare,
  Bell,
  Settings,
  Home,
  UserCircle,
  LogOut,
  ChevronUp,
  User2
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { logout } from "@/lib/auth"
import { useRouter } from "next/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('navigation')
  const router = useRouter()
  const [session, setSession] = React.useState<AuthSession | null>(null)

  React.useEffect(() => {
    async function fetchSession() {
      try {
        const sessionData = await getSession()
        setSession(sessionData)
      } catch (error) {
        console.error('Failed to fetch session:', error)
      }
    }
    fetchSession()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push(`/${locale}/login`)
    } catch (error) {
      console.error("Erreur déconnexion:", error)
    }
  }

  // Navigation items based on user role
  const getNavigationItems = (userRole: string) => {
    const allItems = [
      {
        title: t("dashboard"),
        url: `/${locale}`,
        icon: Home,
        roles: ["admin", "manager", "executive", "member"]
      },
      {
        title: t("lofts"),
        url: `/${locale}/lofts`,
        icon: Building2,
        roles: ["admin", "manager", "executive", "member"]
      },
      {
        title: t("tasks"),
        url: `/${locale}/tasks`,
        icon: ClipboardList,
        roles: ["admin", "manager", "executive", "member"]
      },
      {
        title: t("reservations"),
        url: `/${locale}/reservations`,
        icon: Calendar,
        roles: ["admin", "manager", "executive"]
      },
      {
        title: t("transactions"),
        url: `/${locale}/transactions`,
        icon: DollarSign,
        roles: ["admin", "manager", "executive"]
      },
      {
        title: t("reports"),
        url: `/${locale}/reports`,
        icon: BarChart3,
        roles: ["admin", "manager", "executive"]
      },
      {
        title: t("teams"),
        url: `/${locale}/teams`,
        icon: Users,
        roles: ["admin", "manager"]
      },
      {
        title: t("customers"),
        url: `/${locale}/customers`,
        icon: UserCircle,
        roles: ["admin", "manager", "executive"]
      },
      {
        title: t("conversations"),
        url: `/${locale}/conversations`,
        icon: MessageSquare,
        roles: ["admin", "manager", "executive", "member"]
      },
      {
        title: t("notifications"),
        url: `/${locale}/notifications`,
        icon: Bell,
        roles: ["admin", "manager", "executive", "member"]
      },
      {
        title: t("settings"),
        url: `/${locale}/settings`,
        icon: Settings,
        roles: ["admin", "manager", "executive", "member"]
      }
    ]

    return allItems.filter(item => item.roles.includes(userRole))
  }

  const navigationItems = session ? getNavigationItems(session.user.role) : []

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={`/${locale}`}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">LoftManager</span>
                  <span className="truncate text-xs">Gestion d'appartements</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {session?.user.full_name?.charAt(0) || session?.user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {session?.user.full_name || session?.user.email || 'Utilisateur'}
                    </span>
                    <span className="truncate text-xs capitalize">
                      {session?.user.role || 'member'}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/settings`}>
                    <Settings />
                    Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
