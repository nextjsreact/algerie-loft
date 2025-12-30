"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Edit, 
  Eye, 
  MapPin, 
  DollarSign,
  Star,
  Calendar,
  Image as ImageIcon,
  Settings,
  TrendingUp,
  Users
} from 'lucide-react'

interface Property {
  id: string
  name: string
  address: string
  description?: string
  price_per_night: number
  status: 'available' | 'occupied' | 'maintenance'
  images?: string[]
  amenities?: string[]
  average_rating: number
  review_count: number
  total_bookings: number
  total_earnings: number
  occupancy_rate: number
  created_at: string
}

interface PropertyCardProps {
  property: Property
  onEdit: () => void
  formatCurrency: (amount: number) => string
}

export function PropertyCard({ property, onEdit, formatCurrency }: PropertyCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'occupied':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
      {/* Property Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt={property.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={getStatusColor(property.status)}>
            {property.status}
          </Badge>
        </div>

        {/* Image Count */}
        {property.images && property.images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            <ImageIcon className="h-3 w-3 inline mr-1" />
            {property.images.length}
          </div>
        )}
      </div>

      <CardContent className="p-6">
        {/* Property Info */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{property.name}</h3>
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{property.address}</span>
          </div>
          
          {property.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {property.description}
            </p>
          )}

          {/* Price and Rating */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(property.price_per_night)}
              </span>
              <span className="text-sm text-gray-500 ml-1">/night</span>
            </div>
            
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
              <span className="font-medium">{property.average_rating.toFixed(1)}</span>
              <span className="text-sm text-gray-500 ml-1">({property.review_count})</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Calendar className="h-3 w-3 text-blue-500 mr-1" />
            </div>
            <p className="text-xs text-gray-600">Bookings</p>
            <p className="font-bold text-blue-600">{property.total_bookings}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            </div>
            <p className="text-xs text-gray-600">Earnings</p>
            <p className="font-bold text-green-600 text-xs">
              {formatCurrency(property.total_earnings)}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-3 w-3 text-purple-500 mr-1" />
            </div>
            <p className="text-xs text-gray-600">Occupancy</p>
            <p className={`font-bold ${getOccupancyColor(property.occupancy_rate)}`}>
              {property.occupancy_rate}%
            </p>
          </div>
        </div>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {property.amenities.slice(0, 3).map((amenity, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {property.amenities.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{property.amenities.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {/* Handle view */}}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Handle settings */}}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}