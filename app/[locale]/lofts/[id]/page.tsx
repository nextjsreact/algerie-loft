import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
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
  Zap,
  Droplets,
  Flame,
  ExternalLink,
  Edit,
  Home
} from "lucide-react"

// Traductions simples pour les 3 langues
const getTranslations = (locale: string) => {
  const translations = {
    fr: {
      editLoft: "Modifier l'appartement",
      linkToAirbnb: "Lier à Airbnb",
      details: "Détails du Loft",
      auditHistory: "Historique d'audit",
      available: "Disponible",
      occupied: "Occupé",
      maintenance: "Maintenance",
      loftInfo: "Informations sur l'appartement",
      pricePerNight: "Prix par nuit",
      owner: "Propriétaire",
      description: "Description",
      company: "Société",
      percentages: "Pourcentages",
      additionalInfo: "Informations supplémentaires",
      water: "Eau",
      electricity: "Électricité",
      gas: "Gaz",
      nextBills: "Prochaines factures",
      photoGallery: "Galerie de photos",
      createdOn: "Créé le",
      lastUpdated: "Dernière mise à jour",
      billManagement: "Gestion des factures",
      notSet: "Non défini",
      noInfo: "Aucune information disponible",
      statistics: "Statistiques",
      totalBookings: "Réservations totales",
      occupancyRate: "Taux d'occupation",
      averageRating: "Note moyenne",
      servicesUtilities: "Services & Utilitaires",
      equipment: "Équipements",
      status: "Statut",
      internet: "Internet",
      wifiPassword: "Mot de passe WiFi"
    },
    en: {
      editLoft: "Edit Apartment",
      linkToAirbnb: "Link to Airbnb",
      details: "Loft Details",
      auditHistory: "Audit History",
      available: "Available",
      occupied: "Occupied",
      maintenance: "Maintenance",
      loftInfo: "Apartment Information",
      pricePerNight: "Price per night",
      owner: "Owner",
      description: "Description",
      company: "Company",
      percentages: "Percentages",
      additionalInfo: "Additional Information",
      water: "Water",
      electricity: "Electricity",
      gas: "Gas",
      nextBills: "Upcoming Bills",
      photoGallery: "Photo Gallery",
      createdOn: "Created on",
      lastUpdated: "Last Updated",
      billManagement: "Bill Management",
      notSet: "Not Set",
      noInfo: "No information available",
      statistics: "Statistics",
      totalBookings: "Total Bookings",
      occupancyRate: "Occupancy Rate",
      averageRating: "Average Rating",
      servicesUtilities: "Services & Utilities",
      equipment: "Equipment",
      status: "Status",
      internet: "Internet",
      wifiPassword: "WiFi Password"
    },
    ar: {
      editLoft: "تعديل الشقة",
      linkToAirbnb: "ربط بـ Airbnb",
      details: "تفاصيل الشقة",
      auditHistory: "سجل المراجعة",
      available: "متاح",
      occupied: "مشغول",
      maintenance: "صيانة",
      loftInfo: "معلومات الشقة",
      pricePerNight: "السعر لكل ليلة",
      owner: "المالك",
      description: "الوصف",
      company: "الشركة",
      percentages: "النسب المئوية",
      additionalInfo: "معلومات إضافية",
      water: "المياه",
      electricity: "الكهرباء",
      gas: "الغاز",
      nextBills: "الفواتير القادمة",
      photoGallery: "معرض الصور",
      createdOn: "تم الإنشاء في",
      lastUpdated: "آخر تحديث",
      billManagement: "إدارة الفواتير",
      notSet: "غير محدد",
      noInfo: "لا توجد معلومات متاحة",
      statistics: "الإحصائيات",
      totalBookings: "إجمالي الحجوزات",
      occupancyRate: "معدل الإشغال",
      averageRating: "متوسط التقييم",
      servicesUtilities: "الخدمات والمرافق",
      equipment: "المعدات",
      status: "الحالة",
      internet: "الإنترنت",
      wifiPassword: "كلمة مرور WiFi"
      averageRating: "التقييم المتوسط",
      servicesUtilities: "الخدمات والمرافق",
      equipment: "المعدات",
      status: "الحالة"
    }
  }
  
  return translations[locale as keyof typeof translations] || translations.fr
}

