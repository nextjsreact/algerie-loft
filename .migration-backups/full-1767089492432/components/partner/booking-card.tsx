"use client"

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, MapPin, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  loft_id?: string
}

interface BookingCardProps {
  booking: RecentBooking
  locale: string
  onClick?: () => void
}

export function BookingCard({ booking, locale, onClick }: BookingCardProps) {
  const t = useTranslations('partner.dashboard.bookings')
  const router = useRouter()
  
  // Helper pour formater la devise selon la locale
  const formatCurrency = (amount: number) => {
    const localeMap: Record<string, string> = {
      'ar': 'ar-DZ',
      'fr': 'fr-DZ',
      'en': 'en-US'
    }
    return new Intl.NumberFormat(localeMap[locale] || 'ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
      case 'refunded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.push(`/${locale}/partner/bookings/${booking.id}`)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        {/* Header with client name and price */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {booking.client_name}
            </h4>
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{booking.loft_name}</span>
            </div>
          </div>
          <div className="text-right ml-3 flex-shrink-0">
            <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
              {formatCurrency(booking.total_price)}
            </div>
          </div>
        </div>

        {/* Dates and guests */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">
              {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{booking.guests}</span>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            variant="outline" 
            className={cn("text-xs font-medium", getStatusColor(booking.status))}
          >
            {t(`status.${booking.status}`)}
          </Badge>
          <Badge 
            variant="secondary" 
            className={cn("text-xs font-medium", getPaymentStatusColor(booking.payment_status))}
          >
            {t(`paymentStatus.${booking.payment_status}`)}
          </Badge>
          <span className="text-xs text-gray-500 dark:text-gray-500 ml-auto">
            {booking.booking_reference}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
