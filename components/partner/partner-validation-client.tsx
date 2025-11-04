"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Search, FileText, User, Building } from "lucide-react"
import { useTranslations } from "next-intl"

interface Partner {
  id: string
  full_name: string
  email: string
  business_name?: string
  business_type: 'individual' | 'company'
  phone: string
  address: string
  tax_id?: string
  verification_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  approved_at?: string
  rejected_at?: string
  notes?: string
}

export function PartnerValidationClient() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [validationNotes, setValidationNotes] = useState("")
  const t = useTranslations('partner')

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    try {
      // Simulation de données pour la validation des partenaires
      const mockData: Partner[] = [
        {
          id: '1',
          full_name: 'Ahmed Benali',
          email: 'ahmed.benali@email.com',
          business_name: 'Benali Immobilier',
          business_type: 'company',
          phone: '+213 555 123 456',
          address: 'Alger Centre, Algérie',
          tax_id: 'ALG123456789',
          verification_status: 'pending',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          full_name: 'Fatima Khelifi',
          email: 'fatima.khelifi@email.com',
          business_type: 'individual',
          phone: '+213 555 789 012',
          address: 'Oran, Algérie',
          verification_status: 'approved',
          created_at: '2024-01-14T14:20:00Z',
          approved_at: '2024-01-16T09:15:00Z',
          notes: 'Partenaire validé avec tous les documents requis'
        }
      ]
      setPartners(mockData)
    } catch (error) {
      console.error('Erreur lors du chargement des partenaires:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async (partnerId: string, status: 'approved' | 'rejected') => {
    try {
      // Implémenter la validation du partenaire
      console.log(`${status} partenaire:`, partnerId, 'Notes:', validationNotes)
      
      // Mettre à jour l'état local
      setPartners(prev => prev.map(partner => 
        partner.id === partnerId 
          ? { 
              ...partner, 
              verification_status: status,
              notes: validationNotes,
              [status === 'approved' ? 'approved_at' : 'rejected_at']: new Date().toISOString()
            }
          : partner
      ))
      
      setSelectedPartner(null)
      setValidationNotes("")
    } catch (error) {
      console.error('Erreur lors de la validation:', error)
    }
  }

  const filteredPartners = partners.filter(partner =>
    partner.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (partner.business_name && partner.business_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement des partenaires...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CheckCircle className="h-8 w-8 text-emerald-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Validation des partenaires</h1>
          <p className="text-gray-600">Valider et gérer les partenaires de la plateforme</p>
        </div>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un partenaire par nom, email ou entreprise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{partners.length}</p>
                <p className="text-sm text-gray-600">Total partenaires</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {partners.filter(p => p.verification_status === 'approved').length}
                </p>
                <p className="text-sm text-gray-600">Approuvés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {partners.filter(p => p.verification_status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {partners.filter(p => p.business_type === 'company').length}
                </p>
                <p className="text-sm text-gray-600">Entreprises</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des partenaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Liste des partenaires</h2>
          {filteredPartners.map((partner) => (
            <Card 
              key={partner.id} 
              className={`cursor-pointer transition-all ${
                selectedPartner?.id === partner.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedPartner(partner)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{partner.full_name}</h3>
                      <Badge 
                        variant={
                          partner.verification_status === 'approved' ? 'default' :
                          partner.verification_status === 'pending' ? 'secondary' : 'destructive'
                        }
                      >
                        {partner.verification_status === 'approved' ? 'Approuvé' :
                         partner.verification_status === 'pending' ? 'En attente' : 'Rejeté'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{partner.email}</p>
                    {partner.business_name && (
                      <p className="text-sm text-gray-600">{partner.business_name}</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {new Date(partner.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Détails du partenaire sélectionné */}
        <div>
          {selectedPartner ? (
            <Card>
              <CardHeader>
                <CardTitle>Détails du partenaire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Nom complet</p>
                    <p className="text-gray-600">{selectedPartner.full_name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Email</p>
                    <p className="text-gray-600">{selectedPartner.email}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Téléphone</p>
                    <p className="text-gray-600">{selectedPartner.phone}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Type</p>
                    <p className="text-gray-600">
                      {selectedPartner.business_type === 'company' ? 'Entreprise' : 'Particulier'}
                    </p>
                  </div>
                  {selectedPartner.business_name && (
                    <div className="col-span-2">
                      <p className="font-medium text-gray-700">Nom de l'entreprise</p>
                      <p className="text-gray-600">{selectedPartner.business_name}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="font-medium text-gray-700">Adresse</p>
                    <p className="text-gray-600">{selectedPartner.address}</p>
                  </div>
                  {selectedPartner.tax_id && (
                    <div className="col-span-2">
                      <p className="font-medium text-gray-700">Numéro fiscal</p>
                      <p className="text-gray-600">{selectedPartner.tax_id}</p>
                    </div>
                  )}
                </div>

                {selectedPartner.notes && (
                  <div>
                    <p className="font-medium text-gray-700 mb-2">Notes de validation</p>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedPartner.notes}</p>
                  </div>
                )}

                {selectedPartner.verification_status === 'pending' && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes de validation
                      </label>
                      <Textarea
                        placeholder="Ajouter des notes sur la validation..."
                        value={validationNotes}
                        onChange={(e) => setValidationNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleValidate(selectedPartner.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approuver
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleValidate(selectedPartner.id, 'rejected')}
                      >
                        Rejeter
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionner un partenaire</h3>
                <p className="text-gray-600">Cliquez sur un partenaire dans la liste pour voir ses détails.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}