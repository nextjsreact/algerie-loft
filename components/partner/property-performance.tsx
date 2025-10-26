"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Building2, Star, Eye } from 'lucide-react'

interface PropertyStats {
  id: string
  name: string
  address: string
  total_bookings: number
  total_earnings: number
  occupancy_rate: number
  average_rating: number
  views_count: number
  status: 'active' | 'inactive'
}

interface PropertyPerformanceProps {
  userId: string
}

export function PropertyPerformance({ userId }: PropertyPerformanceProps) {
  const [properties, setProperties] = useState<PropertyStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPropertyPerformance()
  }, [userId])

  const fetchPropertyPerformance = async () => {
    try {
      setLoading(true)
      
      // For now, use mock data - replace with actual API call
      const mockProperties: PropertyStats[] = [
        {
          id: '1',
          name: 'Modern Loft Downtown',
          address: 'Rue Didouche Mourad, Alger',
          total_bookings: 24,
          total_earnings: 180000,
          occupancy_rate: 85,
          average_rating: 4.8,
          views_count: 156,
          status: 'active'
        },
        {
          id: '2',
          name: 'Cozy Studio Hydra',
          address: 'Chemin des Glycines, Hydra',
          total_bookings: 18,
          total_earnings: 135000,
          occupancy_rate: 72,
          average_rating: 4.6,
          views_count: 98,
          status: 'active'
        },
        {
          id: '3',
          name: 'Luxury Apartment',
          address: 'Boulevard Mohamed V, Oran',
          total_bookings: 15,
          total_earnings: 225000,
          occupancy_rate: 68,
          average_rating: 4.9,
          views_count: 134,
          status: 'active'
        }
      ]
      
      setProperties(mockProperties)
    } catch (error) {
      console.error('Error fetching property performance:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Property Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <TrendingUp className="h-6 w-6 text-purple-600" />
          Property Performance
        </CardTitle>
        <p className="text-sm text-gray-600">Track your properties' success metrics</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {properties.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No properties found</p>
            </div>
          ) : (
            properties.map((property) => (
              <div
                key={property.id}
                className="p-4 border rounded-xl bg-gradient-to-r from-gray-50 to-purple-50 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{property.name}</h4>
                      <Badge 
                        className={property.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {property.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{property.address}</p>
                    
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Occupancy Rate</span>
                          <span className={`text-xs font-medium ${getOccupancyColor(property.occupancy_rate)}`}>
                            {property.occupancy_rate}%
                          </span>
                        </div>
                        <Progress value={property.occupancy_rate} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Rating</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className={`text-xs font-medium ${getRatingColor(property.average_rating)}`}>
                              {property.average_rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <Progress value={(property.average_rating / 5) * 100} className="h-2" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg text-purple-600">
                      {formatCurrency(property.total_earnings)}
                    </p>
                    <p className="text-xs text-gray-500">Total earnings</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {property.total_bookings} bookings
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {property.views_count} views
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{property.id}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}