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
  
  // Safe translation hook
  let t: any
  try {
    t = useTranslations('partner')
  } catch (error) {
    console.error('[PartnerValidationClient] Translation error:', error)
    t = (key: string) => key
  }

  console.log('[PartnerValidationClient] Component mounted')

  useEffect(() => {
    console.log('[PartnerValidationClient] useEffect triggered')
    fetchPartners()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchPartners = async () => {
    setLoading(true)
    try {
      console.log('Fetching partners from API...')
      const response = await fetch('/api/admin/partners/profiles?status=all')
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || 'Failed to fetch partner profiles')
        } catch (e) {
          throw new Error(`API Error: ${response.status} - ${errorText}`)
        }
      }
      
      const data = await response.json()
      console.log('Fetched partner profiles data:', data)
      
      const partnerProfiles = data.partners || []
      
      if (partnerProfiles.length === 0) {
        console.log('No partner profiles found')
        setPartners([])
        return
      }
      
      // Transformer les données pour correspondre à l'interface Partner
      const transformedPartners = partnerProfiles.map((p: any) => {
        // Gérer le cas où profiles est un tableau au lieu d'un objet
        const profileData = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
        
        return {
          id: p.id,
          full_name: p.contact_name || profileData?.full_name || 'N/A',
          email: p.contact_email || profileData?.email || 'N/A',
          business_name: p.company_name || undefined,
          business_type: p.company_name ? 'company' as const : 'individual' as const,
          phone: p.contact_phone || 'N/A',
          address: p.address || 'N/A',
          tax_id: undefined,
          verification_status: p.verification_status || 'pending',
          created_at: p.created_at,
          approved_at: p.verified_at,
          rejected_at: p.rejected_at,
          notes: p.verification_notes
        }
      })
      
      console.log('Transformed partners:', transformedPartners)
      setPartners(transformedPartners)
    } catch (error) {
      console.error('Erreur lors du chargement des partenaires:', error)
      setPartners([])
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async (partnerId: string, status: 'approved' | 'rejected') => {
    try {
      const endpoint = status === 'approved' 
        ? `/api/admin/partners/${partnerId}/approve`
        : `/api/admin/partners/${partnerId}/reject`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: validationNotes })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to ${status} partner`)
      }
      
      // Recharger la liste des partenaires
      await fetchPartners()
      
      setSelectedPartner(null)
      setValidationNotes("")
    } catch (error) {
      console.error('Erreur lors de la validation:', error)
      alert(`Erreur lors de la validation du partenaire`)
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
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
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
                  {partners.filter(p => p.verification_status === 'verified' || p.verification_status === 'approved').length}
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
          {filteredPartners.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun partenaire trouvé</h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'Aucun partenaire ne correspond à votre recherche.' 
                    : 'Aucun partenaire enregistré pour le moment.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPartners.map((partner) => (
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
                          partner.verification_status === 'verified' || partner.verification_status === 'approved' ? 'default' :
                          partner.verification_status === 'pending' ? 'secondary' : 'destructive'
                        }
                      >
                        {partner.verification_status === 'verified' || partner.verification_status === 'approved' ? 'Approuvé' :
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
          )))}
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
    </div>
  )
}