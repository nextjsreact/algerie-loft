'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building, 
  User, 
  MapPin,
  DollarSign,
  Loader2,
  Eye,
  Search,
  Filter,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Users,
  Home,
  Calendar,
  Settings
} from 'lucide-react'
import type { Loft, LoftWithRelations } from '@/lib/types'
import type { ExtendedPartnerProfile } from '@/types/partner'
import { PropertyDeletionSafeguards } from './PropertyDeletionSafeguards'

interface AdminLoftManagementProps {
  partnerId?: string
  loftId?: string
  mode?: 'create' | 'edit' | 'view' | 'list'
}

interface LoftFormData {
  name: string
  address: string
  description: string
  price_per_month: number
  price_per_night: number
  status: 'available' | 'occupied' | 'maintenance'
  partner_id: string
  max_guests: number
  bedrooms: number
  bathrooms: number
  area_sqm: number
  amenities: string[]
  is_published: boolean
  maintenance_notes: string
  availability_notes: string
}

interface LoftFormErrors {
  name?: string
  address?: string
  price_per_month?: string
  price_per_night?: string
  partner_id?: string
  max_guests?: string
  bedrooms?: string
  bathrooms?: string
  area_sqm?: string
}

export function AdminLoftManagement({ 
  partnerId, 
  loftId, 
  mode = 'list' 
}: AdminLoftManagementProps) {
  const [lofts, setLofts] = useState<LoftWithRelations[]>([])
  const [partners, setPartners] = useState<ExtendedPartnerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPartner, setSelectedPartner] = useState<string>('')
  const [selectedLoft, setSelectedLoft] = useState<LoftWithRelations | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeletionSafeguards, setShowDeletionSafeguards] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<LoftFormData>({
    name: '',
    address: '',
    description: '',
    price_per_month: 0,
    price_per_night: 0,
    status: 'available',
    partner_id: partnerId || '',
    max_guests: 1,
    bedrooms: 1,
    bathrooms: 1,
    area_sqm: 0,
    amenities: [],
    is_published: false,
    maintenance_notes: '',
    availability_notes: ''
  })
  const [formErrors, setFormErrors] = useState<LoftFormErrors>({})

  useEffect(() => {
    fetchLofts()
    fetchPartners()
  }, [activeTab, partnerId])

  const fetchLofts = async () => {
    setLoading(true)
    try {
      let url = '/api/admin/lofts'
      const params = new URLSearchParams()
      
      if (partnerId) {
        params.append('partner_id', partnerId)
      }
      if (activeTab !== 'all') {
        params.append('status', activeTab)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      if (selectedPartner) {
        params.append('partner_id', selectedPartner)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setLofts(data.lofts || [])
      } else {
        console.error('Failed to fetch lofts')
      }
    } catch (error) {
      console.error('Error fetching lofts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/admin/partners?status=approved')
      if (response.ok) {
        const data = await response.json()
        setPartners(data.partners || [])
      }
    } catch (error) {
      console.error('Error fetching partners:', error)
    }
  }

  const validateForm = (): boolean => {
    const errors: LoftFormErrors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Property name is required'
    }
    if (!formData.address.trim()) {
      errors.address = 'Address is required'
    }
    if (!formData.partner_id) {
      errors.partner_id = 'Partner assignment is required'
    }
    if (formData.price_per_month <= 0) {
      errors.price_per_month = 'Monthly price must be greater than 0'
    }
    if (formData.price_per_night <= 0) {
      errors.price_per_night = 'Nightly price must be greater than 0'
    }
    if (formData.max_guests <= 0) {
      errors.max_guests = 'Maximum guests must be at least 1'
    }
    if (formData.bedrooms <= 0) {
      errors.bedrooms = 'Number of bedrooms must be at least 1'
    }
    if (formData.bathrooms <= 0) {
      errors.bathrooms = 'Number of bathrooms must be at least 1'
    }
    if (formData.area_sqm <= 0) {
      errors.area_sqm = 'Area must be greater than 0'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateLoft = async () => {
    if (!validateForm()) return

    setProcessingId('create')
    try {
      const response = await fetch('/api/admin/lofts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchLofts()
        setShowCreateDialog(false)
        resetForm()
        alert('Property created successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to create property: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating loft:', error)
      alert('An error occurred while creating the property')
    } finally {
      setProcessingId(null)
    }
  }

  const handleEditLoft = async () => {
    if (!selectedLoft || !validateForm()) return

    setProcessingId(selectedLoft.id)
    try {
      const response = await fetch(`/api/admin/lofts/${selectedLoft.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchLofts()
        setShowEditDialog(false)
        setSelectedLoft(null)
        resetForm()
        alert('Property updated successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to update property: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating loft:', error)
      alert('An error occurred while updating the property')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteLoft = async (deletionData: any) => {
    if (!selectedLoft) return

    setProcessingId(selectedLoft.id)
    try {
      const response = await fetch(`/api/admin/lofts/${selectedLoft.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deletionData)
      })

      if (response.ok) {
        await fetchLofts()
        setShowDeletionSafeguards(false)
        setSelectedLoft(null)
        alert('Property deleted successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to delete property: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting loft:', error)
      alert('An error occurred while deleting the property')
    } finally {
      setProcessingId(null)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      description: '',
      price_per_month: 0,
      price_per_night: 0,
      status: 'available',
      partner_id: partnerId || '',
      max_guests: 1,
      bedrooms: 1,
      bathrooms: 1,
      area_sqm: 0,
      amenities: [],
      is_published: false,
      maintenance_notes: '',
      availability_notes: ''
    })
    setFormErrors({})
  }

  const openEditDialog = (loft: LoftWithRelations) => {
    setSelectedLoft(loft)
    setFormData({
      name: loft.name,
      address: loft.address,
      description: loft.description || '',
      price_per_month: loft.price_per_month || 0,
      price_per_night: loft.price_per_night || 0,
      status: loft.status,
      partner_id: loft.partner_id || '',
      max_guests: loft.max_guests || 1,
      bedrooms: loft.bedrooms || 1,
      bathrooms: loft.bathrooms || 1,
      area_sqm: loft.area_sqm || 0,
      amenities: loft.amenities || [],
      is_published: loft.is_published || false,
      maintenance_notes: loft.maintenance_notes || '',
      availability_notes: loft.availability_notes || ''
    })
    setShowEditDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Available
          </Badge>
        )
      case 'occupied':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Users className="w-3 h-3 mr-1" />
            Occupied
          </Badge>
        )
      case 'maintenance':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <Settings className="w-3 h-3 mr-1" />
            Maintenance
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A'
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD'
    }).format(price)
  }

  const renderLoftCard = (loft: LoftWithRelations) => (
    <Card key={loft.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              {loft.name}
            </CardTitle>
            <CardDescription>
              <MapPin className="w-3 h-3 inline mr-1" />
              {loft.address}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(loft.status)}
            {loft.is_published && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Published
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Partner:</span>
            <p>{loft.owner_name || 'Unassigned'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Pricing:</span>
            <p>Monthly: {formatPrice(loft.price_per_month)}</p>
            <p>Nightly: {formatPrice(loft.price_per_night)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Capacity:</span>
            <p>{loft.max_guests} guests • {loft.bedrooms} bed • {loft.bathrooms} bath</p>
            <p>Area: {loft.area_sqm} m²</p>
          </div>
        </div>

        {/* Description */}
        {loft.description && (
          <div>
            <span className="font-medium text-gray-600 text-sm">Description:</span>
            <p className="text-sm text-gray-700 mt-1 line-clamp-2">
              {loft.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t pt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditDialog(loft)}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedLoft(loft)
              setShowDeletionSafeguards(true)
            }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderLoftForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Property Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter property name"
            className={formErrors.name ? 'border-red-500' : ''}
          />
          {formErrors.name && (
            <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="partner_id">Assign to Partner *</Label>
          <Select
            value={formData.partner_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, partner_id: value }))}
          >
            <SelectTrigger className={formErrors.partner_id ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select a partner" />
            </SelectTrigger>
            <SelectContent>
              {partners.map((partner) => (
                <SelectItem key={partner.id} value={partner.id}>
                  {partner.business_name || `Partner ${partner.id.slice(0, 8)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.partner_id && (
            <p className="text-sm text-red-600 mt-1">{formErrors.partner_id}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Enter property address"
          className={formErrors.address ? 'border-red-500' : ''}
        />
        {formErrors.address && (
          <p className="text-sm text-red-600 mt-1">{formErrors.address}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter property description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price_per_month">Monthly Price (DZD) *</Label>
          <Input
            id="price_per_month"
            type="number"
            value={formData.price_per_month}
            onChange={(e) => setFormData(prev => ({ ...prev, price_per_month: Number(e.target.value) }))}
            placeholder="0"
            className={formErrors.price_per_month ? 'border-red-500' : ''}
          />
          {formErrors.price_per_month && (
            <p className="text-sm text-red-600 mt-1">{formErrors.price_per_month}</p>
          )}
        </div>

        <div>
          <Label htmlFor="price_per_night">Nightly Price (DZD) *</Label>
          <Input
            id="price_per_night"
            type="number"
            value={formData.price_per_night}
            onChange={(e) => setFormData(prev => ({ ...prev, price_per_night: Number(e.target.value) }))}
            placeholder="0"
            className={formErrors.price_per_night ? 'border-red-500' : ''}
          />
          {formErrors.price_per_night && (
            <p className="text-sm text-red-600 mt-1">{formErrors.price_per_night}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="max_guests">Max Guests *</Label>
          <Input
            id="max_guests"
            type="number"
            value={formData.max_guests}
            onChange={(e) => setFormData(prev => ({ ...prev, max_guests: Number(e.target.value) }))}
            min="1"
            className={formErrors.max_guests ? 'border-red-500' : ''}
          />
          {formErrors.max_guests && (
            <p className="text-sm text-red-600 mt-1">{formErrors.max_guests}</p>
          )}
        </div>

        <div>
          <Label htmlFor="bedrooms">Bedrooms *</Label>
          <Input
            id="bedrooms"
            type="number"
            value={formData.bedrooms}
            onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
            min="1"
            className={formErrors.bedrooms ? 'border-red-500' : ''}
          />
          {formErrors.bedrooms && (
            <p className="text-sm text-red-600 mt-1">{formErrors.bedrooms}</p>
          )}
        </div>

        <div>
          <Label htmlFor="bathrooms">Bathrooms *</Label>
          <Input
            id="bathrooms"
            type="number"
            value={formData.bathrooms}
            onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
            min="1"
            className={formErrors.bathrooms ? 'border-red-500' : ''}
          />
          {formErrors.bathrooms && (
            <p className="text-sm text-red-600 mt-1">{formErrors.bathrooms}</p>
          )}
        </div>

        <div>
          <Label htmlFor="area_sqm">Area (m²) *</Label>
          <Input
            id="area_sqm"
            type="number"
            value={formData.area_sqm}
            onChange={(e) => setFormData(prev => ({ ...prev, area_sqm: Number(e.target.value) }))}
            min="1"
            className={formErrors.area_sqm ? 'border-red-500' : ''}
          />
          {formErrors.area_sqm && (
            <p className="text-sm text-red-600 mt-1">{formErrors.area_sqm}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: 'available' | 'occupied' | 'maintenance') => 
              setFormData(prev => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <input
            type="checkbox"
            id="is_published"
            checked={formData.is_published}
            onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
            className="rounded"
          />
          <Label htmlFor="is_published">Published (visible to clients)</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="maintenance_notes">Maintenance Notes</Label>
          <Textarea
            id="maintenance_notes"
            value={formData.maintenance_notes}
            onChange={(e) => setFormData(prev => ({ ...prev, maintenance_notes: e.target.value }))}
            placeholder="Internal maintenance notes"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="availability_notes">Availability Notes</Label>
          <Textarea
            id="availability_notes"
            value={formData.availability_notes}
            onChange={(e) => setFormData(prev => ({ ...prev, availability_notes: e.target.value }))}
            placeholder="Availability restrictions or notes"
            rows={2}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Property Management</h2>
          <p className="text-gray-600">Manage partner properties and assignments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchLofts} variant="outline">
            <Loader2 className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Create New Property</DialogTitle>
                <DialogDescription>
                  Add a new property and assign it to a partner
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] pr-4">
                {renderLoftForm()}
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateLoft}
                  disabled={processingId === 'create'}
                >
                  {processingId === 'create' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Property
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedPartner} onValueChange={setSelectedPartner}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by partner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Partners</SelectItem>
            {partners.map((partner) => (
              <SelectItem key={partner.id} value={partner.id}>
                {partner.business_name || `Partner ${partner.id.slice(0, 8)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchLofts}>
          <Filter className="w-4 h-4 mr-2" />
          Apply Filters
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All Properties
            {lofts.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {lofts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="available">
            <CheckCircle className="w-4 h-4 mr-1" />
            Available
          </TabsTrigger>
          <TabsTrigger value="occupied">
            <Users className="w-4 h-4 mr-1" />
            Occupied
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Settings className="w-4 h-4 mr-1" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : lofts.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No properties found matching the current filters.
              </AlertDescription>
            </Alert>
          ) : (
            lofts.map(renderLoftCard)
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Update property information and partner assignment
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {renderLoftForm()}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditLoft}
              disabled={processingId === selectedLoft?.id}
            >
              {processingId === selectedLoft?.id ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Edit className="w-4 h-4 mr-2" />
              )}
              Update Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Property Deletion Safeguards */}
      {selectedLoft && (
        <PropertyDeletionSafeguards
          property={selectedLoft}
          isOpen={showDeletionSafeguards}
          onClose={() => setShowDeletionSafeguards(false)}
          onConfirmDelete={handleDeleteLoft}
        />
      )}
    </div>
  )
}