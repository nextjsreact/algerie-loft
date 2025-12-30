'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  MapPin, 
  Users, 
  Wifi, 
  Car, 
  ChefHat, 
  Snowflake, 
  Eye, 
  BookOpen, 
  Phone,
  Calendar,
  DollarSign
} from 'lucide-react'

interface LoftGridProps {
  data: any[]
  isLoading: boolean
}

export function LoftGrid({ data, isLoading }: LoftGridProps) {
  const t = useTranslations('availability')
  const locale = useLocale()
  const [selectedLoft, setSelectedLoft] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'occupied':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
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

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'wifi':
        return <Wifi className="h-4 w-4" />
      case 'parking':
        return <Car className="h-4 w-4" />
      case 'kitchen':
        return <ChefHat className="h-4 w-4" />
      case 'ac':
        return <Snowflake className="h-4 w-4" />
      default:
        return null
    }
  }

  const getAmenityText = (amenity: string) => {
    switch (amenity) {
      case 'wifi':
        return 'WiFi'
      case 'parking':
        return t('parking')
      case 'kitchen':
        return t('kitchen')
      case 'ac':
        return t('airConditioning')
      case 'balcony':
        return t('balcony')
      default:
        return amenity
    }
  }

  const translateText = (text: string) => {
    if (text === 'availability:unknown') {
      return locale === 'ar' ? 'غير معروف' : locale === 'en' ? 'Unknown' : 'Inconnu'
    }
    if (text.startsWith('availability:')) {
      const key = text.replace('availability:', '')
      return t(key)
    }
    if (text === 'Propriétaire Test') return t('testOwner')
    if (text === 'Centre-ville Alger') return t('algerCenterRegion')
    return text
  }

  const handleViewDetails = (loft: any) => {
    setSelectedLoft(loft)
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
            <CardContent className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('showingResults', { count: data.length, total: data.length })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((loft) => (
          <Card key={loft.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
            <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl opacity-20">🏠</div>
              </div>
              <div className="absolute top-3 left-3">
                <Badge className={getStatusColor(loft.status)}>
                  {getStatusText(loft.status)}
                </Badge>
              </div>
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="bg-white/90 text-gray-800">
                  {loft.pricePerNight.toLocaleString()} DA/nuit
                </Badge>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                    {loft.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {translateText(loft.region)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {loft.capacity} {t('guests')}
                    </div>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">{t('owner')}: </span>
                  <span className="font-medium">{translateText(loft.owner)}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {loft.amenities?.slice(0, 4).map((amenity: string) => (
                    <div 
                      key={amenity}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs"
                    >
                      {getAmenityIcon(amenity)}
                      <span>{getAmenityText(amenity)}</span>
                    </div>
                  ))}
                  {loft.amenities?.length > 4 && (
                    <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                      +{loft.amenities.length - 4}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewDetails(loft)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t('viewDetails')}
                  </Button>

                  {loft.status === 'available' && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {t('book')}
                    </Button>
                  )}
                </div>
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
                      <span>{translateText(selectedLoft.region)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('owner')}:</span>
                      <span>{translateText(selectedLoft.owner)}</span>
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
                        {getAmenityIcon(amenity)}
                        <span>{getAmenityText(amenity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">{t('address')}</h4>
                <p className="text-sm text-muted-foreground">{selectedLoft.address}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">{t('description')}</h4>
                <p className="text-sm text-muted-foreground">{selectedLoft.description}</p>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1">
                  <BookOpen className="h-4 w-4 mr-2" />
                  {t('bookNow')}
                </Button>
                <Button variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  {t('contact')}
                </Button>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('checkAvailability')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {data.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium mb-2">{t('noLoftsFound')}</h3>
          <p className="text-muted-foreground">{t('noLoftsFoundDescription')}</p>
        </Card>
      )}
    </div>
  )
}