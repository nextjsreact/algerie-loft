'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Users, 
  CreditCard, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  Loader2,
  MapPin,
  Clock,
  AlertCircle
} from 'lucide-react'
import { ClientLoftView } from '@/lib/types'

interface BookingFlowProps {
  loft: ClientLoftView
  onBack: () => void
  onComplete: (bookingId: string) => void
}

interface BookingData {
  checkIn: string
  checkOut: string
  guests: number
  specialRequests: string
}

interface PricingData {
  basePrice: number
  nights: number
  pricePerNight: number
  fees: {
    service: number
    cleaning: number
  }
  total: number
}

const steps = [
  { id: 1, title: 'Dates et voyageurs', icon: Calendar },
  { id: 2, title: 'Détails', icon: Users },
  { id: 3, title: 'Paiement', icon: CreditCard },
  { id: 4, title: 'Confirmation', icon: CheckCircle }
]

export function BookingFlow({ loft, onBack, onComplete }: BookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingData, setBookingData] = useState<BookingData>({
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: ''
  })
  const [pricing, setPricing] = useState<PricingData | null>(null)

  const handleInputChange = (field: keyof BookingData, value: any) => {
    setBookingData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const checkAvailability = async () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        check_in: bookingData.checkIn,
        check_out: bookingData.checkOut
      })

      const response = await fetch(`/api/lofts/${loft.id}/availability?${params}`)
      const data = await response.json()

      if (response.ok) {
        if (data.available) {
          setPricing(data.pricing)
          setError(null)
        } else {
          setError(data.message || 'Le loft n\'est pas disponible pour ces dates')
          setPricing(null)
        }
      } else {
        setError(data.error || 'Erreur lors de la vérification de disponibilité')
        setPricing(null)
      }
    } catch (err) {
      setError('Erreur de connexion')
      setPricing(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (bookingData.checkIn && bookingData.checkOut) {
      checkAvailability()
    }
  }, [bookingData.checkIn, bookingData.checkOut])

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!bookingData.checkIn || !bookingData.checkOut) {
          setError('Veuillez sélectionner les dates d\'arrivée et de départ')
          return false
        }
        if (new Date(bookingData.checkIn) >= new Date(bookingData.checkOut)) {
          setError('La date de départ doit être après la date d\'arrivée')
          return false
        }
        if (!pricing) {
          setError('Veuillez vérifier la disponibilité')
          return false
        }
        return true
      case 2:
        if (bookingData.guests < 1) {
          setError('Le nombre de voyageurs doit être d\'au moins 1')
          return false
        }
        return true
      case 3:
        // Payment validation would go here
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
      setError(null)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const handleBookingSubmit = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          loft_id: loft.id,
          check_in: bookingData.checkIn,
          check_out: bookingData.checkOut,
          guests: bookingData.guests,
          special_requests: bookingData.specialRequests,
          total_price: pricing?.total
        })
      })

      const data = await response.json()

      if (response.ok) {
        onComplete(data.booking.id)
      } else {
        setError(data.error || 'Erreur lors de la création de la réservation')
      }
    } catch (err) {
      setError('Erreur de connexion')
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

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 px-4 md:px-0">
      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between py-2">
          <Button variant="ghost" onClick={onBack} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-lg font-bold">Réservation</h1>
          <div className="w-16"></div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au loft
        </Button>
        <h1 className="text-2xl font-bold">Réservation</h1>
        <div></div>
      </div>

      {/* Mobile Progress Steps */}
      <div className="md:hidden">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full border-2 mb-1
                      ${isActive ? 'border-blue-500 bg-blue-500 text-white' : 
                        isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                        'border-gray-300 text-gray-400'}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className={`text-xs font-medium text-center ${
                      isActive ? 'text-blue-600' : 
                      isCompleted ? 'text-green-600' : 
                      'text-gray-500'
                    }`}>
                      {step.title.split(' ')[0]}
                    </p>
                    {index < steps.length - 1 && (
                      <div className={`
                        absolute top-4 w-8 h-0.5 ml-8
                        ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}
                      `} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Progress Steps */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2
                      ${isActive ? 'border-blue-500 bg-blue-500 text-white' : 
                        isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                        'border-gray-300 text-gray-400'}
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-blue-600' : 
                        isCompleted ? 'text-green-600' : 
                        'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`
                        w-12 h-0.5 mx-4
                        ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}
                      `} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4 md:pb-6">
              <CardTitle className="text-lg md:text-xl">{steps[currentStep - 1].title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Step 1: Dates and Guests */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="checkIn">Date d'arrivée</Label>
                      <Input
                        id="checkIn"
                        type="date"
                        value={bookingData.checkIn}
                        onChange={(e) => handleInputChange('checkIn', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="h-12 md:h-10 text-base md:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkOut">Date de départ</Label>
                      <Input
                        id="checkOut"
                        type="date"
                        value={bookingData.checkOut}
                        onChange={(e) => handleInputChange('checkOut', e.target.value)}
                        min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                        className="h-12 md:h-10 text-base md:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guests">Nombre de voyageurs</Label>
                    <Input
                      id="guests"
                      type="number"
                      min="1"
                      max="8"
                      value={bookingData.guests}
                      onChange={(e) => handleInputChange('guests', Number(e.target.value))}
                      className="h-12 md:h-10 text-base md:text-sm"
                    />
                  </div>

                  {isLoading && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span className="text-sm md:text-base">Vérification de la disponibilité...</span>
                    </div>
                  )}

                  {pricing && (
                    <Alert>
                      <CheckCircle className="w-4 h-4" />
                      <AlertDescription className="text-sm md:text-base">
                        Disponible ! Total: {formatPrice(pricing.total)} pour {pricing.nights} nuit{pricing.nights > 1 ? 's' : ''}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Step 2: Details */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialRequests">Demandes spéciales (optionnel)</Label>
                    <Textarea
                      id="specialRequests"
                      placeholder="Arrivée tardive, besoins particuliers, etc."
                      value={bookingData.specialRequests}
                      onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                      rows={4}
                      className="text-base md:text-sm resize-none"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-base md:text-lg">Récapitulatif de votre séjour</h4>
                    <div className="space-y-3 text-sm md:text-base">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Arrivée:</span>
                        <span className="font-medium">{formatDate(bookingData.checkIn)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Départ:</span>
                        <span className="font-medium">{formatDate(bookingData.checkOut)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Voyageurs:</span>
                        <span className="font-medium">{bookingData.guests}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <Alert>
                    <CreditCard className="w-4 h-4" />
                    <AlertDescription>
                      Le paiement sera traité de manière sécurisée. Vous ne serez débité qu'après confirmation de la réservation par l'hôte.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Informations de paiement</h4>
                    <p className="text-sm text-gray-600">
                      Le système de paiement sera intégré dans une prochaine version. 
                      Pour le moment, la réservation sera créée en attente de paiement.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div className="text-center space-y-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                  <h3 className="text-xl font-semibold">Réservation confirmée !</h3>
                  <p className="text-gray-600">
                    Votre demande de réservation a été envoyée à l'hôte. 
                    Vous recevrez une confirmation par email sous peu.
                  </p>
                </div>
              )}

              {/* Mobile Navigation Buttons */}
              <div className="md:hidden">
                <div className="flex flex-col gap-3 pt-6">
                  {currentStep < steps.length ? (
                    <Button
                      onClick={currentStep === 3 ? handleBookingSubmit : handleNext}
                      disabled={isLoading || (currentStep === 1 && !pricing)}
                      className="w-full h-12 text-base"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : currentStep === 3 ? (
                        'Confirmer la réservation'
                      ) : (
                        <>
                          Suivant
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button onClick={() => onComplete('booking-id')} className="w-full h-12 text-base">
                      Terminer
                    </Button>
                  )}
                  
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={isLoading}
                      className="w-full h-12 text-base"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Précédent
                    </Button>
                  )}
                </div>
              </div>

              {/* Desktop Navigation Buttons */}
              <div className="hidden md:flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1 || isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Précédent
                </Button>

                {currentStep < steps.length ? (
                  <Button
                    onClick={currentStep === 3 ? handleBookingSubmit : handleNext}
                    disabled={isLoading || (currentStep === 1 && !pricing)}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : currentStep === 3 ? (
                      'Confirmer la réservation'
                    ) : (
                      <>
                        Suivant
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={() => onComplete('booking-id')}>
                    Terminer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Sidebar - Bottom Sheet Style */}
        <div className="lg:hidden order-first">
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* Loft Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-base">{loft.name}</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span className="line-clamp-1">{loft.address}</span>
                </div>
              </div>

              {/* Pricing Breakdown */}
              {pricing && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-lg font-bold">{formatPrice(pricing.total)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {pricing.nights} nuit{pricing.nights > 1 ? 's' : ''} • {formatPrice(pricing.pricePerNight)}/nuit
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Desktop Sidebar - Sticky */}
        <div className="hidden lg:block lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="p-6 space-y-4">
              {/* Loft Info */}
              <div className="space-y-2">
                <h3 className="font-semibold">{loft.name}</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  {loft.address}
                </div>
              </div>

              <Separator />

              {/* Pricing Breakdown */}
              {pricing && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Détail des prix</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{formatPrice(pricing.pricePerNight)} × {pricing.nights} nuit{pricing.nights > 1 ? 's' : ''}</span>
                      <span>{formatPrice(pricing.basePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de service</span>
                      <span>{formatPrice(pricing.fees.service)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de ménage</span>
                      <span>{formatPrice(pricing.fees.cleaning)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(pricing.total)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}