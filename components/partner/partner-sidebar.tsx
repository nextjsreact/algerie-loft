"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  Settings,
  LogOut,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/auth'

const navigation = [
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
    name: 'Bookings',
    href: '/partner/bookings',
    icon: Calendar,
  },
  {
    name: 'Messages',
    href: '/partner/messages',
    icon: MessageSquare,
  },
  {
    name: 'Analytics',
    href: '/partner/analytics',
    icon: BarChart3,
  },
  {
    name: 'Profile',
    href: '/partner/profile',
    icon: User,
  },
  {
    name: 'Settings',
    href: '/partner/settings',
    icon: Settings,
  },
]

export function PartnerSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">Partner Portal</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </form>
      </div>
    </div>
  )
}