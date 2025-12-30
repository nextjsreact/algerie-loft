'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Calendar, Eye, BookOpen, Phone } from 'lucide-react'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval } from 'date-fns'
import { fr, ar } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'

interface AvailabilityCalendarProps {
  data: any[]
  dateRange: DateRange | undefined
  isLoading: boolean
  onBookNow: (loftId: string) => void;
  rawAvailabilityData: any[];
  statuses: string[];
}

export function AvailabilityCalendar({ data, dateRange, isLoading, onBookNow, rawAvailabilityData, statuses }: AvailabilityCalendarProps) {
  const t = useTranslations('availability')
  const locale = useLocale()
  const router = useRouter()
  
  const getDateLocale = () => {
    switch (locale) {
      case 'ar': return ar
      case 'fr': return fr
      default: return fr
    }
  }

  const getWeekdayNames = () => {
    const locale = getDateLocale()
    const baseDate = new Date(2024, 0, 1) // Monday
    return Array.from({ length: 7 }, (_, i) => format(addDays(baseDate, i), 'EEE', { locale }))
  }

  const [currentMonth, setCurrentMonth] = useState(dateRange?.from || new Date())
  const [selectedLoft, setSelectedLoft] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    setCurrentMonth(dateRange?.from || new Date())
  }, [dateRange])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'occupied': return 'bg-red-500'
      case 'maintenance': return 'bg-orange-500'
      case 'personal_use': return 'bg-purple-500'
      default: return 'bg-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return t('available')
      case 'occupied': return t('occupied')
      case 'maintenance': return t('maintenance')
      case 'personal_use': return t('personalUse')
      default: return t('unknown')
    }
  }

  const handleViewDetails = (loft: any) => {
    setSelectedLoft(loft)
    setIsDialogOpen(true)
  }

  const displayData = selectedLoft ? data.filter(loft => loft.id === selectedLoft) : data

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
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addDays(currentMonth, -30))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
              {t('today')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addDays(currentMonth, 30))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Loft Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedLoft?.id || 'all'}
            onChange={(e) => {
              const loftId = e.target.value;
              if (loftId === 'all') {
                setSelectedLoft(null);
              } else {
                const loft = data.find(l => l.id === loftId);
                setSelectedLoft(loft);
              }
            }}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="all">{t('allLofts')}</option>
            {data.map((loft) => (
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
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span className="text-sm">{t('personalUse')}</span>
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
                    <span>{loft.region}</span>
                    <span>•</span>
                    <span>{loft.owner}</span>
                    <span>•</span>
                    <span>{loft.pricePerNight.toLocaleString()} DA/nuit</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={loft.status === 'available' ? 'default' : 'secondary'}>
                    {getStatusText(loft.status)}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(loft)}>
                    <Eye className="h-4 w-4 mr-1" />
                    {t('viewDetails')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {getWeekdayNames().map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {days.map((day) => {
                  const dayKey = format(day, 'yyyy-MM-dd')
                  const dayStatus = loft.availability?.[dayKey] || 'available'
                  const isToday = isSameDay(day, new Date())
                  const isInRange = dateRange?.from && dateRange?.to && isWithinInterval(day, { start: dateRange.from, end: dateRange.to })
                  
                  if (statuses && statuses.length > 0 && !statuses.includes(dayStatus)) {
                    return (
                      <div key={dayKey} className="p-2 text-center text-sm text-muted-foreground opacity-20">
                        {format(day, 'd')}
                      </div>
                    )
                  }

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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedLoft?.name}</DialogTitle>
            <DialogDescription>
              {t('loftDetailsDescription')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLoft && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">{t('basicInfo')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t('region')}:</span>
                      <span>{selectedLoft.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('owner')}:</span>
                      <span>{selectedLoft.owner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('capacity')}:</span>
                      <span>{selectedLoft.capacity} {t('guests')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('pricePerNight')}:</span>
                      <span className="font-medium">{selectedLoft.pricePerNight.toLocaleString()} DA</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">{t('amenities')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLoft.amenities?.map((amenity: string) => (
                      <div 
                        key={amenity}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs"
                      >
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => onBookNow(selectedLoft.id)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  {t('bookNow')}
                </Button>
                <Button variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  {t('contact')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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