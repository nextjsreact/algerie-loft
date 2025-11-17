"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Clock, Eye, CheckCircle, XCircle } from "lucide-react"
import { useTranslations } from "next-intl"

interface PendingPartner {
  id: string
  full_name: string
  email: string
  business_name?: string
  business_type: 'individual' | 'company'
  phone: string
  address: string
  created_at: string
  verification_status: 'pending' | 'approved' | 'rejected'
}

export function PendingPartnersClient() {
  const [partners, setPartners] = useState<PendingPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [approvedToday, setApprovedToday] = useState(0)
  const [rejectedToday, setRejectedToday] = useState(0)
  const t = useTranslations('partnerPending')

  useEffect(() => {
    fetchPendingPartners()
    fetchTodayStats()
  }, [])

  const fetchPendingPartners = async () => {
    try {
      const response = await fetch('/api/partner/pending')
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending partners')
      }
      
      const data = await response.json()
      setPartners(data.partners || [])
    } catch (error) {
      console.error('Erreur lors du chargement des partenaires:', error)
      setPartners([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayStats = async () => {
    try {
      const response = await fetch('/api/partner/today-stats')
      
      if (!response.ok) {
        console.warn('Failed to fetch today stats, using defaults')
        return
      }
      
      const data = await response.json()
      setApprovedToday(data.approved || 0)
      setRejectedToday(data.rejected || 0)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      // Keep default values (0) if fetch fails
    }
  }

  const [selectedPartner, setSelectedPartner] = useState<PendingPartner | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleShowDetails = (partner: PendingPartner) => {
    setSelectedPartner(partner)
    setShowDetails(true)
  }

  const handleApprove = async (partnerId: string) => {
    if (!confirm(t('actions.confirmApprove'))) {
      return
    }

    setActionLoading(partnerId)
    try {
      const response = await fetch('/api/partner/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId })
      })

      if (!response.ok) {
        throw new Error('Failed to approve partner')
      }

      // Refresh the list and stats
      await fetchPendingPartners()
      await fetchTodayStats()
      alert(t('actions.approveSuccess'))
    } catch (error) {
      console.error('Error approving partner:', error)
      alert(t('actions.approveError'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (partnerId: string) => {
    const reason = prompt(t('actions.rejectReason'))
    if (reason === null) return // User cancelled

    setActionLoading(partnerId)
    try {
      const response = await fetch('/api/partner/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, reason })
      })

      if (!response.ok) {
        throw new Error('Failed to reject partner')
      }

      // Refresh the list and stats
      await fetchPendingPartners()
      await fetchTodayStats()
      alert(t('actions.rejectSuccess'))
    } catch (error) {
      console.error('Error rejecting partner:', error)
      alert(t('actions.rejectError'))
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Title Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <UserPlus className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-gray-600 mt-1">{t('description')}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-600">{partners.length}</p>
                <p className="text-sm text-gray-600 font-medium">{t('stats.pending')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{approvedToday}</p>
                <p className="text-sm text-gray-600 font-medium">{t('stats.approvedToday')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{rejectedToday}</p>
                <p className="text-sm text-gray-600 font-medium">{t('stats.rejectedToday')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des partenaires */}
      <div className="space-y-6">
        {partners.map((partner) => (
          <Card key={partner.id} className="border-l-4 border-l-amber-500 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-gray-900">{partner.full_name}</h3>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-300 px-3 py-1">
                      {partner.verification_status === 'pending' ? t('status.pending') : partner.verification_status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                    <div>
                      <p><strong>{t('list.email')}:</strong> {partner.email}</p>
                      <p><strong>{t('list.phone')}:</strong> {partner.phone}</p>
                      <p><strong>{t('list.address')}:</strong> {partner.address}</p>
                    </div>
                    <div>
                      {partner.business_name && (
                        <p><strong>{t('list.company')}:</strong> {partner.business_name}</p>
                      )}
                      <p><strong>{t('list.type')}:</strong> {partner.business_type === 'company' ? t('businessTypes.company') : t('businessTypes.individual')}</p>
                      <p><strong>{t('list.requestCreated')}:</strong> {new Date(partner.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:min-w-[200px] lg:items-end">
                  <Button
                    variant="outline"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:border-blue-700 transition-colors w-full lg:w-auto"
                    onClick={() => handleShowDetails(partner)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {t('list.viewDetails')}
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white shadow-md w-full lg:w-auto"
                    onClick={() => handleApprove(partner.id)}
                    disabled={actionLoading === partner.id}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {actionLoading === partner.id ? t('list.processing') : t('list.approve')}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50 hover:border-red-700 transition-colors w-full lg:w-auto"
                    onClick={() => handleReject(partner.id)}
                    disabled={actionLoading === partner.id}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {actionLoading === partner.id ? t('list.processing') : t('list.reject')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {partners.length === 0 && (
        <Card className="shadow-md">
          <CardContent className="p-12 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <UserPlus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('list.noPending')}</h3>
            <p className="text-gray-600 text-lg">{t('list.noPendingMessage')}</p>
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      {showDetails && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 md:pl-72">
          <div className="w-full max-w-3xl">
            <Card className="w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('details.title')}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedPartner.full_name}</h3>
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  {selectedPartner.verification_status === 'pending' ? t('stats.pending') : selectedPartner.verification_status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">{t('details.email')}</p>
                  <p className="text-sm text-gray-600">{selectedPartner.email}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{t('details.phone')}</p>
                  <p className="text-sm text-gray-600">{selectedPartner.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{t('details.type')}</p>
                  <p className="text-sm text-gray-600">
                    {selectedPartner.business_type === 'company' ? t('businessTypes.company') : t('businessTypes.individual')}
                  </p>
                </div>
                {selectedPartner.business_name && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{t('details.businessName')}</p>
                    <p className="text-sm text-gray-600">{selectedPartner.business_name}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700">{t('details.address')}</p>
                <p className="text-sm text-gray-600">{selectedPartner.address}</p>
              </div>

              {(selectedPartner as any).portfolio_description && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">{t('details.description')}</p>
                  <p className="text-sm text-gray-600">{(selectedPartner as any).portfolio_description}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-gray-700">{t('details.requestDate')}</p>
                <p className="text-sm text-gray-600">
                  {new Date(selectedPartner.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowDetails(false)
                    handleApprove(selectedPartner.id)
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('details.approve')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => {
                    setShowDetails(false)
                    handleReject(selectedPartner.id)
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('details.reject')}
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}