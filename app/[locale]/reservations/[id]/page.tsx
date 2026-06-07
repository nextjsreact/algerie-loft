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

export default async function ReservationPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const session = await requireRole(["admin", "manager"])
  const t = await getTranslations("reservations.details")
  const tStatus = await getTranslations("reservations.status")

  const reservation = await getReservation(id);

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
                  <p>{reservation.number_of_guests || t("notSpecified")}</p>
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
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("totalAmount")}</label>
                  <p className="text-2xl font-bold text-green-600">
                    {moneyFormatter(reservation.currency_code).format(reservation.total_amount || 0)}
                  </p>
                  {reservation.original_amount && reservation.original_currency_code && reservation.original_currency_code !== 'DZD' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ≈ {moneyFormatter(reservation.original_currency_code).format(reservation.original_amount)}
                    </p>
                  )}
                </div>

                {/* Prix par nuit */}
                {reservation.price_per_night_input && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t("pricePerNight") || "Prix / nuit"}</label>
                    <p className="text-lg">
                      {moneyFormatter(reservation.currency_code).format(reservation.price_per_night_input)}
                    </p>
                  </div>
                )}

                {/* Taux de change */}
                {reservation.currency_ratio && reservation.currency_code && reservation.currency_code !== 'DZD' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t("exchangeRate") || "Taux de change"}</label>
                    <p className="text-base">
                      1 {reservation.currency_code} = {reservation.currency_ratio.toLocaleString('fr-DZ')} DZD
                    </p>
                  </div>
                )}

                {/* Devise originale (réservations Airbnb avec devise étrangère) */}
                {reservation.original_currency_code && reservation.original_currency_code !== 'DZD' && !reservation.currency_ratio && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t("originalCurrency") || "Devise originale"}</label>
                    <p className="text-base font-medium">
                      {reservation.original_currency_code}
                      {reservation.original_amount && (
                        <span className="text-muted-foreground ml-2">
                          ({moneyFormatter(reservation.original_currency_code).format(reservation.original_amount)})
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {reservation.deposit_amount && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t("deposit")}</label>
                    <p className="text-lg">
                      {moneyFormatter(reservation.currency_code).format(reservation.deposit_amount)}
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
              <div className="flex gap-4">
                <ReservationEditButton reservation={reservation} availableLofts={availableLofts} />
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
