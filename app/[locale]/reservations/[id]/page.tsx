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

export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole(["admin", "manager"])
  
  const reservation = await getReservation(id);

  if (!reservation) {
    notFound()
  }

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

  // Check if user can view audit history
  const canViewAudit = AuditPermissionManager.canViewEntityAuditHistory(
    session.user.role, 
    'reservations', 
    reservation.id
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Reservation for {reservation.guest_name}</CardTitle>
              <CardDescription>
                {new Date(reservation.check_in_date).toLocaleDateString()} - {new Date(reservation.check_out_date).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(reservation.status)}>{reservation.status}</Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Reservation Details</TabsTrigger>
          {canViewAudit && (
            <TabsTrigger value="audit">Audit History</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guest Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Guest Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg">{reservation.guest_name}</p>
                </div>
                {reservation.guest_email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p>{reservation.guest_email}</p>
                  </div>
                )}
                {reservation.guest_phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p>{reservation.guest_phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reservation Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Check-in Date</label>
                  <p className="text-lg">{new Date(reservation.check_in_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Check-out Date</label>
                  <p className="text-lg">{new Date(reservation.check_out_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Number of Guests</label>
                  <p>{reservation.number_of_guests || 'Not specified'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Loft Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Loft Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Loft Name</label>
                  <p className="text-lg">{reservation.lofts?.name || 'Unknown Loft'}</p>
                </div>
                {reservation.lofts?.address && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p>{reservation.lofts.address}</p>
                  </div>
                )}
                {reservation.loft_id && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/lofts/${reservation.loft_id}`}>
                      View Loft Details
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
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                  <p className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('fr-FR', { 
                      style: 'currency', 
                      currency: 'DZD' 
                    }).format(reservation.total_amount || 0)}
                  </p>
                </div>
                {reservation.deposit_amount && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Deposit</label>
                    <p className="text-lg">
                      {new Intl.NumberFormat('fr-FR', { 
                        style: 'currency', 
                        currency: 'DZD' 
                      }).format(reservation.deposit_amount)}
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
                <CardTitle>Notes</CardTitle>
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
                <Button asChild variant="outline">
                  <Link href={`/reservations/${reservation.id}/edit`}>Edit Reservation</Link>
                </Button>
                <Button asChild>
                  <Link href="/reservations">Back to Reservations</Link>
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