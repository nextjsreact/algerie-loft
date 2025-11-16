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

  const handleApprove = async (partnerId: string) => {
    // Implémenter l'approbation du partenaire
    console.log('Approuver partenaire:', partnerId)
  }

  const handleReject = async (partnerId: string) => {
    // Implémenter le rejet du partenaire
    console.log('Rejeter partenaire:', partnerId)
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
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => handleApprove(partner.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approuver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => handleReject(partner.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeter
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
    </div>
  )
}