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
import { getTranslations } from "next-intl/server"
import { cookies } from "next/headers"
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

// Fonction pour traduire les descriptions des lofts
const getTranslatedDescription = (originalDescription: string, loftName: string, t: any) => {
  // Pour l'instant, on retourne la description originale
  // Les traductions peuvent être ajoutées plus tard si nécessaire
  return originalDescription
}

// Fonction pour obtenir les traductions statiques selon la langue
const getStaticTranslation = (key: string, t: any, locale: string = 'fr') => {
  // Fallback vers les traductions par défaut selon la langue détectée

  switch (locale) {
    case 'ar':
       switch (key) {
         case 'utilityInfo.title': return 'معلومات المرافق';
         case 'utilityInfo.nextBills': return 'الفواتير القادمة';
         case 'photos.photoGallery': return 'معرض الصور';
         case 'additionalInfo.title': return 'معلومات إضافية';
         case 'billManagement.title': return 'إدارة الفواتير';
         case 'additionalInfo.createdOn': return 'تم الإنشاء في';
         case 'additionalInfo.lastUpdated': return 'آخر تحديث';
         case 'notSet': return 'غير محدد';
         case 'percentages': return 'النسب المئوية';
         case 'photosAvailable': return '{{count}} صورة متاحة';
         // Noms des services
         case 'water': return 'المياه';
         case 'electricity': return 'الكهرباء';
         case 'gas': return 'الغاز';
         // Labels des champs
         case 'customerCode': return 'رمز العميل';
         case 'meterNumber': return 'رقم العداد';
         case 'pdlRef': return 'مرجع PDL';
         case 'clientNumber': return 'رقم العميل';
         case 'correspondent': return 'المراسل';
         // Fréquences
         case 'frequency': return 'التردد';
         case 'quarterly': return 'ربع سنوي';
         case 'monthly': return 'شهري';
         case 'trimestriel': return 'ربع سنوي';
         case 'mensuel': return 'شهري';
         case 'phone': return 'الهاتف';
         case 'internet': return 'الإنترنت';
         case 'energy': return 'الطاقة';
         default: return key;
       }
    case 'en':
       switch (key) {
         case 'utilityInfo.title': return 'Utility Information';
         case 'utilityInfo.nextBills': return 'Next Bills';
         case 'photos.photoGallery': return 'Photo Gallery';
         case 'additionalInfo.title': return 'Additional Information';
         case 'billManagement.title': return 'Bill Management';
         case 'additionalInfo.createdOn': return 'Created on';
         case 'additionalInfo.lastUpdated': return 'Last updated';
         case 'notSet': return 'Not set';
         case 'percentages': return 'Percentages';
         case 'photosAvailable': return '{{count}} photos available';
         // Service names
         case 'water': return 'Water';
         case 'electricity': return 'Electricity';
         case 'gas': return 'Gas';
         // Field labels
         case 'customerCode': return 'Customer Code';
         case 'meterNumber': return 'Meter Number';
         case 'pdlRef': return 'PDL Reference';
         case 'clientNumber': return 'Client Number';
         case 'correspondent': return 'Correspondent';
         // Frequencies
         case 'frequency': return 'Frequency';
         case 'quarterly': return 'Quarterly';
         case 'monthly': return 'Monthly';
         case 'trimestriel': return 'Quarterly';
         case 'mensuel': return 'Monthly';
         case 'phone': return 'Phone';
         case 'internet': return 'Internet';
         case 'energy': return 'Energy';
         default: return key;
       }
    default: // Français par défaut
       switch (key) {
         case 'utilityInfo.title': return 'Informations Utilitaires';
         case 'utilityInfo.nextBills': return 'Prochaines échéances';
         case 'photos.photoGallery': return 'Photos du Loft';
         case 'additionalInfo.title': return 'Informations Complémentaires';
         case 'billManagement.title': return 'Gestion des Factures';
         case 'additionalInfo.createdOn': return 'Créé le';
         case 'additionalInfo.lastUpdated': return 'Dernière mise à jour';
         case 'notSet': return 'Prix à définir';
         case 'percentages': return 'Pourcentages';
         case 'photosAvailable': return '{{count}} photos disponibles';
         // Noms des services
         case 'water': return 'Eau';
         case 'electricity': return 'Électricité';
         case 'gas': return 'Gaz';
         // Labels des champs
         case 'customerCode': return 'Code client';
         case 'meterNumber': return 'N° compteur';
         case 'pdlRef': return 'Réf PDL';
         case 'clientNumber': return 'N° client';
         case 'correspondent': return 'Correspondant';
         // Fréquences
         case 'frequency': return 'Fréquence';
         case 'quarterly': return 'Trimestriel';
         case 'monthly': return 'Mensuel';
         case 'trimestriel': return 'Trimestriel';
         case 'mensuel': return 'Mensuel';
         case 'phone': return 'Téléphone';
         case 'internet': return 'Internet';
         case 'energy': return 'Énergie';
         default: return key;
       }
  }
}

