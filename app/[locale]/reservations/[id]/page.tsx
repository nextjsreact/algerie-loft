import { requireRole } from "@/lib/auth"
import { getReservation } from "@/lib/actions/reservations"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuditHistory } from "@/components/audit/audit-history"
import { AuditPermissionManager } from "@/lib/permissions/audit-permissions"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CalendarDays, MapPin, User, DollarSign } from "lucide-react"
import { getTranslations, getLocale } from "next-intl/server"
import { createClient } from "@/utils/supabase/server"
import { ReservationEditButton } from "@/components/reservations/reservation-edit-button"
import SyncLoftButton from "@/components/airbnb/SyncLoftButton"

export default async function ReservationPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const session = await requireRole(["admin", "manager"])
  const t = await getTranslations("reservations.details")
  const tStatus = await getTranslations("reservations.status")

  const reservation = await getReservation(id);
  const airbnbListingId = reservation?.lofts?.airbnb_listing_id;

  if (!reservation) {
    notFound()
  }

  const supabase = await createClient()
  const { data: loftsData } = await supabase
    .from('lofts')
    .select('id, name, address')
    .order('name', { ascending: true })
  const availableLofts = (loftsData || []).map(l => ({ id: l.id, name: l.name, address: l.address || undefined }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string): string => {
    try {
      return tStatus(status as any)
    } catch {
      return status
    }
  }

  // Check if user can view audit history
  const canViewAudit = AuditPermissionManager.canViewEntityAuditHistory(
    session.user.role,
    'reservations',
    reservation.id
  );

  const dateFormatter = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
  const moneyFormatter = (currency?: string | null) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'DZD'
    })

  // Calculer le currency_ratio pour les réservations Airbnb si nécessaire
  // IMPORTANT: Utiliser original_currency_code en priorité pour l'affichage
  const effectiveCurrencyCode = reservation.original_currency_code || reservation.currency_code || 'DZD'
  let effectiveCurrencyRatio = reservation.currency_ratio || 1
  
  // Si c'est une réservation Airbnb avec devise étrangère mais sans currency_ratio
  // Calculer le ratio : total_amount_dzd / original_amount = ratio
  if (effectiveCurrencyCode !== 'DZD' && effectiveCurrencyRatio === 1 && reservation.original_amount && reservation.total_amount) {
    effectiveCurrencyRatio = reservation.total_amount / reservation.original_amount
  }
  
  // Calculer le prix par nuit dans la devise originale si nécessaire
  const nights = Math.ceil((new Date(reservation.check_out_date).getTime() - new Date(reservation.check_in_date).getTime()) / (1000 * 60 * 60 * 24))
  const effectivePricePerNight = reservation.price_per_night_input 
    ? reservation.price_per_night_input 
    : (reservation.original_amount && nights > 0 ? reservation.original_amount / nights : null)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{t("reservationFor", { name: reservation.guest_name })}</CardTitle>
              <CardDescription>
                {dateFormatter.format(new Date(reservation.check_in_date))} - {dateFormatter.format(new Date(reservation.check_out_date))}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(reservation.status)}>{getStatusLabel(reservation.status)}</Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">{t("reservationTab")}</TabsTrigger>
          {canViewAudit && (
            <TabsTrigger value="audit">{t("auditHistory")}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guest Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("guestInformation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("name")}</label>
                  <p className="text-lg">{reservation.guest_name}</p>
                </div>
                {reservation.guest_email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t("email")}</label>
                    <p>{reservation.guest_email}</p>
                  </div>
                )}
                {reservation.guest_phone && String(reservation.guest_phone).replace(/\D/g, '').length >= 5 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t("phone")}</label>
                    <p>{reservation.guest_phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  {t("bookingDetails")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("checkInDate")}</label>
                  <p className="text-lg">{dateFormatter.format(new Date(reservation.check_in_date))}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("checkOutDate")}</label>
                  <p className="text-lg">{dateFormatter.format(new Date(reservation.check_out_date))}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("numberOfGuests")}</label>
                  <p className="text-lg">{reservation.guest_count || t("notSpecified")}</p>
                </div>
              </CardContent>
            </Card>

            {/* Loft Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t("loftInformation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("loftName")}</label>
                  <p className="text-lg">{reservation.lofts?.name || t("unknownLoft")}</p>
                </div>
                {reservation.lofts?.address && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t("address")}</label>
                    <p>{reservation.lofts.address}</p>
                  </div>
                )}
                {reservation.loft_id && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/${locale}/lofts/${reservation.loft_id}`}>
                      {t("viewLoftDetails")}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t("financialDetails")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Montant total - Devise originale en premier */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("totalAmount")}</label>
                  <p className="text-2xl font-bold text-green-600">
                    {effectiveCurrencyCode !== 'DZD' && reservation.original_amount
                      ? `${reservation.original_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${effectiveCurrencyCode}`
                      : `${(reservation.total_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA`
                    }
                  </p>
                  {/* Montant converti en DZD si devise étrangère - en second */}
                  {effectiveCurrencyCode !== 'DZD' && reservation.total_amount && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Montant original : {(reservation.total_amount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                    </p>
                  )}
                </div>

                {/* Prix par nuit */}
                {effectivePricePerNight && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t("pricePerNight") || "Prix / nuit"}</label>
                    <p className="text-lg font-medium">
                      {effectivePricePerNight.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {effectiveCurrencyCode}
                    </p>
                    {effectiveCurrencyCode !== 'DZD' && effectiveCurrencyRatio > 1 && (
                      <p className="text-sm text-muted-foreground">
                        ≈ {(effectivePricePerNight * effectiveCurrencyRatio).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA / nuit
                      </p>
                    )}
                  </div>
                )}

                {/* Nombre de nuits */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("nights") || "Nuits"}</label>
                  <p className="text-lg">
                    {nights} {nights > 1 ? 'nuits' : 'nuit'}
                  </p>
                </div>

                {/* Taux de change - Affiché pour toutes les devises étrangères */}
                {effectiveCurrencyCode !== 'DZD' && effectiveCurrencyRatio > 1 && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-muted-foreground">{t("exchangeRate") || "Taux de change"}</label>
                    <p className="text-base font-medium">
                      1 {effectiveCurrencyCode} = {effectiveCurrencyRatio.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DZD
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reservation.currency_ratio 
                        ? "Taux configuré lors de la saisie" 
                        : "Taux calculé depuis les montants Airbnb"
                      }
                    </p>
                  </div>
                )}

                {/* Badge de source */}
                {reservation.source === 'airbnb_scraper' && (
                  <div className="border-t pt-4">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      📱 Synchronisé depuis Airbnb
                    </Badge>
                  </div>
                )}

                {reservation.deposit_amount && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-muted-foreground">{t("deposit")}</label>
                    <p className="text-lg">
                      {moneyFormatter(effectiveCurrencyCode).format(reservation.deposit_amount)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {reservation.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t("notes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{reservation.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <ReservationEditButton reservation={reservation} availableLofts={availableLofts} />
                {airbnbListingId && (
                  <SyncLoftButton
                    listingId={airbnbListingId}
                    loftTitle={reservation.lofts?.name || ''}
                  />
                )}
                <Button asChild>
                  <Link href={`/${locale}/reservations`}>{t("backToReservations")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {canViewAudit && (
          <TabsContent value="audit" className="space-y-4">
            <AuditHistory
              tableName="reservations"
              recordId={reservation.id}
              className="w-full"
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
