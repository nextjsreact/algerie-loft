'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Users, 
  Building, 
  ArrowRightLeft, 
  CheckSquare,
  Square,
  Loader2,
  Search,
  Filter,
  Info,
  AlertTriangle,
  CheckCircle,
  User,
  Home,
  MapPin,
  DollarSign
} from 'lucide-react'
import type { LoftWithRelations } from '@/lib/types'
import type { ExtendedPartnerProfile } from '@/types/partner'

interface PropertyAssignmentSystemProps {
  onAssignmentComplete?: () => void
}

interface BulkOperation {
  type: 'assign' | 'transfer' | 'unassign'
  propertyIds: string[]
  fromPartnerId?: string
  toPartnerId?: string
}

interface AssignmentHistory {
  id: string
  property_id: string
  property_name: string
  from_partner_id?: string
  from_partner_name?: string
  to_partner_id?: string
  to_partner_name?: string
  action: 'assign' | 'transfer' | 'unassign'
  performed_by: string
  performed_at: string
  notes?: string
}

export function PropertyAssignmentSystem({ onAssignmentComplete }: PropertyAssignmentSystemProps) {
  const [properties, setProperties] = useState<LoftWithRelations[]>([])
  const [partners, setPartners] = useState<ExtendedPartnerProfile[]>([])
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [selectedPartner, setSelectedPartner] = useState<string>('')
  const [transferFromPartner, setTransferFromPartner] = useState<string>('')
  const [transferToPartner, setTransferToPartner] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterAssignment, setFilterAssignment] = useState<string>('all')
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState('assignment')

  useEffect(() => {
    fetchProperties()
    fetchPartners()
    fetchAssignmentHistory()
  }, [])

  const fetchProperties = async () => {
    setLoading(true)
    try {
      let url = '/api/admin/lofts'
      const params = new URLSearchParams()
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setProperties(data.lofts || [])
      } else {
        console.error('Failed to fetch properties')
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
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

  const fetchAssignmentHistory = async () => {
    try {
      const response = await fetch('/api/admin/property-assignments/history')
      if (response.ok) {
        const data = await response.json()
        setAssignmentHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error fetching assignment history:', error)
    }
  }

  const handleBulkAssignment = async () => {
    if (selectedProperties.length === 0 || !selectedPartner) {
      alert('Please select properties and a partner')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/property-assignments/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'assign',
          property_ids: selectedProperties,
          partner_id: selectedPartner
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully assigned ${result.updated_count} properties`)
        setSelectedProperties([])
        setSelectedPartner('')
        setShowBulkAssignDialog(false)
        await fetchProperties()
        await fetchAssignmentHistory()
        onAssignmentComplete?.()
      } else {
        const error = await response.json()
        alert(`Failed to assign properties: ${error.error}`)
      }
    } catch (error) {
      console.error('Error in bulk assignment:', error)
      alert('An error occurred during bulk assignment')
    } finally {
      setProcessing(false)
    }
  }

  const handlePropertyTransfer = async () => {
    if (selectedProperties.length === 0 || !transferFromPartner || !transferToPartner) {
      alert('Please select properties, source partner, and destination partner')
      return
    }

    if (transferFromPartner === transferToPartner) {
      alert('Source and destination partners must be different')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/property-assignments/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_ids: selectedProperties,
          from_partner_id: transferFromPartner,
          to_partner_id: transferToPartner
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully transferred ${result.transferred_count} properties`)
        setSelectedProperties([])
        setTransferFromPartner('')
        setTransferToPartner('')
        setShowTransferDialog(false)
        await fetchProperties()
        await fetchAssignmentHistory()
        onAssignmentComplete?.()
      } else {
        const error = await response.json()
        alert(`Failed to transfer properties: ${error.error}`)
      }
    } catch (error) {
      console.error('Error in property transfer:', error)
      alert('An error occurred during property transfer')
    } finally {
      setProcessing(false)
    }
  }

  const handleUnassignProperties = async () => {
    if (selectedProperties.length === 0) {
      alert('Please select properties to unassign')
      return
    }

    if (!confirm(`Are you sure you want to unassign ${selectedProperties.length} properties?`)) {
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/property-assignments/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'unassign',
          property_ids: selectedProperties
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully unassigned ${result.updated_count} properties`)
        setSelectedProperties([])
        await fetchProperties()
        await fetchAssignmentHistory()
        onAssignmentComplete?.()
      } else {
        const error = await response.json()
        alert(`Failed to unassign properties: ${error.error}`)
      }
    } catch (error) {
      console.error('Error in bulk unassignment:', error)
      alert('An error occurred during bulk unassignment')
    } finally {
      setProcessing(false)
    }
  }

  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    )
  }

  const selectAllProperties = () => {
    const filteredProperties = getFilteredProperties()
    if (selectedProperties.length === filteredProperties.length) {
      setSelectedProperties([])
    } else {
      setSelectedProperties(filteredProperties.map(p => p.id))
    }
  }

  const getFilteredProperties = () => {
    return properties.filter(property => {
      const matchesSearch = !searchTerm || 
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || property.status === filterStatus
      
      const matchesAssignment = filterAssignment === 'all' ||
        (filterAssignment === 'assigned' && property.partner_id) ||
        (filterAssignment === 'unassigned' && !property.partner_id)
      
      return matchesSearch && matchesStatus && matchesAssignment
    })
  }

  const getPartnerName = (partnerId: string | null) => {
    if (!partnerId) return 'Unassigned'
    const partner = partners.find(p => p.id === partnerId)
    return partner?.business_name || `Partner ${partnerId.slice(0, 8)}`
  }

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A'
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD'
    }).format(price)
  }

  const renderPropertyCard = (property: LoftWithRelations) => (
    <Card key={property.id} className={`mb-4 ${selectedProperties.includes(property.id) ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selectedProperties.includes(property.id)}
              onCheckedChange={() => togglePropertySelection(property.id)}
            />
            <div>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                {property.name}
              </CardTitle>
              <CardDescription>
                <MapPin className="w-3 h-3 inline mr-1" />
                {property.address}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={property.partner_id ? "default" : "secondary"}>
              {property.partner_id ? "Assigned" : "Unassigned"}
            </Badge>
            <Badge variant="outline" className={
              property.status === 'available' ? 'text-green-600 border-green-600' :
              property.status === 'occupied' ? 'text-blue-600 border-blue-600' :
              'text-orange-600 border-orange-600'
            }>
              {property.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Current Partner:</span>
            <p className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {getPartnerName(property.partner_id)}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Pricing:</span>
            <p className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {formatPrice(property.price_per_month)}/month
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Capacity:</span>
            <p>{property.max_guests} guests • {property.bedrooms} bed • {property.bathrooms} bath</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderAssignmentHistory = () => (
    <div className="space-y-4">
      {assignmentHistory.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No assignment history available.
          </AlertDescription>
        </Alert>
      ) : (
        assignmentHistory.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{entry.property_name}</h4>
                  <div className="text-sm text-gray-600 mt-1">
                    {entry.action === 'assign' && (
                      <span>Assigned to {entry.to_partner_name}</span>
                    )}
                    {entry.action === 'transfer' && (
                      <span>Transferred from {entry.from_partner_name} to {entry.to_partner_name}</span>
                    )}
                    {entry.action === 'unassign' && (
                      <span>Unassigned from {entry.from_partner_name}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(entry.performed_at).toLocaleString()}
                  </div>
                </div>
                <Badge variant="outline" className={
                  entry.action === 'assign' ? 'text-green-600 border-green-600' :
                  entry.action === 'transfer' ? 'text-blue-600 border-blue-600' :
                  'text-orange-600 border-orange-600'
                }>
                  {entry.action}
                </Badge>
              </div>
              {entry.notes && (
                <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                  {entry.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  const filteredProperties = getFilteredProperties()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Property Assignment System</h2>
          <p className="text-gray-600">Manage property assignments and transfers between partners</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchProperties} variant="outline">
            <Loader2 className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                View History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Assignment History</DialogTitle>
                <DialogDescription>
                  View all property assignment and transfer activities
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] pr-4">
                {renderAssignmentHistory()}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assignment">
            <Building className="w-4 h-4 mr-1" />
            Property Assignment
          </TabsTrigger>
          <TabsTrigger value="transfer">
            <ArrowRightLeft className="w-4 h-4 mr-1" />
            Property Transfer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignment" className="space-y-4">
          {/* Filters and Search */}
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
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAssignment} onValueChange={setFilterAssignment}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchProperties}>
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-2 items-center p-4 bg-gray-50 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllProperties}
              className="flex items-center gap-2"
            >
              {selectedProperties.length === filteredProperties.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Select All ({filteredProperties.length})
            </Button>
            
            {selectedProperties.length > 0 && (
              <>
                <Badge variant="secondary">
                  {selectedProperties.length} selected
                </Badge>
                
                <Dialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Users className="w-4 h-4 mr-1" />
                      Bulk Assign
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Property Assignment</DialogTitle>
                      <DialogDescription>
                        Assign {selectedProperties.length} selected properties to a partner
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bulk-partner">Select Partner</Label>
                        <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a partner" />
                          </SelectTrigger>
                          <SelectContent>
                            {partners.map((partner) => (
                              <SelectItem key={partner.id} value={partner.id}>
                                {partner.business_name || `Partner ${partner.id.slice(0, 8)}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowBulkAssignDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkAssignment} disabled={processing}>
                        {processing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Assign Properties
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUnassignProperties}
                  disabled={processing}
                  className="text-orange-600 hover:text-orange-700"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-1" />
                  )}
                  Unassign
                </Button>
              </>
            )}
          </div>

          {/* Properties List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredProperties.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No properties found matching the current filters.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredProperties.map(renderPropertyCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transfer" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Transfer properties between partners. Select properties and specify source and destination partners.
            </AlertDescription>
          </Alert>

          {/* Transfer Interface */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="transfer-from">Transfer From Partner</Label>
              <Select value={transferFromPartner} onValueChange={setTransferFromPartner}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source partner" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.business_name || `Partner ${partner.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transfer-to">Transfer To Partner</Label>
              <Select value={transferToPartner} onValueChange={setTransferToPartner}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination partner" />
                </SelectTrigger>
                <SelectContent>
                  {partners.filter(p => p.id !== transferFromPartner).map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.business_name || `Partner ${partner.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedProperties.length > 0 && transferFromPartner && transferToPartner && (
            <div className="flex justify-center">
              <Button onClick={handlePropertyTransfer} disabled={processing}>
                {processing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                )}
                Transfer {selectedProperties.length} Properties
              </Button>
            </div>
          )}

          {/* Properties List for Transfer */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProperties
                .filter(p => !transferFromPartner || p.partner_id === transferFromPartner)
                .map(renderPropertyCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}