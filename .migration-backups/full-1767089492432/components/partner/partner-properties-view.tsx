"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Grid3X3, 
  List, 
  Search, 
  Filter,
  MapPin,
  Users,
  Bed,
  Bath,
  Square,
  Calendar,
  DollarSign,
  Eye,
  AlertCircle,
  Building2
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Loft, LoftStatus } from "@/lib/types"

interface PropertyFilters {
  search?: string
  status?: LoftStatus | 'all'
  priceRange?: 'all' | 'low' | 'medium' | 'high'
  bedrooms?: 'all' | '1' | '2' | '3' | '4+'
}

interface PartnerPropertyView extends Loft {
  current_occupancy_status: 'available' | 'occupied' | 'maintenance'
  next_reservation?: {
    check_in: string
    check_out: string
    guest_name: string
  }
  revenue_this_month: number
  revenue_last_month: number
  total_reservations: number
  average_rating: number
  last_maintenance_date?: string
  images: string[]
}

interface PartnerPropertiesViewProps {
  partnerId: string
  filters?: PropertyFilters
  viewMode?: 'grid' | 'list'
}

export function PartnerPropertiesView({ 
  partnerId, 
  filters: initialFilters = {},
  viewMode: initialViewMode = 'grid'
}: PartnerPropertiesViewProps) {
  const [properties, setProperties] = useState<PartnerPropertyView[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProperties()
  }, [partnerId, filters])

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        partnerId,
        ...filters
      })
      
      const response = await fetch(`/api/partner/properties?${queryParams}`)
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties)
      } else {
        // Fallback to mock data for development
        setProperties(getMockProperties())
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      setProperties(getMockProperties())
    } finally {
      setLoading(false)
    }
  }

  const getMockProperties = (): PartnerPropertyView[] => [
    {
      id: '1',
      name: 'Luxury Downtown Loft',
      address: '123 Main Street, Algiers',
      description: 'Beautiful modern loft in the heart of the city',
      price_per_month: 150000,
      price_per_night: 8000,
      status: 'available',
      owner_id: 'owner1',
      partner_id: partnerId,
      company_percentage: 20,
      owner_percentage: 80,
      max_guests: 4,
      bedrooms: 2,
      bathrooms: 2,
      area_sqm: 85,
      amenities: ['WiFi', 'Kitchen', 'Parking', 'AC'],
      is_published: true,
      current_occupancy_status: 'available',
      next_reservation: {
        check_in: '2024-12-15',
        check_out: '2024-12-20',
        guest_name: 'Ahmed Benali'
      },
      revenue_this_month: 45000,
      revenue_last_month: 38000,
      total_reservations: 12,
      average_rating: 4.5,
      images: ['/placeholder-property-1.jpg'],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-11-01T15:30:00Z'
    },
    {
      id: '2',
      name: 'Cozy Studio Apartment',
      address: '456 Oak Avenue, Oran',
      description: 'Perfect for business travelers and couples',
      price_per_month: 80000,
      price_per_night: 4500,
      status: 'occupied',
      owner_id: 'owner2',
      partner_id: partnerId,
      company_percentage: 25,
      owner_percentage: 75,
      max_guests: 2,
      bedrooms: 1,
      bathrooms: 1,
      area_sqm: 45,
      amenities: ['WiFi', 'Kitchen', 'AC'],
      is_published: true,
      current_occupancy_status: 'occupied',
      revenue_this_month: 22500,
      revenue_last_month: 27000,
      total_reservations: 8,
      average_rating: 4.2,
      images: ['/placeholder-property-2.jpg'],
      created_at: '2024-02-10T14:00:00Z',
      updated_at: '2024-10-28T09:15:00Z'
    },
    {
      id: '3',
      name: 'Family Villa with Garden',
      address: '789 Garden Street, Constantine',
      description: 'Spacious villa perfect for families',
      price_per_month: 250000,
      price_per_night: 12000,
      status: 'maintenance',
      owner_id: 'owner3',
      partner_id: partnerId,
      company_percentage: 15,
      owner_percentage: 85,
      max_guests: 8,
      bedrooms: 4,
      bathrooms: 3,
      area_sqm: 180,
      amenities: ['WiFi', 'Kitchen', 'Garden', 'Parking', 'AC', 'Pool'],
      is_published: false,
      current_occupancy_status: 'maintenance',
      revenue_this_month: 0,
      revenue_last_month: 48000,
      total_reservations: 6,
      average_rating: 4.8,
      last_maintenance_date: '2024-11-01',
      images: ['/placeholder-property-3.jpg'],
      created_at: '2024-03-05T11:30:00Z',
      updated_at: '2024-11-01T16:45:00Z'
    }
  ]

  const filteredProperties = properties.filter(property => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!property.name.toLowerCase().includes(searchLower) && 
          !property.address.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    
    if (filters.status && filters.status !== 'all') {
      if (property.status !== filters.status) return false
    }
    
    if (filters.bedrooms && filters.bedrooms !== 'all') {
      const bedrooms = property.bedrooms || 0
      if (filters.bedrooms === '4+' && bedrooms < 4) return false
      if (filters.bedrooms !== '4+' && bedrooms !== parseInt(filters.bedrooms)) return false
    }
    
    return true
  })

  const getStatusBadge = (status: LoftStatus, occupancyStatus: string) => {
    if (status === 'maintenance') {
      return <Badge variant="destructive">Maintenance</Badge>
    }
    if (occupancyStatus === 'occupied') {
      return <Badge variant="secondary">Occupied</Badge>
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Available</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const PropertyCard = ({ property }: { property: PartnerPropertyView }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-200 relative">
        {property.images[0] ? (
          <img 
            src={property.images[0]} 
            alt={property.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Building2 className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          {getStatusBadge(property.status, property.current_occupancy_status)}
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge variant="outline" className="bg-white/90">
            ⭐ {property.average_rating.toFixed(1)}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg truncate">{property.name}</h3>
            <p className="text-sm text-gray-600 flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {property.address}
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {property.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="h-3 w-3" />
                {property.bedrooms}
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="h-3 w-3" />
                {property.bathrooms}
              </div>
            )}
            {property.max_guests && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {property.max_guests}
              </div>
            )}
            {property.area_sqm && (
              <div className="flex items-center gap-1">
                <Square className="h-3 w-3" />
                {property.area_sqm}m²
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">
                {formatCurrency(property.price_per_night || 0)}/night
              </p>
              <p className="text-xs text-gray-500">
                {property.total_reservations} reservations
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-green-600">
                {formatCurrency(property.revenue_this_month)}
              </p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
          </div>
          
          {property.next_reservation && (
            <div className="bg-blue-50 p-2 rounded text-xs">
              <p className="font-medium">Next: {property.next_reservation.guest_name}</p>
              <p className="text-gray-600">
                {new Date(property.next_reservation.check_in).toLocaleDateString()} - 
                {new Date(property.next_reservation.check_out).toLocaleDateString()}
              </p>
            </div>
          )}
          
          <Button variant="outline" className="w-full" size="sm">
            <Eye className="h-3 w-3 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const PropertyListItem = ({ property }: { property: PartnerPropertyView }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-24 h-16 bg-gray-200 rounded flex-shrink-0">
            {property.images[0] ? (
              <img 
                src={property.images[0]} 
                alt={property.name}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                <Building2 className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{property.name}</h3>
                <p className="text-sm text-gray-600 truncate flex items-center">
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  {property.address}
                </p>
                
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  {property.bedrooms && (
                    <span className="flex items-center gap-1">
                      <Bed className="h-3 w-3" />
                      {property.bedrooms}
                    </span>
                  )}
                  {property.bathrooms && (
                    <span className="flex items-center gap-1">
                      <Bath className="h-3 w-3" />
                      {property.bathrooms}
                    </span>
                  )}
                  {property.max_guests && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {property.max_guests}
                    </span>
                  )}
                  <span>⭐ {property.average_rating.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 ml-4">
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(property.price_per_night || 0)}/night
                  </p>
                  <p className="text-xs text-green-600">
                    {formatCurrency(property.revenue_this_month)} this month
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  {getStatusBadge(property.status, property.current_occupancy_status)}
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Properties</h1>
          <p className="text-gray-600">
            {filteredProperties.length} of {properties.length} properties
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search properties..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:w-auto"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => setFilters({ ...filters, status: value as LoftStatus | 'all' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.bedrooms || 'all'}
              onValueChange={(value) => setFilters({ ...filters, bedrooms: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bedrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bedrooms</SelectItem>
                <SelectItem value="1">1 Bedroom</SelectItem>
                <SelectItem value="2">2 Bedrooms</SelectItem>
                <SelectItem value="3">3 Bedrooms</SelectItem>
                <SelectItem value="4+">4+ Bedrooms</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => setFilters({})}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Properties Grid/List */}
      {filteredProperties.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No properties found</h3>
          <p className="text-gray-600">
            {filters.search || filters.status !== 'all' || filters.bedrooms !== 'all'
              ? 'Try adjusting your filters to see more properties.'
              : 'You don\'t have any properties yet. Contact your administrator to add properties.'}
          </p>
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        )}>
          {filteredProperties.map((property) => (
            viewMode === 'grid' ? (
              <PropertyCard key={property.id} property={property} />
            ) : (
              <PropertyListItem key={property.id} property={property} />
            )
          ))}
        </div>
      )}
    </div>
  )
}