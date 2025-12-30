"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, MapPin, DollarSign, Users, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface BookingFormProps {
  loft: any
  clientId: string
  locale: string
}

export function BookingForm({ loft, clientId, locale }: BookingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
    guests: 1,
    message: ""
  })

  const calculateNights = () => {
    if (!formData.checkIn || !formData.checkOut) return 0
    const start = new Date(formData.checkIn)
    const end = new Date(formData.checkOut)
    const diff = end.getTime() - start.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const calculateTotal = () => {
    const nights = calculateNights()
    return nights * (loft.price_per_night || 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loft_id: loft.id,
          client_id: clientId,
          check_in: formData.checkIn,
          check_out: formData.checkOut,
          guests: formData.guests,
          message: formData.message,
          total_price: calculateTotal(),
          status: "pending"
        })
      })

      if (!response.ok) throw new Error("Erreur lors de la réservation")

      toast.success("Réservation envoyée !", {
        description: "Votre demande de réservation a été envoyée. Vous recevrez une confirmation par email."
      })

      router.push(`/${locale}/client/dashboard`)
    } catch (error) {
      console.error(error)
      toast.error("Erreur", {
        description: "Impossible d'envoyer la réservation. Veuillez réessayer."
      })
    } finally {
      setLoading(false)
    }
  }

  const nights = calculateNights()
  const total = calculateTotal()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/lofts/${loft.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Réserver {loft.name}</h1>
          <p className="text-gray-600 flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4" />
            {loft.address}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Formulaire */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Détails de la réservation</CardTitle>
            <CardDescription>Remplissez les informations pour votre séjour</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkIn">Date d'arrivée</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOut">Date de départ</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    required
                    min={formData.checkIn || new Date().toISOString().split('T')[0]}
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guests">Nombre de voyageurs</Label>
                <Input
                  id="guests"
                  type="number"
                  required
                  min={1}
                  max={loft.max_guests || 10}
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                />
                <p className="text-sm text-gray-500">Maximum: {loft.max_guests || 10} personnes</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (optionnel)</Label>
                <Textarea
                  id="message"
                  placeholder="Avez-vous des demandes spéciales ?"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading || nights <= 0}
              >
                {loading ? "Envoi en cours..." : "Confirmer la réservation"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Résumé */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Prix par nuit</span>
                <span className="font-semibold">{loft.price_per_night?.toLocaleString()} DA</span>
              </div>
              
              {nights > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Nombre de nuits
                    </span>
                    <span className="font-semibold">{nights}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Voyageurs
                    </span>
                    <span className="font-semibold">{formData.guests}</span>
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg flex items-center gap-1">
                        <DollarSign className="h-5 w-5" />
                        Total
                      </span>
                      <span className="font-bold text-lg text-blue-600">
                        {total.toLocaleString()} DA
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
              <p className="font-semibold mb-1">Politique d'annulation</p>
              <p>{loft.cancellation_policy === 'flexible' ? 'Annulation gratuite jusqu\'à 24h avant l\'arrivée' : 'Voir les conditions'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