export default async function LoftDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const awaitedParams = await params;
  const locale = awaitedParams.locale as 'fr' | 'en' | 'ar';
  const t = getTranslations(locale);

  try {
    const session = await requireRole(["admin", "manager", "executive", "client"], locale)
    const supabase = await createClient()

    const { data: loft, error } = await supabase
      .from("lofts")
      .select("*")
      .eq("id", awaitedParams.id)
      .single()

    if (error || !loft) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-red-600">Erreur</h1>
            <p className="text-muted-foreground">Appartement non trouvé</p>
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

    const canViewAudit = AuditPermissionManager.canViewEntityAuditHistory(
      session.user.role, 
      'lofts', 
      loft.id
    );

    return (
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Home className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl font-bold tracking-tight">{loft.name}</h1>
              <Badge className={getStatusColor(loft.status)}>
                {t[loft.status as keyof typeof t] || loft.status}
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
                  {t.editLoft}
                </Link>
              </Button>
              {loft.airbnb_listing_id && (
                <Button asChild>
                  <Link href={`/${locale}/lofts/${awaitedParams.id}/link-airbnb`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t.linkToAirbnb}
                  </Link>
                </Button>
              )}
            </RoleBasedAccess>
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">{t.details}</TabsTrigger>
            {canViewAudit && (
              <TabsTrigger value="audit">{t.auditHistory}</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="details" className="space-y-6">
            {/* Section principale - Informations de base */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Informations principales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {t.loftInfo}
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
                                <p className="text-sm text-muted-foreground">{t.pricePerNight}</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {loft.price_per_night.toLocaleString()} DA
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Euro className="h-5 w-5 text-yellow-600" />
                              <div>
                                <p className="text-sm text-muted-foreground">{t.pricePerNight}</p>
                                <p className="text-lg font-medium text-yellow-600">{t.notSet}</p>
                              </div>
                            </div>
                          )}
                        </RoleBasedAccess>

                        {/* Informations de contact */}
                        {loft.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-sm text-muted-foreground">Téléphone</p>
                              <p className="font-medium">{loft.phone}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        {/* Statut et disponibilité */}
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full bg-current opacity-20"></div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t.status}</p>
                            <Badge className={getStatusColor(loft.status)}>
                              {t[loft.status as keyof typeof t] || loft.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Capacité */}
                        {loft.capacity && (
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="text-sm text-muted-foreground">Capacité</p>
                              <p className="font-medium">{loft.capacity} personnes</p>
                            </div>
                          </div>
                        )}

                        {/* Surface */}
                        {loft.surface && (
                          <div className="flex items-center gap-3">
                            <Building className="h-5 w-5 text-orange-600" />
                            <div>
                              <p className="text-sm text-muted-foreground">Surface</p>
                              <p className="font-medium">{loft.surface} m²</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Équipements et caractéristiques */}
                    {(loft.wifi || loft.parking || loft.balcony || loft.kitchen) && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-3">{t.equipment}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {loft.wifi && (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                <span>WiFi</span>
                              </div>
                            )}
                            {loft.parking && (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                <span>Parking</span>
                              </div>
                            )}
                            {loft.balcony && (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                <span>Balcon</span>
                              </div>
                            )}
                            {loft.kitchen && (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                <span>Cuisine équipée</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Description */}
                {loft.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t.description}</p>
                      <p className="text-base leading-relaxed">{loft.description}</p>
                    </div>
                  </>
                )}

                {/* Company and Owner Info */}
                <RoleBasedAccess 
                  userRole={session.user.role}
                  allowedRoles={['admin', 'manager', 'executive']}
                  showFallback={false}
                >
                  <Separator />
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground font-medium capitalize">{t.company}</p>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t.owner}</p>
                        <p className="font-medium">{loft.owner_name || 'Loft Algérie'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground font-medium capitalize">{t.percentages}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center bg-blue-50 p-3 rounded-lg">
                          <div className="text-xl font-bold text-blue-600">{loft.company_percentage || 50}%</div>
                          <div className="text-xs text-muted-foreground">{t.company}</div>
                        </div>
                        <div className="text-center bg-green-50 p-3 rounded-lg">
                          <div className="text-xl font-bold text-green-600">{loft.owner_percentage || 50}%</div>
                          <div className="text-xs text-muted-foreground">{t.owner}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </RoleBasedAccess>

                {/* Statistiques et métriques */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      📊 <span>{t.statistics}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {loft.total_bookings || 0}
                        </div>
                        <div className="text-sm text-blue-700">{t.totalBookings}</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {loft.occupancy_rate || 0}%
                        </div>
                        <div className="text-sm text-green-700">{t.occupancyRate}</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {loft.average_rating || 'N/A'}
                        </div>
                        <div className="text-sm text-purple-700">{t.averageRating}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Informations Airbnb */}
                {loft.airbnb_listing_id && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        🏠 <span>Airbnb</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">ID Listing:</span>
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {loft.airbnb_listing_id}
                          </span>
                        </div>
                        {loft.airbnb_url && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Lien:</span>
                            <Button asChild variant="outline" size="sm">
                              <Link href={loft.airbnb_url} target="_blank">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Voir sur Airbnb
                              </Link>
                            </Button>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Synchronisation:</span>
                          <Badge variant={loft.sync_enabled ? "default" : "secondary"}>
                            {loft.sync_enabled ? "Activée" : "Désactivée"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Colonne droite - Galerie et infos supplémentaires */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      📸 <span>{t.photoGallery}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LoftPhotoGallery 
                      loftId={awaitedParams.id} 
                      loftName={loft.name}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t.additionalInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.createdOn}</p>
                      <p className="font-medium">{new Date(loft.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.lastUpdated}</p>
                      <p className="font-medium">{new Date(loft.updated_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Section pleine largeur - Gestion des factures */}
            <RoleBasedAccess 
              userRole={session.user.role}
              allowedRoles={['admin', 'manager']}
              showFallback={false}
            >
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    💰 <span>{t.billManagement}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LoftBillManagement 
                    loftId={awaitedParams.id} 
                    loftData={loft}
                  />
                </CardContent>
              </Card>
            </RoleBasedAccess>

            {/* Section pleine largeur - Services & Utilitaires */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {t.servicesUtilities}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Eau */}
                  <div className="border rounded-lg p-6 bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Droplets className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-blue-700">{t.water}</h4>
                    </div>
                    <div className="space-y-3">
                      {loft.water_customer_code ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-blue-600">Code client:</span>
                            <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                              {loft.water_customer_code}
                            </span>
                          </div>
                          {loft.prochaine_echeance_eau && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-blue-600">Prochaine échéance:</span>
                              <span className="font-medium text-blue-700 bg-white px-2 py-1 rounded border">
                                {new Date(loft.prochaine_echeance_eau).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-blue-600 italic text-center py-4">{t.noInfo}</div>
                      )}
                    </div>
                  </div>

                  {/* Électricité */}
                  <div className="border rounded-lg p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-yellow-500 rounded-lg">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-yellow-700">{t.electricity}</h4>
                    </div>
                    <div className="space-y-3">
                      {loft.electricity_customer_number ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-yellow-600">Numéro client:</span>
                            <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                              {loft.electricity_customer_number}
                            </span>
                          </div>
                          {loft.prochaine_echeance_electricite && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-yellow-600">Prochaine échéance:</span>
                              <span className="font-medium text-yellow-700 bg-white px-2 py-1 rounded border">
                                {new Date(loft.prochaine_echeance_electricite).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-yellow-600 italic text-center py-4">{t.noInfo}</div>
                      )}
                    </div>
                  </div>

                  {/* Gaz */}
                  <div className="border rounded-lg p-6 bg-gradient-to-br from-orange-50 to-orange-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-500 rounded-lg">
                        <Flame className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-orange-700">{t.gas}</h4>
                    </div>
                    <div className="space-y-3">
                      {loft.gas_customer_number ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-orange-600">Numéro client:</span>
                            <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                              {loft.gas_customer_number}
                            </span>
                          </div>
                          {loft.prochaine_echeance_gaz && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-orange-600">Prochaine échéance:</span>
                              <span className="font-medium text-orange-700 bg-white px-2 py-1 rounded border">
                                {new Date(loft.prochaine_echeance_gaz).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-orange-600 italic text-center py-4">{t.noInfo}</div>
                      )}
                    </div>
                  </div>

                  {/* Internet */}
                  <div className="border rounded-lg p-6 bg-gradient-to-br from-purple-50 to-purple-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-purple-700">{t.internet}</h4>
                    </div>
                    <div className="space-y-3">
                      {loft.wifi_password ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-purple-600">{t.wifiPassword}:</span>
                            <span className="font-mono text-sm bg-white px-2 py-1 rounded border font-semibold text-purple-700">
                              {loft.wifi_password}
                            </span>
                          </div>
                          {loft.prochaine_echeance_internet && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-purple-600">Prochaine échéance:</span>
                              <span className="font-medium text-purple-700 bg-white px-2 py-1 rounded border">
                                {new Date(loft.prochaine_echeance_internet).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-purple-600 italic text-center py-4">{t.noInfo}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Résumé des échéances */}
                {(loft.prochaine_echeance_eau || loft.prochaine_echeance_electricite || loft.prochaine_echeance_gaz) && (
                  <div className="mt-6 border-t pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-purple-700">{t.nextBills}</h4>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <div className="text-purple-700 font-medium">
                        📅 Prochaines échéances à surveiller pour la gestion des factures
                      </div>
                      <div className="text-sm text-purple-600 mt-2">
                        Assurez-vous de suivre les dates d'échéance pour éviter les coupures de service.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {canViewAudit && (
            <TabsContent value="audit" className="space-y-4">
              <AuditHistory 
                tableName="lofts"
                recordId={loft.id}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    )
  } catch (error) {
    console.error("Erreur page loft:", error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-600">Erreur système</h1>
          <p className="text-muted-foreground">Une erreur inattendue s'est produite</p>
        </div>
      </div>
    )
  }
}