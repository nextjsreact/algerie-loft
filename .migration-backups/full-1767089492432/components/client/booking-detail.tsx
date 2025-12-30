'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  CreditCard,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react'
import { BookingWithDetails } from '@/lib/types'

interface BookingDetailProps {
  bookingId: string
  onBack: () => void
}

export function BookingDetail({ bookingId, onBack }: BookingDetailProps) {
  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBooking()
  }, [bookingId])

  const loadBooking = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      if (response.ok) {
        const data = await response.json()
        setBooking(data.booking)
      } else {
        setError('Réservation non trouvée')
      }
    } catch (err) {
      setError('Erreur lors du chargement de la réservation')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        label: 'En attente de confirmation',
        description: 'Votre réservation est en attente de confirmation par l\'hôte.'
      },
      confirmed: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        label: 'Confirmée',
        description: 'Votre réservation est confirmée ! Vous recevrez les détails d\'accès prochainement.'
      },
      cancelled: {
        color: 'bg-red-100 text-red-800',
        icon: AlertCircle,
        label: 'Annulée',
        description: 'Cette réservation a été annulée.'
      },
      completed: {
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircle,
        label: 'Terminée',
        description: 'Votre séjour est terminé. N\'hésitez pas à laisser un avis !'
      }
    }

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 3 }, (_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error || 'Réservation non trouvée'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const statusInfo = getStatusInfo(booking.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Réservation {booking.booking_reference}</h1>
            <p className="text-gray-600">{booking.loft.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${statusInfo.color}`}>
                  <StatusIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{statusInfo.label}</h3>
                  <p className="text-gray-600">{statusInfo.description}</p>
                  
                  {booking.status === 'pending' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Que se passe-t-il maintenant ?</strong><br />
                        L'hôte a 24 heures pour confirmer votre réservation. 
                        Vous recevrez une notification dès qu'une décision sera prise.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle>Détails du séjour</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Arrivée</span>
                  </div>
                  <p className="font-semibold">{formatDate(booking.check_in)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Départ</span>
                  </div>
                  <p className="font-semibold">{formatDate(booking.check_out)}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Voyageurs</span>
                  </div>
                  <p className="font-semibold">{booking.guests} personne{booking.guests > 1 ? 's' : ''}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Adresse</span>
                  </div>
                  <p className="font-semibold">{booking.loft.address}</p>
                </div>
              </div>

              {booking.special_requests && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Demandes spéciales</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {booking.special_requests}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Host Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact avec l'hôte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{booking.partner.business_name || booking.partner.full_name}</h4>
                  <p className="text-sm text-gray-600">Votre hôte</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  {booking.status === 'confirmed' && (
                    <Button variant="outline" size="sm">
                      <Phone className="w-4 h-4 mr-2" />
                      Appeler
                    </Button>
                  )}
                </div>
              </div>

              {booking.status === 'confirmed' && (
                <Alert>
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    Les informations de contact détaillées vous seront envoyées 24h avant votre arrivée.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Price Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Détail des prix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Prix de base</span>
                  <span>{formatPrice(booking.total_price * 0.8)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de service</span>
                  <span>{formatPrice(booking.total_price * 0.1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de ménage</span>
                  <span>{formatPrice(booking.total_price * 0.1)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(booking.total_price)}</span>
              </div>

              <div className="text-center">
                <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                  {booking.payment_status === 'paid' ? 'Payé' : 
                   booking.payment_status === 'pending' ? 'En attente de paiement' : 
                   booking.payment_status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {booking.status === 'pending' && (
                <Button variant="outline" className="w-full">
                  Modifier la réservation
                </Button>
              )}
              
              {booking.status === 'confirmed' && (
                <Button variant="outline" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contacter l'hôte
                </Button>
              )}

              {booking.status === 'completed' && (
                <Button className="w-full">
                  Laisser un avis
                </Button>
              )}

              {['pending', 'confirmed'].includes(booking.status) && (
                <Button variant="destructive" className="w-full">
                  Annuler la réservation
                </Button>
              )}

              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Télécharger la confirmation
              </Button>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Besoin d'aide ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Centre d'aide
              </Button>
              <Button variant="outline" className="w-full">
                <Phone className="w-4 h-4 mr-2" />
                Nous contacter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}