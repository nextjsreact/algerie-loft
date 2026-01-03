"use client"

import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import type { AuthSession } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { 
  Building2, 
  Calendar, 
  Users, 
  ClipboardList, 
  UserCheck, 
  DollarSign, 
  BarChart3,
  Settings,
  MessageSquare,
  Bell,
  CalendarCheck,
  ArrowRight,
  Home,
  Zap,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Gavel,
  Cog
} from "lucide-react"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"

function HomePageContent({ session }: { session: AuthSession }) {
  const t = useTranslations('dashboard')
  const locale = useLocale()

  // Sections communes pour Admin, Manager et Member uniquement
  const commonSections = [
    {
      title: t('sections.apartments.title'),
      description: t('sections.apartments.description'),
      href: `/${locale}/lofts`,
      icon: Building2,
      color: "from-blue-500 to-blue-600",
      roles: ['admin', 'manager', 'member']
    },
    {
      title: t('sections.reservations.title'),
      description: t('sections.reservations.description'),
      href: `/${locale}/reservations`,
      icon: Calendar,
      color: "from-green-500 to-green-600",
      roles: ['admin', 'manager', 'member']
    },
    {
      title: t('sections.availability.title'),
      description: t('sections.availability.description'),
      href: `/${locale}/availability`,
      icon: CalendarCheck,
      color: "from-purple-500 to-purple-600",
      roles: ['admin', 'manager', 'member']
    },
    {
      title: t('sections.tasks.title'),
      description: t('sections.tasks.description'),
      href: `/${locale}/tasks`, 
      icon: ClipboardList,
      color: "from-orange-500 to-orange-600",
      roles: ['admin', 'manager', 'member']
    }
  ]

  // Sections spécifiques selon le profil
  const profileSpecificSections = [
    // Sections pour Admin uniquement
    {
      title: 'Annonces Urgentes',
      description: 'Gérer les bannières de promotion sur la homepage',
      href: `/${locale}/admin/announcements`,
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      roles: ['admin', 'superuser']
    },
    {
      title: t('sections.teams.title'),
      description: t('sections.teams.description'),
      href: `/${locale}/teams`,
      icon: Users,
      color: "from-indigo-500 to-indigo-600",
      roles: ['admin']
    },
    {
      title: t('sections.platformSettings.title'),
      description: t('sections.platformSettings.description'),
      href: `/${locale}/platform/settings`,
      icon: Cog,
      color: "from-gray-500 to-gray-600",
      roles: ['admin']
    },
    
    // Sections pour Admin, Manager et Executive
    {
      title: t('sections.owners.title'),
      description: t('sections.owners.description'),
      href: `/${locale}/owners`,
      icon: UserCheck,
      color: "from-teal-500 to-teal-600",
      roles: ['admin', 'manager']
    },
    {
      title: t('sections.transactions.title'),
      description: t('sections.transactions.description'),
      href: `/${locale}/transactions`,
      icon: DollarSign,
      color: "from-yellow-500 to-yellow-600",
      roles: ['admin', 'manager']
    },
    

    
    // Sections pour Admin et Manager (gestion opérationnelle)
    {
      title: t('sections.detailedReports.title'),
      description: t('sections.detailedReports.description'),
      href: `/${locale}/reports`,
      icon: BarChart3,
      color: "from-red-500 to-red-600",
      roles: ['admin', 'manager']
    },
    
    // Sections partenaires (Admin uniquement)
    {
      title: t('sections.pendingPartners.title'),
      description: t('sections.pendingPartners.description'),
      href: `/${locale}/partner/pending`,
      icon: UserPlus,
      color: "from-amber-500 to-amber-600",
      roles: ['admin']
    },
    {
      title: t('sections.validatePartners.title'),
      description: t('sections.validatePartners.description'),
      href: `/${locale}/partner/validation`,
      icon: CheckCircle,
      color: "from-emerald-500 to-emerald-600",
      roles: ['admin']
    },
    
    // Sections litiges (gestion pour Admin et Manager)
    {
      title: t('sections.openDisputes.title'),
      description: t('sections.openDisputes.description'),
      href: `/${locale}/disputes/open`,
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      roles: ['admin', 'manager']
    },
    {
      title: t('sections.manageDisputes.title'),
      description: t('sections.manageDisputes.description'),
      href: `/${locale}/disputes/manage`,
      icon: Gavel,
      color: "from-purple-500 to-purple-600",
      roles: ['admin']
    }
  ]

  // Filtrer les sections selon le rôle de l'utilisateur
  const getAvailableSections = (userRole: string) => {
    const allSections = [...commonSections, ...profileSpecificSections]
    return allSections.filter(section => section.roles.includes(userRole))
  }

  const mainSections = session ? getAvailableSections(session.user.role) : []

  const getQuickAccessItems = (userRole: string) => {
    const baseItems = [
      {
        title: t('quickAccessItems.conversations.title'),
        href: `/${locale}/conversations`,
        icon: MessageSquare,
        description: t('quickAccessItems.conversations.description'),
        roles: ['admin', 'manager', 'member']
      },
      {
        title: t('quickAccessItems.notifications.title'),
        href: `/${locale}/notifications`, 
        icon: Bell,
        description: t('quickAccessItems.notifications.description'),
        roles: ['admin', 'manager', 'member']
      }
    ]

    const roleSpecificItems = [
      // Pour Admin et Superuser - Annonces urgentes
      {
        title: 'Annonces Urgentes',
        href: `/${locale}/admin/announcements`,
        icon: AlertTriangle,
        description: 'Gérer les bannières de promotion',
        roles: ['admin', 'superuser']
      },
      // Pour Admin et Manager - Vue opérationnelle
      {
        title: t('quickAccessItems.dashboard.title'),
        href: `/${locale}/dashboard`,
        icon: BarChart3,
        description: t('quickAccessItems.dashboard.description'),
        roles: ['admin', 'manager']
      },
      {
        title: t('quickAccessItems.detailedReports.title'),
        href: `/${locale}/reports`,
        icon: BarChart3,
        description: t('quickAccessItems.detailedReports.description'),
        roles: ['admin', 'manager']
      }
    ]

    const allItems = [...baseItems, ...roleSpecificItems]
    return allItems.filter(item => item.roles.includes(userRole))
  }

  const quickAccess = session ? getQuickAccessItems(session.user.role) : []

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Home className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('title')}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          {t('description')}
        </p>
        


        {/* Admin Access Badge */}
        {(session.user.role === 'admin' || session.user.role === 'executive') && (
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            <Zap className="h-4 w-4" />
            admin Access
          </div>
        )}
      </div>

      {/* Main Sections */}
      <div className="space-y-6">
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {t('availableSections')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainSections.map((section, index) => (
              <Link key={index} href={section.href}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 bg-gradient-to-r ${section.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <section.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{section.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                    <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                      {t('access')} <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('quickAccess.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickAccess.map((item, index) => (
              <Link key={index} href={item.href}>
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
                        <item.icon className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                        <p className="text-xs text-gray-600">{item.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* System Status */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-green-800">{t('systemStatus.allOperational')}</span>
              </div>
              <span className="text-sm text-green-600 font-medium">{t('systemStatus.online')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function HomePageClient() {
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
        <div className="text-lg">Chargement de la page d'accueil...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Veuillez vous connecter pour accéder à la page d'accueil.</div>
      </div>
    )
  }

  // Wrap with SidebarProvider and AppSidebar for proper layout (same as dashboard)
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          {/* Mobile header with trigger button */}
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:hidden">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold">Accueil</h1>
          </header>
          
          {/* Main content */}
          <main className="flex-1">
            <HomePageContent session={session} />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}