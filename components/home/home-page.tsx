"use client"

import { useTranslations, useLocale } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleBasedAccess } from "@/components/auth/role-based-access"
import { useEffect, useState } from "react"
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
  FileText,
  CheckCircle,
  Shield
} from "lucide-react"

export function HomePage() {
  const t = useTranslations('landing.home')
  const locale = useLocale()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSession() {
      try {
        const sessionData = await getSession()
        setSession(sessionData)
      } catch (error) {
        console.error('Failed to fetch session:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Please log in to access the application.</div>
      </div>
    )
  }

  const navigationCards = [
    {
      title: t('navigationCards.lofts.title'),
      href: `/${locale}/lofts`,
      description: t('navigationCards.lofts.description'),
      color: "from-blue-500 to-blue-600",
      icon: Building2,
      allowedRoles: ['admin', 'manager', 'member'] // Members can see lofts (with restrictions)
    },
    {
      title: t('navigationCards.reservations.title'),
      href: `/${locale}/reservations`,
      description: t('navigationCards.reservations.description'),
      color: "from-green-500 to-green-600",
      icon: Calendar,
      allowedRoles: ['admin', 'manager'] // Only admin and manager
    },
    {
      title: t('navigationCards.availability.title'),
      href: `/${locale}/availability`, 
      description: t('navigationCards.availability.description'),
      color: "from-purple-500 to-purple-600",
      icon: ClipboardList,
      allowedRoles: ['admin', 'manager'] // Only admin and manager
    },
    {
      title: t('navigationCards.tasks.title'),
      href: `/${locale}/tasks`,
      description: t('navigationCards.tasks.description'), 
      color: "from-red-500 to-red-600",
      icon: CheckCircle,
      allowedRoles: ['admin', 'manager', 'member'] // Members can see their tasks
    },
    {
      title: t('navigationCards.teams.title'),
      href: `/${locale}/teams`,
      description: t('navigationCards.teams.description'),
      color: "from-orange-500 to-orange-600", 
      icon: Users,
      allowedRoles: ['admin', 'manager'] // Only admin and manager
    },
    {
      title: t('navigationCards.owners.title'),
      href: `/${locale}/owners`,
      description: t('navigationCards.owners.description'),
      color: "from-cyan-500 to-cyan-600",
      icon: Building2,
      allowedRoles: ['admin'] // Only admin
    },
    {
      title: t('navigationCards.transactions.title'),
      href: `/${locale}/transactions`, 
      description: t('navigationCards.transactions.description'),
      color: "from-emerald-500 to-emerald-600",
      icon: DollarSign,
      allowedRoles: ['admin', 'manager'] // Only admin and manager (financial)
    },
    {
      title: t('navigationCards.reports.title'),
      href: `/${locale}/reports`,
      description: t('navigationCards.reports.description'), 
      color: "from-indigo-500 to-indigo-600",
      icon: BarChart3,
      allowedRoles: ['admin', 'manager', 'executive'] // Financial reports
    }
  ]

  const quickAccessButtons = [
    {
      title: t('quickAccessButtons.dashboard.title'),
      href: `/${locale}/dashboard`,
      description: t('quickAccessButtons.dashboard.description'),
      icon: BarChart3,
      allowedRoles: ['admin', 'manager', 'member', 'executive'] // All roles
    },
    {
      title: t('quickAccessButtons.conversations.title'),
      href: `/${locale}/conversations`,
      description: t('quickAccessButtons.conversations.description'),
      icon: MessageSquare,
      allowedRoles: ['admin', 'manager', 'member', 'executive'] // All roles
    },
    {
      title: t('quickAccessButtons.notifications.title'),
      href: `/${locale}/notifications`, 
      description: t('quickAccessButtons.notifications.description'),
      icon: Bell,
      allowedRoles: ['admin', 'manager', 'member'] // Not executives
    },
    {
      title: t('quickAccessButtons.pdfReports.title'),
      href: `/${locale}/reports?tab=generator`,
      description: t('quickAccessButtons.pdfReports.description'),
      icon: FileText,
      allowedRoles: ['admin', 'manager', 'executive'] // Financial reports
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {t('title')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <Badge variant="outline" className="capitalize">
              {session.user.role} Access
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Cards Grid */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {t('mainSections')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {navigationCards.map((card, index) => (
            <RoleBasedAccess
              key={index}
              userRole={session.user.role}
              allowedRoles={card.allowedRoles}
              showFallback={false}
            >
              <a href={card.href} className="no-underline h-full">
                <Card className={`h-full bg-gradient-to-br ${card.color} text-white hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold">
                        {card.title}
                      </CardTitle>
                      <card.icon className="h-8 w-8 opacity-80" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/90 text-sm">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </a>
            </RoleBasedAccess>
          ))}
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {t('quickAccess')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickAccessButtons.map((button, index) => (
            <RoleBasedAccess
              key={index}
              userRole={session.user.role}
              allowedRoles={button.allowedRoles}
              showFallback={false}
            >
              <Button
                asChild
                variant="outline"
                className="h-20 flex-col gap-2 bg-white/80 hover:bg-white hover:shadow-md transition-all"
              >
                <a href={button.href} className="no-underline">
                  <button.icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{button.title}</span>
                </a>
              </Button>
            </RoleBasedAccess>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="max-w-7xl mx-auto">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">
                {t('systemStatus')}
              </span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {t('online')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}