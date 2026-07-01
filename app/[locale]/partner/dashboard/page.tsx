'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ResponsivePartnerLayout } from '@/components/partner/responsive-partner-layout'
import { DashboardPageSkeleton } from '@/components/partner/dashboard-skeletons'
import { FullPageErrorDisplay, useErrorHandler } from '@/components/partner/dashboard-error-display'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2, Calendar, DollarSign, TrendingUp, Star,
  RefreshCw, ArrowRight, MapPin, Users, Clock,
  CheckCircle, AlertTriangle, ChevronRight, Home, Eye
} from 'lucide-react'

interface PartnerStats {
  total_properties: number
  active_properties: number
  total_bookings: number
  upcoming_bookings: number
  monthly_earnings: number
  occupancy_rate: number
  average_rating: number
  total_reviews: number
}

interface PropertySummary {
  id: string
  name: string
  address: string
  status: 'available' | 'occupied' | 'maintenance'
  price_per_night: number
  bookings_count: number
  earnings_this_month: number
  occupancy_rate: number
  average_rating: number
  cover_photo?: string | null
  images?: string[]
  next_booking?: { check_in: string; check_out: string; client_name: string }
}

interface RecentBooking {
  id: string
  booking_reference: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
  client_name: string
  loft_name: string
}

interface PartnerDashboardPageProps {
  params: Promise<{ locale: string }>
}

