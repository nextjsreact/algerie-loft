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
  const t = useTranslations('partner')

  useEffect(() => {
    fetchPendingPartners()
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

  const [selectedPartner, setSelectedPartner] = useState<PendingPartner | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleShowDetails = (partner: PendingPartner) => {
    setSelectedPartner(partner)
    setShowDetails(true)
  }

  const handleApprove = async (partnerId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir approuver ce partenaire ?')) {
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

      // Refresh the list
      await fetchPendingPartners()
      alert('Partenaire approuvé avec succès!')
    } catch (error) {
      console.error('Error approving partner:', error)
      alert('Erreur lors de l\'approbation du partenaire')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (partnerId: string) => {
    const reason = prompt('Raison du rejet (optionnel):')
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

      // Refresh the list
      await fetchPendingPartners()
      alert('Partenaire rejeté')
    } catch (error) {
      console.error('Error rejecting partner:', error)
      alert('Erreur lors du rejet du partenaire')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement des partenaires en attente...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container max-w-[1600px] mx-auto space-y-8 px-8 py-8">
        {/* Title Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <UserPlus className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Partenaires en attente</h1>
              <p className="text-gray-600 mt-1">Gérer les demandes de partenariat en attente de validation</p>
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
                <p className="text-sm text-gray-600 font-medium">En attente</p>
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
                <p className="text-3xl font-bold text-green-600">0</p>
                <p className="text-sm text-gray-600 font-medium">Approuvés aujourd'hui</p>
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
                <p className="text-3xl font-bold text-red-600">0</p>
                <p className="text-sm text-gray-600 font-medium">Rejetés aujourd'hui</p>
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
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-gray-900">{partner.full_name}</h3>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-300 px-3 py-1">
                      {partner.verification_status === 'pending' ? '⏳ En attente' : partner.verification_status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                    <div>
                      <p><strong>Email:</strong> {partner.email}</p>
                      <p><strong>Téléphone:</strong> {partner.phone}</p>
                      <p><strong>Adresse:</strong> {partner.address}</p>
                    </div>
                    <div>
                      {partner.business_name && (
                        <p><strong>Entreprise:</strong> {partner.business_name}</p>
                      )}
                      <p><strong>Type:</strong> {partner.business_type === 'company' ? 'Entreprise' : 'Particulier'}</p>
                      <p><strong>Demande créée:</strong> {new Date(partner.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:border-blue-700 transition-colors"
                    onClick={() => handleShowDetails(partner)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir détails
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                    onClick={() => handleApprove(partner.id)}
                    disabled={actionLoading === partner.id}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {actionLoading === partner.id ? 'En cours...' : 'Approuver'}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50 hover:border-red-700 transition-colors"
                    onClick={() => handleReject(partner.id)}
                    disabled={actionLoading === partner.id}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {actionLoading === partner.id ? 'En cours...' : 'Rejeter'}
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
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucun partenaire en attente</h3>
            <p className="text-gray-600 text-lg">Il n'y a actuellement aucune demande de partenariat en attente de validation.</p>
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      {showDetails && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999]">
          <div className="flex items-center justify-center min-h-screen p-4 md:pl-72">
            <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Détails du partenaire</CardTitle>
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
                  {selectedPartner.verification_status === 'pending' ? 'En attente' : selectedPartner.verification_status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Email</p>
                  <p className="text-sm text-gray-600">{selectedPartner.email}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Téléphone</p>
                  <p className="text-sm text-gray-600">{selectedPartner.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Type</p>
                  <p className="text-sm text-gray-600">
                    {selectedPartner.business_type === 'company' ? 'Entreprise' : 'Particulier'}
                  </p>
                </div>
                {selectedPartner.business_name && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Nom de l'entreprise</p>
                    <p className="text-sm text-gray-600">{selectedPartner.business_name}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700">Adresse</p>
                <p className="text-sm text-gray-600">{selectedPartner.address}</p>
              </div>

              {(selectedPartner as any).portfolio_description && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">Description</p>
                  <p className="text-sm text-gray-600">{(selectedPartner as any).portfolio_description}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-gray-700">Date de demande</p>
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
                  Approuver
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
                  Rejeter
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