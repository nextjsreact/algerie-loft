import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuditHistory } from "@/components/audit/audit-history"
import { AuditPermissionManager } from "@/lib/permissions/audit-permissions"
import { LoftBillManagement } from "@/components/loft/bill-management"
import { LoftPhotoGallery } from "@/components/lofts/loft-photo-gallery"
import { RoleBasedAccess } from "@/components/auth/role-based-access"
import Link from "next/link"
import type { LoftStatus } from "@/lib/types"
import { 
  MapPin, 
  Euro, 
  User, 
  Building, 
  Calendar,
  Phone,
  Wifi,
  Zap,
  Droplets,
  Flame,
  ExternalLink,
  Edit,
  Home
} from "lucide-react"

// TRADUCTIONS HARDCODÉES EN FRANÇAIS - SOLUTION DÉFINITIVE
const TRANSLATIONS = {
  // Navigation et actions
  editLoft: "Modifier l'appartement",
  linkToAirbnb: "Lier à Airbnb",
  
  // Informations générales
  loftInfoTitle: "Informations sur l'appartement",
  pricePerNight: "Prix par nuit",
  owner: "Propriétaire",
  description: "Description",
  
  // Statuts
  available: "Disponible",
  occupied: "Occupé",
  maintenance: "Maintenance",
  
  // Erreurs
  loftNotFound: "Appartement non trouvé",
  noLoftFoundForId: "Aucun appartement trouvé pour l'ID",
  
  // Onglets
  detailsTitle: "Détails du Loft",
  auditHistory: "Historique d'audit",
  
  // Informations supplémentaires
  additionalInfoTitle: "Informations supplémentaires",
  createdOn: "Créé le",
  lastUpdated: "Dernière mise à jour",
  photoGallery: "Galerie de photos",
  percentages: "Pourcentages",
  company: "Société",
  ownershipType: "Type de propriété",
  
  // Services publics
  water: "Eau",
  electricity: "Électricité",
  gas: "Gaz",
  phone: "Téléphone",
  internet: "Internet",
  
  // Factures
  billManagementTitle: "Gestion des factures",
  nextBills: "Prochaines factures",
  customerCode: "Code client",
  meterNumber: "Numéro de compteur",
  correspondent: "Correspondant",
  clientNumber: "Numéro client",
  pdlRef: "Référence PDL",
  notSet: "Non défini",
  
  // Fréquences
  notSetFrequency: "Fréquence non définie",
  noDueDatesSet: "Aucune date d'échéance définie",
  editLoftToAddBillInfo: "Modifiez l'appartement pour ajouter les informations de facturation",
  
  // Devises
  currencyDa: "DA"
} as const

// Fonction helper pour récupérer les traductions
const t = (key: keyof typeof TRANSLATIONS): string => {
  return TRANSLATIONS[key] || key
}

