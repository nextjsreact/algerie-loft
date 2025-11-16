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
    <div className="space-y-6 p-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Partenaires en attente</h1>
        <p className="text-gray-600 mt-1">Gérer les demandes de partenariat en attente de validation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-600">{partners.length}</p>
                <p className="text-sm text-gray-600">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">0</p>
                <p className="text-sm text-gray-600">Approuvés aujourd'hui</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">0</p>
                <p className="text-sm text-gray-600">Rejetés aujourd'hui</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des partenaires */}
      <div className="space-y-4">
        {partners.map((partner) => (
          <Card key={partner.id} className="border-l-4 border-l-amber-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-gray-900">{partner.full_name}</h3>
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      {partner.verification_status === 'pending' ? 'En attente' : partner.verification_status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
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

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    onClick={() => handleShowDetails(partner)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => handleApprove(partner.id)}
                    disabled={actionLoading === partner.id}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {actionLoading === partner.id ? 'En cours...' : 'Approuver'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => handleReject(partner.id)}
                    disabled={actionLoading === partner.id}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {actionLoading === partner.id ? 'En cours...' : 'Rejeter'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {partners.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun partenaire en attente</h3>
            <p className="text-gray-600">Il n'y a actuellement aucune demande de partenariat en attente de validation.</p>
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      {showDetails && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
      )}
    </div>
  )
}