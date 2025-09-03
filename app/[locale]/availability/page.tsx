'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AvailabilityCalendar } from '@/components/availability/availability-calendar'
import { FilterPanel } from '@/components/availability/filter-panel'
import { LoftGrid } from '@/components/availability/loft-grid'
import { QuickStats } from '@/components/availability/quick-stats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Grid3X3, BarChart3, Search } from 'lucide-react'

interface AvailabilityFilters {
  startDate: Date
  endDate: Date
  region: string
  owner: string
  loft: string
  guests: number
  minPrice: number
  maxPrice: number
}

export default function AvailabilityPage() {
  const t = useTranslations('availability')
  const [filters, setFilters] = useState<AvailabilityFilters>({
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    region: 'all',
    owner: 'all',
    loft: 'all',
    guests: 2,
    minPrice: 0,
    maxPrice: 50000
  })

  const [availabilityData, setAvailabilityData] = useState([])
  const [filterOptions, setFilterOptions] = useState({ regions: [], owners: [], zoneAreas: [], ownersData: [] })
  const [isLoading, setIsLoading] = useState(false)

  // Fetch real loft data from database
  useEffect(() => {
    const fetchLofts = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/lofts/availability')
        if (response.ok) {
          const data = await response.json()
          setAvailabilityData(data.lofts || [])
          setFilterOptions(data.filterOptions || { regions: [], owners: [], zoneAreas: [], ownersData: [] })
        } else {
          console.error('Failed to fetch lofts')
          setAvailabilityData([])
        }
      } catch (error) {
        console.error('Error fetching lofts:', error)
        setAvailabilityData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchLofts()
  }, [filters])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-blue-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
      <div className="container mx-auto py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                  <Search className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
                  <p className="text-green-100 text-lg mt-2">
                    {t('subtitle')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-100">
                <BarChart3 className="h-4 w-4" />
                <span>{t('featuresText')}</span>
              </div>
            </div>
            {/* Éléments décoratifs */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10"></div>
            <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5"></div>
          </div>

          {/* Quick Stats */}
          <QuickStats data={availabilityData} isLoading={isLoading} />

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Panel */}
            <div className="lg:col-span-1">
              <FilterPanel 
                filters={filters} 
                onFiltersChange={setFilters}
                isLoading={isLoading}
                filterOptions={filterOptions}
              />
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    {t('availabilityOverview')}
                  </CardTitle>
                  <CardDescription>
                    {t('availabilityDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="calendar" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                      <TabsTrigger 
                        value="calendar" 
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
                      >
                        <Calendar className="h-4 w-4" />
                        {t('calendarView')}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="grid" 
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
                      >
                        <Grid3X3 className="h-4 w-4" />
                        {t('gridView')}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="calendar" className="space-y-6">
                      <AvailabilityCalendar 
                        data={availabilityData}
                        filters={filters}
                        isLoading={isLoading}
                      />
                    </TabsContent>

                    <TabsContent value="grid" className="space-y-6">
                      <LoftGrid 
                        data={availabilityData}
                        filters={filters}
                        isLoading={isLoading}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}