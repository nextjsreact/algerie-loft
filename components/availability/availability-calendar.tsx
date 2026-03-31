'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, Eye, BookOpen, Phone, Search } from 'lucide-react'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
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
  const [loftSearch, setLoftSearch] = useState('')
  const [loftPopoverOpen, setLoftPopoverOpen] = useState(false)

  useEffect(() => {
    setCurrentMonth(dateRange?.from || new Date())
  }, [dateRange])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  // Always display a proper monthly calendar grid
  // Pad the start to Monday of the first week
  const calendarStart = addDays(monthStart, -(monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1))
  // Pad the end to Sunday of the last week
  const calendarEnd = addDays(monthEnd, monthEnd.getDay() === 0 ? 0 : 7 - monthEnd.getDay())
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

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

  const displayData = selectedLoft ? data.filter(loft => loft.id === selectedLoft.id) : data

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
              variant="outline" size="sm"
              onClick={() => setCurrentMonth(addDays(currentMonth, -30))}
              disabled={dateRange?.from ? startOfMonth(addDays(currentMonth, -30)) < startOfMonth(dateRange.from) : false}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(dateRange?.from || new Date())}>
              {t('today')}
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setCurrentMonth(addDays(currentMonth, 30))}
              disabled={dateRange?.to ? startOfMonth(addDays(currentMonth, 30)) > startOfMonth(dateRange.to) : false}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {/* Show data range info */}
          {dateRange?.from && dateRange?.to && (
            <span className="text-xs text-gray-400">
              {format(dateRange.from, 'dd/MM/yyyy')} → {format(dateRange.to, 'dd/MM/yyyy')}
            </span>
          )}
        </div>

        {/* Loft Selector */}
        <div className="flex items-center gap-2">
          <Popover open={loftPopoverOpen} onOpenChange={(open) => { setLoftPopoverOpen(open); if (!open) setLoftSearch('') }}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[180px] justify-between">
                <span className="truncate">{selectedLoft ? selectedLoft.name : t('allLofts')}</span>
                <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" side="bottom" align="start" sideOffset={4}>
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Rechercher..."
                    value={loftSearch}
                    onChange={(e) => setLoftSearch(e.target.value)}
                    className="h-8 pl-7 text-sm"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-[200px] overflow-y-auto p-1">
                <button
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors"
                  onClick={() => { setSelectedLoft(null); setLoftPopoverOpen(false) }}
                >
                  {t('allLofts')}
                </button>
                {data
                  .filter(l => l.name.toLowerCase().includes(loftSearch.toLowerCase()))
                  .map((loft) => (
                    <button
                      key={loft.id}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors"
                      onClick={() => { setSelectedLoft(loft); setLoftPopoverOpen(false) }}
                    >
                      {loft.name}
                    </button>
                  ))}
              </div>
            </PopoverContent>
          </Popover>
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
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {getWeekdayNames().map((day) => (
                  <div key={day} className="p-1 text-center text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const dayKey = format(day, 'yyyy-MM-dd')
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                  const dayStatus = isCurrentMonth ? (loft.availability?.[dayKey] || 'available') : null
                  const isToday = isSameDay(day, new Date())

                  // Days outside current month — show greyed out, no color
                  if (!isCurrentMonth) {
                    return (
                      <div key={dayKey} className="h-9 flex items-center justify-center text-xs text-muted-foreground opacity-30">
                        {format(day, 'd')}
                      </div>
                    )
                  }

                  // Days outside the data range — show as grey (no data)
                  const inDataRange = dateRange?.from && dateRange?.to
                    ? day >= dateRange.from && day <= dateRange.to
                    : true
                  if (!inDataRange) {
                    return (
                      <div key={dayKey} className="h-9 flex items-center justify-center text-xs text-muted-foreground opacity-30 bg-gray-100 dark:bg-gray-800 rounded">
                        {format(day, 'd')}
                      </div>
                    )
                  }

                  const dayStatus = loft.availability?.[dayKey] || 'available'

                  // Status filter
                  if (statuses && statuses.length > 0 && !statuses.includes(dayStatus)) {
                    return (
                      <div key={dayKey} className="h-9 flex items-center justify-center text-xs text-muted-foreground opacity-20 rounded bg-gray-100 dark:bg-gray-800">
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
                              relative h-9 flex items-center justify-center text-xs font-medium cursor-pointer rounded transition-all hover:scale-105 hover:z-10 text-white
                              ${isToday ? 'ring-2 ring-offset-1 ring-blue-500' : ''}
                              ${getStatusColor(dayStatus || 'available')}
                            `}
                          >
                            {format(day, 'd')}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-medium">{format(day, 'dd MMMM yyyy', { locale: getDateLocale() })}</p>
                            <p className="text-sm">{getStatusText(dayStatus || 'available')}</p>
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