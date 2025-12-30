"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { CONTACT_INFO } from "../../config/contact-info"
import { Calendar, Users, CreditCard, Phone, Mail, MessageSquare, CheckCircle } from "lucide-react"

interface SimpleBookingFormProps {
  loftName: string
  pricePerNight: number
  maxGuests?: number
  amenities?: string[]
}

export function SimpleBookingForm({ 
  loftName, 
  pricePerNight, 
  maxGuests = 6,
  amenities = ["WiFi", "Climatisation", "Cuisine équipée", "Parking"]
}: SimpleBookingFormProps) {
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    name: '',
    email: '',
    phone: '',
    message: '',
    specialRequests: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1) // 1: Dates, 2: Invités, 3: Infos, 4: Confirmation

  // Calculer le nombre de nuits et le prix total
  const calculateNights = () => {
    if (formData.checkIn && formData.checkOut) {
      const checkIn = new Date(formData.checkIn)
      const checkOut = new Date(formData.checkOut)
      const diffTime = checkOut.getTime() - checkIn.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? diffDays : 0
    }
    return 0
  }

  const nights = calculateNights()
  const subtotal = nights * pricePerNight
  const serviceFee = Math.round(subtotal * 0.05) // 5% de frais de service
  const totalPrice = subtotal + serviceFee

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Créer un message WhatsApp détaillé
      const message = `🏠 DEMANDE DE RÉSERVATION - ${loftName}

📅 DATES:
• Arrivée: ${formatDate(formData.checkIn)}
• Départ: ${formatDate(formData.checkOut)}
• Durée: ${nights} nuit${nights > 1 ? 's' : ''}

👥 INVITÉS: ${formData.guests} personne${formData.guests > 1 ? 's' : ''}

💰 TARIFICATION:
• Prix par nuit: ${formatPrice(pricePerNight)}
• Sous-total (${nights} nuits): ${formatPrice(subtotal)}
• Frais de service: ${formatPrice(serviceFee)}
• TOTAL: ${formatPrice(totalPrice)}

👤 INFORMATIONS CLIENT:
• Nom: ${formData.name}
• Email: ${formData.email}
• Téléphone: ${formData.phone}

💬 MESSAGE: ${formData.message || 'Aucun message supplémentaire'}

🎯 DEMANDES SPÉCIALES: ${formData.specialRequests || 'Aucune'}

Merci de confirmer la disponibilité et les modalités de paiement.`

      const whatsappUrl = `${CONTACT_INFO.phone.whatsapp}?text=${encodeURIComponent(message)}`
      
      // Ouvrir WhatsApp
      window.open(whatsappUrl, '_blank')
      
      // Passer à l'étape de confirmation
      setStep(4)
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const nextStep = () => {
    if (step < 4) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const canProceedToStep2 = formData.checkIn && formData.checkOut && nights > 0
  const canProceedToStep3 = formData.guests >= 1 && formData.guests <= maxGuests
  const canSubmit = formData.name && formData.email && formData.phone

  if (step === 4) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
              Demande envoyée avec succès !
            </h2>
            <p className="text-green-700 dark:text-green-300 mb-6">
              Votre demande de réservation a été transmise par WhatsApp. 
              Nous vous répondrons dans les plus brefs délais.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => {
                setStep(1)
                setFormData({
                  checkIn: '',
                  checkOut: '',
                  guests: 1,
                  name: '',
                  email: '',
                  phone: '',
                  message: '',
                  specialRequests: ''
                })
              }}>
                Nouvelle réservation
              </Button>
              <Button variant="outline" asChild>
                <a href="/business">Retour aux lofts</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Réserver {loftName}</CardTitle>
                  <CardDescription>
                    Étape {step} sur 3 - {
                      step === 1 ? "Sélectionnez vos dates" :
                      step === 2 ? "Nombre d'invités" :
                      "Vos informations"
                    }
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        s === step 
                          ? 'bg-blue-600 text-white' 
                          : s < step 
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {s < step ? '✓' : s}
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Étape 1: Dates */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="checkIn" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date d'arrivée
                        </Label>
                        <Input
                          id="checkIn"
                          type="date"
                          value={formData.checkIn}
                          onChange={(e) => handleInputChange('checkIn', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkOut" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date de départ
                        </Label>
                        <Input
                          id="checkOut"
                          type="date"
                          value={formData.checkOut}
                          onChange={(e) => handleInputChange('checkOut', e.target.value)}
                          min={formData.checkIn || new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </div>
                    
                    {nights > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-blue-800 dark:text-blue-200">
                          ✨ Parfait ! Vous avez sélectionné {nights} nuit{nights > 1 ? 's' : ''} 
                          du {formatDate(formData.checkIn)} au {formatDate(formData.checkOut)}
                        </p>
                      </div>
                    )}

                    <Button 
                      type="button" 
                      onClick={nextStep}
                      disabled={!canProceedToStep2}
                      className="w-full"
                    >
                      Continuer vers les invités
                    </Button>
                  </div>
                )}

                {/* Étape 2: Invités */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="guests" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Nombre d'invités (max {maxGuests})
                      </Label>
                      <Input
                        id="guests"
                        type="number"
                        min="1"
                        max={maxGuests}
                        value={formData.guests}
                        onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
                        required
                      />
                    </div>

                    {formData.guests > maxGuests && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-red-800 dark:text-red-200">
                          ⚠️ Ce loft peut accueillir maximum {maxGuests} personnes
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button type="button" onClick={prevStep} variant="outline" className="flex-1">
                        Retour
                      </Button>
                      <Button 
                        type="button" 
                        onClick={nextStep}
                        disabled={!canProceedToStep3}
                        className="flex-1"
                      >
                        Continuer vers les infos
                      </Button>
                    </div>
                  </div>
                )}

                {/* Étape 3: Informations personnelles */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom complet</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Téléphone
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+213 XX XX XX XX"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Message (optionnel)
                      </Label>
                      <textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Questions, demandes spéciales..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialRequests">Demandes spéciales (optionnel)</Label>
                      <textarea
                        id="specialRequests"
                        value={formData.specialRequests}
                        onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                        placeholder="Lit bébé, accès handicapé, arrivée tardive..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button type="button" onClick={prevStep} variant="outline" className="flex-1">
                        Retour
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting || !canSubmit}
                        className="flex-1"
                      >
                        {isSubmitting ? (
                          "Envoi en cours..."
                        ) : (
                          "📱 Envoyer la demande"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
        {/* Résumé de la réservation - Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Résumé de la réservation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Informations du loft */}
              <div className="pb-4 border-b">
                <h3 className="font-semibold text-lg">{loftName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatPrice(pricePerNight)} par nuit
                </p>
              </div>

              {/* Équipements */}
              <div className="pb-4 border-b">
                <h4 className="font-medium mb-2">Équipements inclus</h4>
                <div className="flex flex-wrap gap-1">
                  {amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Détails de la réservation */}
              {step > 1 && nights > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Dates:</span>
                    <span className="font-medium">
                      {formData.checkIn && formData.checkOut ? 
                        `${new Date(formData.checkIn).toLocaleDateString('fr-FR')} - ${new Date(formData.checkOut).toLocaleDateString('fr-FR')}` 
                        : 'Non sélectionnées'
                      }
                    </span>
                  </div>
                  
                  {step > 2 && (
                    <div className="flex justify-between text-sm">
                      <span>Invités:</span>
                      <span className="font-medium">{formData.guests} personne{formData.guests > 1 ? 's' : ''}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{formatPrice(pricePerNight)} × {nights} nuit{nights > 1 ? 's' : ''}</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Frais de service</span>
                      <span>{formatPrice(serviceFee)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-blue-600 dark:text-blue-400">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Informations de contact */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Besoin d'aide ?</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={CONTACT_INFO.phone.link} className="text-blue-600 hover:underline">
                      {CONTACT_INFO.phone.display}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={CONTACT_INFO.email.link} className="text-blue-600 hover:underline">
                      {CONTACT_INFO.email.display}
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}