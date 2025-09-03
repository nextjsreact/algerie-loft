'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronLeft, ChevronRight, Calendar, Eye, BookOpen, Phone } from 'lucide-react'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns'
import { fr, ar } from 'date-fns/locale'

interface AvailabilityCalendarProps {
  data: any[]
  filters: any
  isLoading: boolean
}

export function AvailabilityCalendar({ data, filters, isLoading }: AvailabilityCalendarProps) {
  const t = useTranslations('availability')
  const locale = useLocale()
  
  // Get the appropriate locale for date formatting
  const getDateLocale = () => {
    switch (locale) {
      case 'ar':
        return ar
      case 'fr':
        return fr
      default:
        return fr
    }
  }

  // Get weekday names based on current language
  const getWeekdayNames = () => {
    const locale = getDateLocale()
    const baseDate = new Date(2024, 0, 1) // Monday, January 1, 2024
    const weekdays = []
    for (let i = 0; i < 7; i++) {
      const date = addDays(baseDate, i)
      weekdays.push(format(date, 'EEE', { locale }))
    }
    return weekdays
  }
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedLoft, setSelectedLoft] = useState<string | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500'
      case 'occupied':
        return 'bg-red-500'
      case 'maintenance':
        return 'bg-orange-500'
      default:
        return 'bg-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return t('available')
      case 'occupied':
        return t('occupied')
      case 'maintenance':
        return t('maintenance')
      default:
        return t('unknown')
    }
  }

  const filteredData = data.filter(loft => {
    if (filters.region !== 'all' && loft.region.toLowerCase() !== filters.region) return false
    
    // Nouveau filtre multi-sélection pour les propriétaires
    if (filters.owners && filters.owners.length > 0) {
      const loftOwnerKey = loft.owner.toLowerCase().replace(' ', '-')
      if (!filters.owners.includes(loftOwnerKey)) return false
    }
    
    if (loft.capacity < filters.guests) return false
    if (loft.pricePerNight < filters.minPrice || loft.pricePerNight > filters.maxPrice) return false
    return true
  })

  const displayData = selectedLoft 
    ? filteredData.filter(loft => loft.id === selectedLoft)
    : filteredData

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy', { locale: getDateLocale() })}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addDays(currentMonth, -30))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              {t('today')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addDays(currentMonth, 30))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Loft Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedLoft || 'all'}
            onChange={(e) => setSelectedLoft(e.target.value === 'all' ? null : e.target.value)}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="all">{t('allLofts')}</option>
            {filteredData.map((loft) => (
              <option key={loft.id} value={loft.id}>
                {loft.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm">{t('available')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm">{t('occupied')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="text-sm">{t('maintenance')}</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-4">
        {displayData.map((loft) => (
          <Card key={loft.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{loft.name}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span>{loft.region === 'availability:unknown' ? (locale === 'ar' ? 'غير معروف' : locale === 'en' ? 'Unknown' : 'Inconnu') : loft.region}</span>
                    <span>•</span>
                    <span>{loft.owner === 'availability:unknown' ? (locale === 'ar' ? 'غير معروف' : locale === 'en' ? 'Unknown' : 'Inconnu') : loft.owner}</span>
                    <span>•</span>
                    <span>{loft.pricePerNight.toLocaleString()} DA/nuit</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={loft.status === 'available' ? 'default' : 'secondary'}>
                    {getStatusText(loft.status)}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    {t('viewDetails')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {getWeekdayNames().map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {days.map((day) => {
                  const dayKey = format(day, 'yyyy-MM-dd')
                  const dayStatus = loft.availability?.[dayKey] || 'available'
                  const isToday = isSameDay(day, new Date())
                  const isInRange = day >= filters.startDate && day <= filters.endDate
                  
                  return (
                    <TooltipProvider key={dayKey}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`
                              relative p-2 text-center text-sm cursor-pointer rounded transition-all hover:scale-105
                              ${!isSameMonth(day, currentMonth) ? 'text-muted-foreground opacity-50' : ''}
                              ${isToday ? 'ring-2 ring-blue-500' : ''}
                              ${isInRange ? 'ring-1 ring-green-300' : ''}
                            `}
                          >
                            <div className="relative z-10">
                              {format(day, 'd')}
                            </div>
                            <div 
                              className={`
                                absolute inset-0 rounded opacity-80
                                ${getStatusColor(dayStatus)}
                              `}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-medium">{format(day, 'dd MMMM yyyy', { locale: getDateLocale() })}</p>
                            <p className="text-sm">{getStatusText(dayStatus)}</p>
                            <p className="text-sm">{loft.pricePerNight.toLocaleString()} DA</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {displayData.length === 0 && (
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('noLoftsFound')}</h3>
          <p className="text-muted-foreground">{t('noLoftsFoundDescription')}</p>
        </Card>
      )}
    </div>
  )
}