const statusConfig = {
  available:    { label: 'Disponible',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  occupied:     { label: 'Occupé',      color: 'bg-blue-100 text-blue-700 border-blue-200' },
  maintenance:  { label: 'Maintenance', color: 'bg-orange-100 text-orange-700 border-orange-200' },
}

const bookingStatusConfig = {
  pending:   { label: 'En attente', color: 'bg-amber-100 text-amber-700',   icon: Clock },
  confirmed: { label: 'Confirmée',  color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  completed: { label: 'Terminée',   color: 'bg-gray-100 text-gray-600',     icon: CheckCircle },
  cancelled: { label: 'Annulée',    color: 'bg-red-100 text-red-700',       icon: AlertTriangle },
}

export default function PartnerDashboardPage({ params }: PartnerDashboardPageProps) {
  const { locale } = use(params)
  const router = useRouter()
  const t = useTranslations('partner.dashboard')
  const { error, handleError, clearError, getErrorType } = useErrorHandler()

  const [stats, setStats] = useState<PartnerStats>({
    total_properties: 0, active_properties: 0,
    total_bookings: 0, upcoming_bookings: 0,
    monthly_earnings: 0, occupancy_rate: 0,
    average_rating: 0, total_reviews: 0,
  })
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [partnerStatus, setPartnerStatus] = useState<'pending' | 'verified' | 'rejected' | null>(null)
  const [partnerInfo, setPartnerInfo] = useState<{ userName?: string; submittedDate?: string }>({})

  const fmt = (n: number) => new Intl.NumberFormat('fr-DZ', {
    style: 'currency', currency: 'DZD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  const checkPartnerStatus = async () => {
    try {
      const res = await fetch('/api/partner/status')
      if (res.ok) {
        const data = await res.json()
        setPartnerStatus(data.verification_status)
        setPartnerInfo({ userName: data.business_name, submittedDate: data.created_at })
        return data.verification_status
      }
    } catch {}
    return null
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      clearError()
      const { fetchDashboardData: fetchData, getErrorType: getErrType } = await import('@/lib/partner/data-fetching')
      const results = await fetchData({ timeout: 10000, retries: 2, retryDelay: 1000 })

      if (results.stats.error) {
        if (results.stats.status === 401 || results.stats.status === 403) { handleError('unauthorized'); return }
        const errorType = getErrType(results.stats.error)
        if (errorType === 'network' || errorType === 'timeout') { handleError(errorType); return }
      } else if (results.stats.data) {
        setStats(results.stats.data as PartnerStats)
      }

      if (results.properties.data) {
        const pd = results.properties.data as any
        setProperties(pd?.data?.properties || pd?.properties || [])
      }

      if (results.bookings.data) {
        const bd = results.bookings.data as any
        setRecentBookings(bd?.data?.bookings || bd?.data?.reservations || bd?.bookings || bd?.reservations || [])
      }

      setLastUpdated(new Date())
    } catch (err) {
      const { getErrorType: getErrType } = await import('@/lib/partner/data-fetching')
      handleError(getErrType(err), err instanceof Error ? err.message : undefined)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      const status = await checkPartnerStatus()
      if (status === 'verified') await fetchDashboardData()
      else setLoading(false)
    }
    init()
  }, [])

  if (loading) return <ResponsivePartnerLayout locale={locale}><DashboardPageSkeleton /></ResponsivePartnerLayout>

  if (partnerStatus === 'pending') {
    const { PendingStatusView } = require('@/components/partner/pending-status-view')
    return <PendingStatusView locale={locale} userName={partnerInfo.userName} submittedDate={partnerInfo.submittedDate} />
  }

  if (partnerStatus === 'rejected') {
    return (
      <ResponsivePartnerLayout locale={locale}>
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="max-w-md w-full text-center p-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">Demande refusée</h2>
            <p className="text-gray-600">Votre demande de partenariat n'a pas été approuvée. Contactez notre équipe pour plus d'informations.</p>
          </Card>
        </div>
      </ResponsivePartnerLayout>
    )
  }

  if (error) {
    return (
      <ResponsivePartnerLayout locale={locale}>
        <FullPageErrorDisplay type={error.type} message={error.message} onRetry={fetchDashboardData} showContactSupport />
      </ResponsivePartnerLayout>
    )
  }

  const statCards = [
    {
      label: 'Mes lofts', value: stats.total_properties,
      sub: `${stats.active_properties} actif${stats.active_properties > 1 ? 's' : ''}`,
      icon: Building2, gradient: 'from-violet-500 to-purple-600', subColor: 'text-purple-200',
    },
    {
      label: 'Revenus encaissés', value: fmt(stats.monthly_earnings),
      sub: 'Réservations ce mois', icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600', subColor: 'text-emerald-200',
    },
    {
      label: 'Réservations', value: stats.total_bookings,
      sub: `${stats.upcoming_bookings} à venir`, icon: Calendar,
      gradient: 'from-blue-500 to-indigo-600', subColor: 'text-blue-200',
    },
    {
      label: 'Taux d\'occupation', value: `${Math.round(stats.occupancy_rate)}%`,
      sub: 'Ce mois-ci', icon: TrendingUp,
      gradient: 'from-amber-500 to-orange-600', subColor: 'text-amber-200',
    },
    {
      label: 'Note moyenne', value: stats.average_rating.toFixed(1),
      sub: `${stats.total_reviews} avis`, icon: Star,
      gradient: 'from-pink-500 to-rose-600', subColor: 'text-pink-200',
    },
  ]

  return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="space-y-6 pb-8">

        {/* ─── Header ─── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-400 hidden sm:block">
                Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* ─── Stats cards ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {statCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <Card className={`border-0 shadow-md bg-gradient-to-br ${card.gradient} text-white overflow-hidden`}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-medium text-white/80 leading-tight">{card.label}</p>
                    <card.icon className="h-4 w-4 text-white/60 flex-shrink-0" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white leading-none mb-1">
                    {card.value}
                  </p>
                  <p className={`text-[11px] ${card.subColor}`}>{card.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ─── Properties + Bookings ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Mes lofts */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Home className="h-4 w-4 text-purple-500" />
                Mes lofts
              </CardTitle>
              <Link href={`/${locale}/partner/properties`}>
                <Button variant="ghost" size="sm" className="text-xs text-purple-600 hover:text-purple-800 h-7 px-2">
                  Voir tout <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {properties.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Aucun loft enregistré</p>
                  <Link href={`/${locale}/partner/properties/add`}>
                    <Button size="sm" className="mt-3">Ajouter un loft</Button>
                  </Link>
                </div>
              ) : (
                properties.slice(0, 4).map((p) => {
                  const sc = statusConfig[p.status] || statusConfig.available
                  return (
                    <Link key={p.id} href={`/${locale}/partner/properties/${p.id}`} className="block group">
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/40 transition-all dark:border-gray-800 dark:hover:border-purple-800 dark:hover:bg-purple-900/10">
                        {/* Photo */}
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {p.cover_photo || (p.images && p.images[0]) ? (
                            <Image
                              src={p.cover_photo || p.images![0]}
                              alt={p.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Building2 className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-purple-700">
                              {p.name}
                            </p>
                            <Badge className={`text-[10px] border flex-shrink-0 ${sc.color}`}>
                              {sc.label}
                            </Badge>
                          </div>
                          {p.address && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              {p.address}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {p.price_per_night.toLocaleString('fr-DZ')} DA/nuit
                            </span>
                            {p.earnings_this_month > 0 && (
                              <span className="text-xs text-emerald-600 font-medium">
                                +{fmt(p.earnings_this_month)} ce mois
                              </span>
                            )}
                          </div>
                        </div>
                        <Eye className="h-4 w-4 text-gray-300 group-hover:text-purple-500 flex-shrink-0 transition-colors" />
                      </div>
                    </Link>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Réservations récentes */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Réservations récentes
              </CardTitle>
              <Link href={`/${locale}/partner/bookings`}>
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-800 h-7 px-2">
                  Voir tout <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {recentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Aucune réservation pour le moment</p>
                </div>
              ) : (
                recentBookings.slice(0, 5).map((b) => {
                  const sc = bookingStatusConfig[b.status] || bookingStatusConfig.pending
                  const StatusIcon = sc.icon
                  return (
                    <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div className={`p-2 rounded-lg ${sc.color} flex-shrink-0`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {b.loft_name}
                          </p>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">
                            {fmt(b.total_price)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Users className="h-3 w-3" />
                          {b.client_name}
                          <span className="mx-1">·</span>
                          {fmtDate(b.check_in)} → {fmtDate(b.check_out)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Quick actions ─── */}
        <Card className="border shadow-sm bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Actions rapides</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Ajouter un loft', href: `/${locale}/partner/properties/add`, icon: Building2, color: 'text-purple-600 bg-purple-50 border-purple-200' },
                { label: 'Réservations', href: `/${locale}/partner/bookings`, icon: Calendar, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                { label: 'Mes lofts', href: `/${locale}/partner/properties`, icon: Home, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                { label: 'Revenus', href: `/${locale}/partner/earnings`, icon: DollarSign, color: 'text-amber-600 bg-amber-50 border-amber-200' },
              ].map((action, i) => (
                <Link key={i} href={action.href}>
                  <button className={`w-full flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all hover:shadow-sm hover:-translate-y-0.5 ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                    <span className="text-xs font-medium leading-tight">{action.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </ResponsivePartnerLayout>
  )
}
