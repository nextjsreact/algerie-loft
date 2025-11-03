"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator
} from "@/components/ui/sidebar"
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  BarChart3, 
  FileText,
  User,
  LogOut,
  Menu,
  Bell,
  Settings
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSelector } from "@/components/language-selector"
import type { User as UserType, PartnerProfile } from "@/lib/types"

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  isActive?: boolean
}

interface PartnerDashboardLayoutProps {
  children: React.ReactNode
  partner: PartnerProfile & { user: UserType }
  sidebarItems?: SidebarItem[]
}

const defaultSidebarItems: SidebarItem[] = [
  {
    name: 'Dashboard',
    href: '/partner/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Properties',
    href: '/partner/properties',
    icon: Building2,
  },
  {
    name: 'Reservations',
    href: '/partner/reservations',
    icon: Calendar,
  },
  {
    name: 'Analytics',
    href: '/partner/analytics',
    icon: BarChart3,
  },
  {
    name: 'Reports',
    href: '/partner/reports',
    icon: FileText,
  },
]

export function PartnerDashboardLayout({ 
  children, 
  partner, 
  sidebarItems = defaultSidebarItems 
}: PartnerDashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  // Update active state for sidebar items
  const updatedSidebarItems = sidebarItems.map(item => ({
    ...item,
    isActive: pathname === item.href
  }))

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      // Call logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      
      if (response.ok) {
        router.push('/partner/login')
      } else {
        console.error('Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPartnerInitials = () => {
    const name = partner.business_name || partner.user.full_name || partner.user.email
    if (!name) return 'P'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getVerificationStatusBadge = () => {
    switch (partner.verification_status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar */}
        <Sidebar className="border-r">
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={partner.user.avatar_url || undefined} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {getPartnerInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {partner.business_name || partner.user.full_name || 'Partner'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {getVerificationStatusBadge()}
                </div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-4">
            <SidebarMenu>
              {updatedSidebarItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={item.isActive}
                    className="w-full"
                  >
                    <Link href={item.href} className="flex items-center gap-3 px-3 py-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            <SidebarSeparator className="my-4" />

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/partner/profile" className="flex items-center gap-3 px-3 py-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/partner/settings" className="flex items-center gap-3 px-3 py-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
              disabled={isLoading}
            >
              <LogOut className="h-4 w-4 mr-3" />
              {isLoading ? 'Logging out...' : 'Logout'}
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <SidebarInset className="flex-1">
          {/* Mobile Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={partner.user.avatar_url || undefined} />
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {getPartnerInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {partner.business_name || partner.user.full_name || 'Partner'}
                    </span>
                    {getVerificationStatusBadge()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <LanguageSelector />
                <ThemeToggle />
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Desktop Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:block">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold">Partner Dashboard</h1>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <LanguageSelector />
                <ThemeToggle />
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-3 pl-4 border-l">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={partner.user.avatar_url || undefined} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getPartnerInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {partner.business_name || partner.user.full_name || 'Partner'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {partner.user.email}
                    </span>
                  </div>
                  {getVerificationStatusBadge()}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}