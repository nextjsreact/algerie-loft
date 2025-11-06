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

// Import des traductions spécifiques
import frTranslations from "@/messages/loft-details-fr.json"
import enTranslations from "@/messages/loft-details-en.json"
import arTranslations from "@/messages/loft-details-ar.json"

const translations = {
  fr: frTranslations,
  en: enTranslations,
  ar: arTranslations
}

export default async function LoftDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const awaitedParams = await params;
  const locale = awaitedParams.locale as 'fr' | 'en' | 'ar';
  
  // Fonction de traduction locale
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation missing: ${key} for locale ${locale}`);
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

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
            <h1 className="text-3xl font-bold tracking-tight text-red-600">{t('errors.loadingError')}</h1>
            <p className="text-muted-foreground">{error.message}</p>
            <p className="text-sm text-gray-500">ID: {awaitedParams.id}</p>
          </div>
        </div>
      )
    }
    
    if (!loft) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-yellow-600">{t('errors.loftNotFound')}</h1>
            <p className="text-muted-foreground">{t('errors.noLoftFoundForId')}: {awaitedParams.id}</p>
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
      return t(`status.${status}`) || status
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
                <Link href={`/${locale}/lofts/${awaitedParams.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('page.editLoft')}
                </Link>
              </Button>
              {loft.airbnb_listing_id && (
                <Button asChild>
                  <Link href={`/${locale}/lofts/${awaitedParams.id}/link-airbnb`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('page.linkToAirbnb')}
                  </Link>
                </Button>
              )}
            </RoleBasedAccess>
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">{t('tabs.details')}</TabsTrigger>
            {canViewAudit && (
              <TabsTrigger value="audit">{t('tabs.auditHistory')}</TabsTrigger>
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
                      {t('sections.basicInfo.title')}
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
                                <p className="text-sm text-muted-foreground">{t('sections.basicInfo.pricePerNight')}</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {loft.price_per_night.toLocaleString()} {t('currency.da')}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Euro className="h-5 w-5 text-yellow-600" />
                              <div>
                                <p className="text-sm text-muted-foreground">{t('sections.basicInfo.pricePerNight')}</p>
                                <p className="text-lg font-medium text-yellow-600">
                                  {t('sections.basicInfo.notSet')}
                                </p>
                              </div>
                            </div>
                          )}
                        </RoleBasedAccess>
                        
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t('sections.basicInfo.owner')}</p>
                            <p className="font-medium">{loft.owner_name || 'Loft Algerie'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{t('sections.basicInfo.ownershipType')}</p>
                          <p className="font-medium capitalize">{t('sections.basicInfo.company')}</p>
                        </div>
                      </div>
                    </div>

                    {loft.description && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">{t('sections.basicInfo.description')}</p>
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
                        <p className="text-sm text-muted-foreground mb-3">{t('sections.basicInfo.percentages')}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-xl font-bold text-blue-600">{loft.company_percentage || 50}%</div>
                            <div className="text-xs text-muted-foreground">{t('sections.basicInfo.companyShare')}</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-xl font-bold text-green-600">{loft.owner_percentage || 50}%</div>
                            <div className="text-xs text-muted-foreground">{t('sections.basicInfo.ownerShare')}</div>
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
                            <p className="text-sm text-muted-foreground">{t('sections.basicInfo.phone')}</p>
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
                    <CardTitle>{t('sections.utilities.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Eau */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Droplets className="h-5 w-5 text-blue-500" />
                          <h4 className="font-semibold">{t('sections.utilities.water')}</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          {loft.water_customer_code ? (
                            <div>
                              <span className="text-muted-foreground">{t('sections.utilities.customerCode')}: </span>
                              <span className="font-medium">{loft.water_customer_code}</span>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">{t('sections.utilities.noInfo')}</div>
                          )}
                          {loft.water_meter_number && (
                            <div>
                              <span className="text-muted-foreground">{t('sections.utilities.meterNumber')}: </span>
                              <span className="font-medium">{loft.water_meter_number}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Électricité */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-500" />
                          <h4 className="font-semibold">{t('sections.utilities.electricity')}</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          {loft.electricity_customer_number ? (
                            <div>
                              <span className="text-muted-foreground">{t('sections.utilities.clientNumber')}: </span>
                              <span className="font-medium">{loft.electricity_customer_number}</span>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">{t('sections.utilities.noInfo')}</div>
                          )}
                          {loft.electricity_meter_number && (
                            <div>
                              <span className="text-muted-foreground">{t('sections.utilities.meterNumber')}: </span>
                              <span className="font-medium">{loft.electricity_meter_number}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Gaz */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Flame className="h-5 w-5 text-orange-500" />
                          <h4 className="font-semibold">{t('sections.utilities.gas')}</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          {loft.gas_customer_number ? (
                            <div>
                              <span className="text-muted-foreground">{t('sections.utilities.clientNumber')}: </span>
                              <span className="font-medium">{loft.gas_customer_number}</span>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">{t('sections.utilities.noInfo')}</div>
                          )}
                        </div>
                      </div>

                      {/* Dates d'échéance */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-purple-500" />
                          <h4 className="font-semibold">{t('sections.bills.nextBills')}</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          {loft.prochaine_echeance_eau ? (
                            <div>
                              <span className="text-muted-foreground">{t('sections.utilities.water')}: </span>
                              <span className="font-medium">
                                {new Date(loft.prochaine_echeance_eau).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-FR')}
                              </span>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">{t('sections.bills.noDueDatesSet')}</div>
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
                      {t('sections.photos.title')}
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
                    <CardTitle>{t('sections.metadata.title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('sections.metadata.createdOn')}</p>
                      <p className="font-medium">
                        {new Date(loft.created_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('sections.metadata.lastUpdated')}</p>
                      <p className="font-medium">
                        {new Date(loft.updated_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-FR')}
                      </p>
                    </div>
                    {loft.airbnb_listing_id && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t('sections.metadata.airbnbId')}</p>
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
                  <CardTitle>{t('sections.bills.title')}</CardTitle>
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
          <h1 className="text-3xl font-bold tracking-tight text-red-600">{t('errors.systemError')}</h1>
          <p className="text-muted-foreground">{t('errors.unexpectedError')}</p>
          <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    )
  }
}