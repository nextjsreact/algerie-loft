"use client"

import { 
  Building2, Shield, Users, Database, Settings, LogOut, 
  LayoutDashboard, Activity, Archive, Wrench, AlertTriangle, Lock
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { logout } from "@/lib/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSelector } from "@/components/ui/language-selector"
import { useTranslations, useLocale } from "next-intl"

interface SuperuserSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
}

export function SuperuserSidebar({ className }: SuperuserSidebarProps) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('superuser')

  const navigation = [
    { name: t('navigation.dashboard'), href: `/admin/superuser/dashboard`, icon: LayoutDashboard },
    { name: t('navigation.userManagement'), href: `/admin/superuser/users`, icon: Users },
    { name: t('navigation.security'), href: `/admin/superuser/audit`, icon: Shield },
    { name: t('navigation.backup'), href: `/admin/superuser/backup`, icon: Database },
    { name: t('navigation.maintenance'), href: `/admin/superuser/maintenance`, icon: Wrench },
    { name: t('navigation.configuration'), href: `/admin/superuser/config`, icon: Settings },
    { name: t('navigation.monitoring'), href: `/admin/superuser/monitoring`, icon: Activity },
    { name: t('navigation.archives'), href: `/admin/superuser/archives`, icon: Archive },
  ]

  const emergencyActions = [
    { name: t('navigation.emergencyLockdown'), href: `/admin/superuser/emergency/lockdown`, icon: Lock },
    { name: t('navigation.emergencyAlerts'), href: `/admin/superuser/emergency/alerts`, icon: AlertTriangle },
  ]

  return (
    <div className={cn("flex h-full w-full max-w-72 flex-col bg-gradient-to-br from-red-900 via-red-800 to-orange-900 backdrop-blur-xl border-r border-white/10", className)}>
      <div className="flex h-16 shrink-0 items-center justify-between px-3 border-b border-white/20 bg-white/5 backdrop-blur-md">
        <Link href={`/admin/superuser/dashboard`} className="flex items-center group min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <div className="p-1.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 shadow-lg group-hover:shadow-red-500/25 transition-all duration-300 group-hover:scale-110">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-red-900 bg-gradient-to-r from-yellow-400 to-red-500 animate-pulse"></div>
          </div>
          <span className="ml-2 text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-orange-300 to-yellow-300 truncate group-hover:from-red-200 group-hover:to-yellow-200 transition-all duration-300">
            {t('navigation.title')}
          </span>
        </Link>
        <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl p-1 gap-1 flex-shrink-0 border border-white/20">
          <LanguageSelector />
          <ThemeToggle variant="ghost" size="sm" className="text-white hover:text-red-300 h-8 w-8 hover:bg-white/10 transition-all duration-300" />
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105",
                isActive
                  ? "bg-gradient-to-r from-white/20 to-white/10 text-white shadow-lg backdrop-blur-md border border-white/20"
                  : "text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5 transition-colors duration-300",
                isActive ? "text-white" : "text-white/70 group-hover:text-white"
              )} />
              {item.name}
            </Link>
          )
        })}

        {/* Emergency Actions Section */}
        <div className="mt-8 pt-4 border-t border-white/20">
          <h3 className="px-3 text-xs font-semibold text-red-300 uppercase tracking-wider mb-3">
            {t('navigation.emergency')}
          </h3>
          
          {emergencyActions.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105",
                  isActive
                    ? "bg-gradient-to-r from-red-500/30 to-orange-500/20 text-white shadow-lg backdrop-blur-md border border-red-400/30"
                    : "text-red-200 hover:text-white hover:bg-red-500/20 backdrop-blur-sm"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 transition-colors duration-300",
                  isActive ? "text-white" : "text-red-300 group-hover:text-white"
                )} />
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 pt-4 border-t border-white/20">
          <h3 className="px-3 text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
            {t('stats.quickStats')}
          </h3>
          
          <div className="space-y-2 px-3">
            <div className="flex justify-between items-center text-xs bg-white/5 backdrop-blur-md rounded-lg p-2 border border-white/10">
              <span className="text-white/80">{t('stats.activeUsers')}</span>
              <span className="text-white font-semibold bg-gradient-to-r from-green-400 to-emerald-500 px-2 py-0.5 rounded-full text-xs">247</span>
            </div>
            <div className="flex justify-between items-center text-xs bg-white/5 backdrop-blur-md rounded-lg p-2 border border-white/10">
              <span className="text-white/80">{t('stats.openSessions')}</span>
              <span className="text-white font-semibold bg-gradient-to-r from-blue-400 to-cyan-500 px-2 py-0.5 rounded-full text-xs">89</span>
            </div>
            <div className="flex justify-between items-center text-xs bg-white/5 backdrop-blur-md rounded-lg p-2 border border-white/10">
              <span className="text-white/80">{t('stats.lastBackup')}</span>
              <span className="text-white font-semibold bg-gradient-to-r from-green-400 to-emerald-500 px-2 py-0.5 rounded-full text-xs">2h</span>
            </div>
          </div>
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-white/20 bg-white/5 backdrop-blur-md">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="ml-3 flex-1">
            <div className="text-sm font-medium text-white">{t('user.profile')}</div>
            <div className="text-xs text-white/70">{t('user.access')}</div>
          </div>
          <div className="text-xs bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 rounded-full font-semibold">
            ADMIN
          </div>
        </div>
        
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('user.logout')}
          </Button>
        </form>
      </div>
    </div>
  )
}