export default async function LoftDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const awaitedParams = await params;

  try {
    const session = await requireRole(["admin", "manager"])
    const supabase = await createClient()

    // Récupérer les données du loft
    const { data: loft, error } = await supabase
      .from("lofts")
      .select("*")
      .eq("id", awaitedParams.id)
      .single()

    if (error) {
      console.error("Erreur récupération loft:", error)
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-red-600">Erreur</h1>
            <p className="text-muted-foreground">Erreur lors de la récupération du loft: {error.message}</p>
            <p className="text-sm text-gray-500">ID recherché: {awaitedParams.id}</p>
          </div>
        </div>
      )
    }
    
    if (!loft) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-yellow-600">{t('loftNotFound')}</h1>
            <p className="text-muted-foreground">{t('noLoftFoundForId')}: {awaitedParams.id}</p>
          </div>
        </div>
      )
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'available': return 'bg-green-100 text-green-800'
        case 'occupied': return 'bg-red-100 text-red-800'
        case 'maintenance': return 'bg-yellow-100 text-yellow-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    }

    const getStatusText = (status: string) => {
      switch (status) {
        case 'available': return t('available')
        case 'occupied': return t('occupied')
        case 'maintenance': return t('maintenance')
        default: return status
      }
    }

    // Check if user can view audit history
    const canViewAudit = AuditPermissionManager.canViewEntityAuditHistory(
      session.user.role, 
      'lofts', 
      loft.id
    );

    return (
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Header avec titre et actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Home className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl font-bold tracking-tight">{loft.name}</h1>
              <Badge className={getStatusColor(loft.status)}>
                {getStatusText(loft.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <p className="text-lg">{loft.address}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <RoleBasedAccess 
              userRole={session.user.role}
              allowedRoles={['admin', 'manager']}
              showFallback={false}
            >
              <Button asChild variant="outline">
                <Link href={`/fr/lofts/${awaitedParams.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('editLoft')}
                </Link>
              </Button>
              {loft.airbnb_listing_id && (
                <Button asChild>
                  <Link href={`/fr/lofts/${awaitedParams.id}/link-airbnb`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('linkToAirbnb')}
                  </Link>
                </Button>
              )}
            </RoleBasedAccess>
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">{t('detailsTitle')}</TabsTrigger>
            {canViewAudit && (
              <TabsTrigger value="audit">{t('auditHistory')}</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informations principales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {t('loftInfoTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <RoleBasedAccess 
                          userRole={session.user.role}
                          allowedRoles={['admin', 'manager', 'executive']}
                          showFallback={false}
                        >
                          {loft.price_per_night ? (
                            <div className="flex items-center gap-3">
                              <Euro className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="text-sm text-muted-foreground">{t('pricePerNight')}</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {loft.price_per_night.toLocaleString()} {t('currencyDa')}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Euro className="h-5 w-5 text-yellow-600" />
                              <div>
                                <p className="text-sm text-muted-foreground">{t('pricePerNight')}</p>
                                <p className="text-lg font-medium text-yellow-600">
                                  {t('notSet')}
                                </p>
                              </div>
                            </div>
                          )}
                        </RoleBasedAccess>
                        
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t('owner')}</p>
                            <p className="font-medium">{loft.owner_name || 'Loft Algerie'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{t('ownershipType')}</p>
                          <p className="font-medium capitalize">{t('company')}</p>
                        </div>
                      </div>
                    </div>

                    {loft.description && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">{t('description')}</p>
                          <p className="text-base leading-relaxed">{loft.description}</p>
                        </div>
                      </>
                    )}

                    <RoleBasedAccess 
                      userRole={session.user.role}
                      allowedRoles={['admin', 'manager', 'executive']}
                      showFallback={false}
                    >
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-3">{t('percentages')}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-xl font-bold text-blue-600">{loft.company_percentage || 50}%</div>
                            <div className="text-xs text-muted-foreground">{t('company')}</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-xl font-bold text-green-600">{loft.owner_percentage || 50}%</div>
                            <div className="text-xs text-muted-foreground">Propriétaire</div>
                          </div>
                        </div>
                      </div>
                    </RoleBasedAccess>

                    {loft.phone_number && (
                      <>
                        <Separator />
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t('phone')}</p>
                            <p className="font-medium">{loft.phone_number}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Informations utilitaires */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('additionalInfoTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Eau */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Droplets className="h-5 w-5 text-blue-500" />
                          <h4 className="font-semibold">{t('water')}</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          {loft.water_customer_code ? (
                            <div>
                              <span className="text-muted-foreground">{t('customerCode')}: </span>
                              <span className="font-medium">{loft.water_customer_code}</span>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">Aucune information</div>
                          )}
                          {loft.water_meter_number && (
                            <div>
                              <span className="text-muted-foreground">{t('meterNumber')}: </span>
                              <span className="font-medium">{loft.water_meter_number}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Électricité */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-500" />
                          <h4 className="font-semibold">{t('electricity')}</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          {loft.electricity_customer_number ? (
                            <div>
                              <span className="text-muted-foreground">{t('clientNumber')}: </span>
                              <span className="font-medium">{loft.electricity_customer_number}</span>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">Aucune information</div>
                          )}
                          {loft.electricity_meter_number && (
                            <div>
                              <span className="text-muted-foreground">{t('meterNumber')}: </span>
                              <span className="font-medium">{loft.electricity_meter_number}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Gaz */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Flame className="h-5 w-5 text-orange-500" />
                          <h4 className="font-semibold">{t('gas')}</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          {loft.gas_customer_number ? (
                            <div>
                              <span className="text-muted-foreground">{t('clientNumber')}: </span>
                              <span className="font-medium">{loft.gas_customer_number}</span>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">Aucune information</div>
                          )}
                        </div>
                      </div>

                      {/* Dates d'échéance */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-purple-500" />
                          <h4 className="font-semibold">{t('nextBills')}</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          {loft.prochaine_echeance_eau ? (
                            <div>
                              <span className="text-muted-foreground">{t('water')}: </span>
                              <span className="font-medium">
                                {new Date(loft.prochaine_echeance_eau).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">{t('noDueDatesSet')}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Colonne latérale */}
              <div className="space-y-6">
                {/* Galerie de photos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span>📸</span>
                      {t('photoGallery')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LoftPhotoGallery 
                      loftId={awaitedParams.id} 
                      loftName={loft.name}
                    />
                  </CardContent>
                </Card>

                {/* Informations supplémentaires */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('additionalInfoTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('createdOn')}</p>
                      <p className="font-medium">
                        {new Date(loft.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('lastUpdated')}</p>
                      <p className="font-medium">
                        {new Date(loft.updated_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {loft.airbnb_listing_id && (
                      <div>
                        <p className="text-sm text-muted-foreground">ID Airbnb</p>
                        <p className="font-medium">{loft.airbnb_listing_id}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Gestion des factures */}
            <RoleBasedAccess 
              userRole={session.user.role}
              allowedRoles={['admin', 'manager']}
              showFallback={false}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{t('billManagementTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <LoftBillManagement loftId={awaitedParams.id} loftData={loft} />
                </CardContent>
              </Card>
            </RoleBasedAccess>
          </TabsContent>

          {canViewAudit && (
            <TabsContent value="audit" className="space-y-4">
              <AuditHistory 
                tableName="lofts" 
                recordId={loft.id}
                className="w-full"
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    )
  } catch (error) {
    console.error("Erreur générale page loft:", error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-600">Erreur système</h1>
          <p className="text-muted-foreground">Une erreur inattendue s'est produite</p>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    )
  }
}