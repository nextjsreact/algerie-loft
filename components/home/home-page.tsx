"use client"


import { useTranslations, useLocale } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  CheckCircle
} from "lucide-react"

export function HomePage() {
  const t = useTranslations('landing.home')
  const locale = useLocale()

  const navigationCards = [
    {
      title: t('navigationCards.lofts.title'),
      href: `/${locale}/lofts`,
      description: t('navigationCards.lofts.description'),
      color: "from-blue-500 to-blue-600",
      icon: Building2
    },
    {
      title: t('navigationCards.reservations.title'),
      href: `/${locale}/reservations`,
      description: t('navigationCards.reservations.description'),
      color: "from-green-500 to-green-600",
      icon: Calendar
    },
    {
      title: t('navigationCards.availability.title'),
      href: `/${locale}/availability`, 
      description: t('navigationCards.availability.description'),
      color: "from-purple-500 to-purple-600",
      icon: ClipboardList
    },
    {
      title: t('navigationCards.tasks.title'),
      href: `/${locale}/tasks`,
      description: t('navigationCards.tasks.description'), 
      color: "from-red-500 to-red-600",
      icon: CheckCircle
    },
    {
      title: t('navigationCards.teams.title'),
      href: `/${locale}/teams`,
      description: t('navigationCards.teams.description'),
      color: "from-orange-500 to-orange-600", 
      icon: Users
    },
    {
      title: t('navigationCards.owners.title'),
      href: `/${locale}/owners`,
      description: t('navigationCards.owners.description'),
      color: "from-cyan-500 to-cyan-600",
      icon: Building2
    },
    {
      title: t('navigationCards.transactions.title'),
      href: `/${locale}/transactions`, 
      description: t('navigationCards.transactions.description'),
      color: "from-emerald-500 to-emerald-600",
      icon: DollarSign
    },
    {
      title: t('navigationCards.reports.title'),
      href: `/${locale}/reports`,
      description: t('navigationCards.reports.description'), 
      color: "from-indigo-500 to-indigo-600",
      icon: BarChart3
    }
  ]

  const quickAccessButtons = [
    {
      title: t('quickAccessButtons.dashboard.title'),
      href: `/${locale}/dashboard`,
      description: t('quickAccessButtons.dashboard.description'),
      icon: BarChart3
    },
    {
      title: t('quickAccessButtons.conversations.title'),
      href: `/${locale}/conversations`,
      description: t('quickAccessButtons.conversations.description'),
      icon: MessageSquare
    },
    {
      title: t('quickAccessButtons.notifications.title'),
      href: `/${locale}/notifications`, 
      description: t('quickAccessButtons.notifications.description'),
      icon: Bell
    },
    {
      title: t('quickAccessButtons.pdfReports.title'),
      href: `/${locale}/reports`,
      description: t('quickAccessButtons.pdfReports.description'), 
      icon: FileText
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {t('subtitle')}
        </p>
      </div>

      {/* Navigation Cards Grid */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {t('mainSections')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {navigationCards.map((card, index) => (
            <a key={index} href={card.href} className="no-underline h-full">
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
            <Button
              key={index}
              asChild
              variant="outline"
              className="h-20 flex-col gap-2 bg-white/80 hover:bg-white hover:shadow-md transition-all"
            >
              <a href={button.href} className="no-underline">
                <button.icon className="h-6 w-6" />
                <span className="text-sm font-medium">{button.title}</span>
              </a>
            </Button>
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