'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  Loader2,
  Eye,
  Download,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react'
import type { 
  PartnerValidationRequest, 
  ExtendedPartnerProfile,
  PartnerApprovalRequest,
  PartnerRejectionRequest 
} from '@/types/partner'

interface AdminPartnerValidationProps {
  locale?: string
}

export function AdminPartnerValidation({ locale = 'fr' }: AdminPartnerValidationProps) {
  const [validationRequests, setValidationRequests] = useState<PartnerValidationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({})
  const [selectedPartner, setSelectedPartner] = useState<PartnerValidationRequest | null>(null)
  const [partnerDocuments, setPartnerDocuments] = useState<Array<{path: string, url: string, name: string}>>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)

  useEffect(() => {
    fetchValidationRequests()
  }, [activeTab])

  const fetchValidationRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/partners/validation-requests?status=${activeTab}`)
      if (response.ok) {
        const data = await response.json()
        setValidationRequests(data.requests || [])
      } else {
        console.error('Failed to fetch validation requests')
      }
    } catch (error) {
      console.error('Error fetching validation requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPartnerDocuments = async (partnerId: string) => {
    setLoadingDocuments(true)
    try {
      const response = await fetch(`/api/partner/documents/upload?partnerId=${partnerId}`)
      if (response.ok) {
        const data = await response.json()
        setPartnerDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching partner documents:', error)
      setPartnerDocuments([])
    } finally {
      setLoadingDocuments(false)
    }
  }

  const handleApproval = async (partnerId: string) => {
    setProcessingId(partnerId)
    try {
      const approvalData: PartnerApprovalRequest = {
        admin_notes: adminNotes[partnerId] || undefined
      }

      const response = await fetch(`/api/admin/partners/${partnerId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData)
      })

      if (response.ok) {
        await fetchValidationRequests()
        setAdminNotes(prev => ({ ...prev, [partnerId]: '' }))
        // Show success message
        alert('Partner approved successfully! Approval email has been sent.')
      } else {
        const error = await response.json()
        alert(`Failed to approve partner: ${error.error}`)
      }
    } catch (error) {
      console.error('Error approving partner:', error)
      alert('An error occurred while approving the partner')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejection = async (partnerId: string) => {
    const reason = rejectionReason[partnerId]
    if (!reason || reason.trim().length === 0) {
      alert('Please provide a rejection reason')
      return
    }

    setProcessingId(partnerId)
    try {
      const rejectionData: PartnerRejectionRequest = {
        rejection_reason: reason,
        admin_notes: adminNotes[partnerId] || undefined
      }

      const response = await fetch(`/api/admin/partners/${partnerId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rejectionData)
      })

      if (response.ok) {
        await fetchValidationRequests()
        setAdminNotes(prev => ({ ...prev, [partnerId]: '' }))
        setRejectionReason(prev => ({ ...prev, [partnerId]: '' }))
        // Show success message
        alert('Partner rejected. Rejection email has been sent.')
      } else {
        const error = await response.json()
        alert(`Failed to reject partner: ${error.error}`)
      }
    } catch (error) {
      console.error('Error rejecting partner:', error)
      alert('An error occurred while rejecting the partner')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderPartnerDetails = (request: PartnerValidationRequest) => {
    const data = request.submitted_data
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Personal Information</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Full Name:</span>
                <span>{data.personal_info.full_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Email:</span>
                <span>{data.personal_info.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Phone:</span>
                <span>{data.personal_info.phone}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <span className="font-medium">Address:</span>
                  <p className="text-gray-600 mt-1">{data.personal_info.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Business Information</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {data.business_info.business_type === 'company' ? 
                  <Building className="w-4 h-4 text-gray-500" /> : 
                  <User className="w-4 h-4 text-gray-500" />
                }
                <span className="font-medium">Type:</span>
                <span className="capitalize">
                  {data.business_info.business_type === 'company' ? 'Company' : 'Individual'}
                </span>
              </div>
              {data.business_info.business_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Business Name:</span>
                  <span>{data.business_info.business_name}</span>
                </div>
              )}
              {data.business_info.tax_id && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Tax ID:</span>
                  <span>{data.business_info.tax_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio Description */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Property Portfolio Description</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed">{data.portfolio_description}</p>
          </div>
        </div>

        {/* Submission Details */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Submitted: {formatDate(request.created_at)}</span>
            </div>
            {request.processed_at && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Processed: {formatDate(request.processed_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderValidationCard = (request: PartnerValidationRequest) => (
    <Card key={request.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {request.submitted_data.business_info.business_type === 'company' ? 
                <Building className="w-4 h-4" /> : 
                <User className="w-4 h-4" />
              }
              {request.submitted_data.business_info.business_name || request.submitted_data.personal_info.full_name}
            </CardTitle>
            <CardDescription>
              Submitted on {formatDate(request.created_at)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(request.status)}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedPartner(request)
                    if (request.partner_id) {
                      fetchPartnerDocuments(request.partner_id)
                    }
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Partner Application Details</DialogTitle>
                  <DialogDescription>
                    Review the complete partner application and supporting documents
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                  {selectedPartner && renderPartnerDetails(selectedPartner)}
                  
                  {/* Documents Section */}
                  <Separator className="my-6" />
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Verification Documents</h4>
                    {loadingDocuments ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading documents...
                      </div>
                    ) : partnerDocuments.length > 0 ? (
                      <div className="space-y-2">
                        {partnerDocuments.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium">{doc.name}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc.url, '_blank')}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Info className="w-4 h-4" />
                        No documents uploaded
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Contact:</span>
            <p>{request.submitted_data.personal_info.email}</p>
            <p>{request.submitted_data.personal_info.phone}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Business Type:</span>
            <p className="capitalize">{request.submitted_data.business_info.business_type}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Location:</span>
            <p className="text-xs text-gray-500">{request.submitted_data.personal_info.address}</p>
          </div>
        </div>

        {/* Portfolio Preview */}
        <div>
          <span className="font-medium text-gray-600 text-sm">Portfolio Description:</span>
          <p className="text-sm text-gray-700 mt-1 line-clamp-2">
            {request.submitted_data.portfolio_description}
          </p>
        </div>

        {/* Action Buttons for Pending Requests */}
        {request.status === 'pending' && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`notes-${request.id}`}>Admin Notes (Optional)</Label>
                <Textarea
                  id={`notes-${request.id}`}
                  placeholder="Add internal notes about this application..."
                  value={adminNotes[request.id] || ''}
                  onChange={(e) => setAdminNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor={`rejection-${request.id}`}>Rejection Reason (Required for rejection)</Label>
                <Textarea
                  id={`rejection-${request.id}`}
                  placeholder="Explain why this application is being rejected..."
                  value={rejectionReason[request.id] || ''}
                  onChange={(e) => setRejectionReason(prev => ({ ...prev, [request.id]: e.target.value }))}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => handleApproval(request.partner_id)}
                disabled={processingId === request.partner_id}
                className="bg-green-600 hover:bg-green-700"
              >
                {processingId === request.partner_id ? 
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 
                  <CheckCircle className="w-4 h-4 mr-2" />
                }
                Approve Partner
              </Button>
              <Button
                onClick={() => handleRejection(request.partner_id)}
                disabled={processingId === request.partner_id || !rejectionReason[request.id]}
                variant="destructive"
              >
                {processingId === request.partner_id ? 
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 
                  <XCircle className="w-4 h-4 mr-2" />
                }
                Reject Application
              </Button>
            </div>
          </div>
        )}

        {/* Show processing details for approved/rejected */}
        {request.status !== 'pending' && (
          <div className="border-t pt-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                {request.status === 'approved' ? 
                  <CheckCircle className="w-4 h-4 text-green-600" /> :
                  <XCircle className="w-4 h-4 text-red-600" />
                }
                <span className="font-medium">
                  {request.status === 'approved' ? 'Approved' : 'Rejected'} 
                  {request.processed_at && ` on ${formatDate(request.processed_at)}`}
                </span>
              </div>
              {request.processed_by_user && (
                <p className="text-xs text-gray-500 mt-1">
                  By: {request.processed_by_user.full_name}
                </p>
              )}
              {request.admin_notes && (
                <div className="mt-2">
                  <span className="text-xs font-medium text-gray-600">Admin Notes:</span>
                  <p className="text-xs text-gray-700 mt-1">{request.admin_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Partner Validation</h2>
          <p className="text-gray-600">Review and approve partner applications</p>
        </div>
        <Button onClick={fetchValidationRequests} variant="outline">
          <Loader2 className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Review
            {validationRequests.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {validationRequests.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            <CheckCircle className="w-4 h-4 mr-1" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <XCircle className="w-4 h-4 mr-1" />
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : validationRequests.filter(r => r.status === 'pending').length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No pending partner applications at this time.
              </AlertDescription>
            </Alert>
          ) : (
            validationRequests
              .filter(r => r.status === 'pending')
              .map(renderValidationCard)
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : validationRequests.filter(r => r.status === 'approved').length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No approved partners yet.
              </AlertDescription>
            </Alert>
          ) : (
            validationRequests
              .filter(r => r.status === 'approved')
              .map(renderValidationCard)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : validationRequests.filter(r => r.status === 'rejected').length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No rejected applications.
              </AlertDescription>
            </Alert>
          ) : (
            validationRequests
              .filter(r => r.status === 'rejected')
              .map(renderValidationCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}