export default async function LoftDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const awaitedParams = await params;

  try {
    const session = await requireRole(["admin", "manager"])
    const supabase = await createClient()

    // Récupérer les traductions
    const t = await getTranslations('lofts')
    const tCommon = await getTranslations('common')
    const tOwners = await getTranslations('owners')

    // Extraire la locale des paramètres
    const locale = awaitedParams.locale || 'fr'

    // Test simple sans jointure d'abord
    const { data: loft, error } = await supabase
      .from("lofts")
      .select("*")
      .eq("id", awaitedParams.id)
      .single()

    // Debug: Log the error and data
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
      console.log("Aucun loft trouvé pour l'ID:", awaitedParams.id)
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-yellow-600">{t('loftNotFound')}</h1>
            <p className="text-muted-foreground">{t('noLoftFoundForId')}: {awaitedParams.id}</p>
          </div>
        </div>
      )
    }

    console.log("Données loft récupérées:", loft)

    const statusTranslationKeys = {
      available: "available",
      occupied: "occupied", 
      maintenance: "maintenance",
    } as const

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'available': return 'bg-green-100 text-green-800'
        case 'occupied': return 'bg-red-100 text-red-800'
        case 'maintenance': return 'bg-yellow-100 text-yellow-800'
        default: return 'bg-gray-100 text-gray-800'
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
                {t(statusTranslationKeys[loft.status as LoftStatus])}
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
                <Link href={`/lofts/${awaitedParams.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('editLoft')}
                </Link>
              </Button>
              {loft.airbnb_listing_id && (
                <Button asChild>
                  <Link href={`/lofts/${awaitedParams.id}/link-airbnb`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Lier à Airbnb
                  </Link>
                </Button>
              )}
            </RoleBasedAccess>
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Loft Details</TabsTrigger>
            {canViewAudit && (
              <TabsTrigger value="audit">Audit History</TabsTrigger>
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
                              {loft.price_per_night.toLocaleString()} {tCommon('currencies.da')}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Euro className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t('pricePerNight')}</p>
                            <p className="text-lg font-medium text-yellow-600">
                              {getStaticTranslation('notSet', t, locale)}
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
                      <p className="text-sm text-muted-foreground">{tOwners('ownershipType')}</p>
                      <p className="font-medium capitalize">Société</p>
                    </div>
                  </div>
                </div>

                {loft.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t('description')}</p>
                      <p className="text-base leading-relaxed">{getTranslatedDescription(loft.description, loft.name, t)}</p>
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
                    <p className="text-sm text-muted-foreground mb-3">{getStaticTranslation('percentages', t, locale)}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">{loft.company_percentage}%</div>
                        <div className="text-xs text-muted-foreground">Société</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">{loft.owner_percentage}%</div>
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
                        <p className="text-sm text-muted-foreground">{getStaticTranslation('phone', t, locale)}</p>
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
                <CardTitle>{getStaticTranslation('utilityInfo.title', t, locale)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Eau */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-500" />
                      <h4 className="font-semibold">{getStaticTranslation('water', t, locale)}</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      {loft.water_customer_code && (
                        <div>
                          <span className="text-muted-foreground">{getStaticTranslation('customerCode', t, locale)}: </span>
                          <span className="font-medium">{loft.water_customer_code}</span>
                        </div>
                      )}
                      {loft.water_meter_number && (
                        <div>
                          <span className="text-muted-foreground">{getStaticTranslation('meterNumber', t, locale)}: </span>
                          <span className="font-medium">{loft.water_meter_number}</span>
                        </div>
                      )}
                      {loft.water_correspondent && (
                        <div>
                          <span className="text-muted-foreground">{getStaticTranslation('correspondent', t, locale)}: </span>
                          <span className="font-medium">{loft.water_correspondent}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Électricité */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <h4 className="font-semibold">{getStaticTranslation('electricity', t, locale)}</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      {loft.electricity_customer_number && (
                        <div>
                          <span className="text-muted-foreground">{getStaticTranslation('clientNumber', t, locale)}: </span>
                          <span className="font-medium">{loft.electricity_customer_number}</span>
                        </div>
                      )}
                      {loft.electricity_meter_number && (
                        <div>
                          <span className="text-muted-foreground">{getStaticTranslation('meterNumber', t, locale)}: </span>
                          <span className="font-medium">{loft.electricity_meter_number}</span>
                        </div>
                      )}
                      {loft.electricity_pdl_ref && (
                        <div>
                          <span className="text-muted-foreground">{getStaticTranslation('pdlRef', t, locale)}: </span>
                          <span className="font-medium">{loft.electricity_pdl_ref}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gaz */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <h4 className="font-semibold">{getStaticTranslation('gas', t, locale)}</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      {loft.gas_customer_number && (
                        <div>
                          <span className="text-muted-foreground">{getStaticTranslation('clientNumber', t, locale)}: </span>
                          <span className="font-medium">{loft.gas_customer_number}</span>
                        </div>
                      )}
                      {loft.gas_meter_number && (
                        <div>
                          <span className="text-muted-foreground">{getStaticTranslation('meterNumber', t, locale)}: </span>
                          <span className="font-medium">{loft.gas_meter_number}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates d'échéance */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      <h4 className="font-semibold">{getStaticTranslation('utilityInfo.nextBills', t, locale)}</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      {loft.prochaine_echeance_eau && (
                        <div>
                          <span className="text-muted-foreground">{getStaticTranslation('water', t, locale)}: </span>
                          <span className="font-medium">
                            {new Date(loft.prochaine_echeance_eau).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                      {loft.prochaine_echeance_energie && (
                        <div>
                          <span className="text-muted-foreground">{getStaticTranslation('electricity', t, locale)}: </span>
                          <span className="font-medium">
                            {new Date(loft.prochaine_echeance_energie).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
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
                  {getStaticTranslation('photos.photoGallery', t, locale)}
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
                <CardTitle>{getStaticTranslation('additionalInfo.title', t, locale)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{getStaticTranslation('additionalInfo.createdOn', t, locale)}</p>
                  <p className="font-medium">
                    {new Date(loft.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{getStaticTranslation('additionalInfo.lastUpdated', t, locale)}</p>
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
                  <CardTitle>{getStaticTranslation('billManagement.title', t, locale)}</CardTitle>
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
