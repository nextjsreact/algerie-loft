"use client"

import { Home, Building2, Calendar, Users, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLocale } from "next-intl"

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Lofts', href: '/lofts', icon: Building2 },
  { name: 'Reservations', href: '/reservations', icon: Calendar },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function SimpleSidebar() {
  const pathname = usePathname()
  const locale = useLocale()

  return (
    <div className="flex h-screen w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Loft Algérie
        </h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const href = `/${locale}${item.href}`
          const isActive = pathname === href
          
          return (
            <Link
              key={item.name}
              href={href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="ghost" className="w-full justify-start">
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}