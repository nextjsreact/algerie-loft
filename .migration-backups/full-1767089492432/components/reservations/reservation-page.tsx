"use client"

import { useState, useEffect, useCallback } from 'react'
import { useClientAuth } from '@/contexts/ClientAuthContext'
import { ReservationEntry } from './reservation-entry'
import { LoftSearch } from '@/components/lofts/loft-search'
import { BookingForm } from './booking-form'
import { ReservationErrorBoundary } from './reservation-error-boundary'
import { UserFeedbackSystem, useReservationFeedback, usePerformanceFeedback } from './user-feedback-system'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Search, 
  Calendar, 
  CreditCard,
  MapPin,
  Users,
  Clock,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react'
import type { ClientAuthSession } from '@/lib/types/client-auth'
import type { LoftSearchResult, SearchCriteria } from '@/lib/services/loft'
import type { ReservationRequest, PricingBreakdown } from '@/lib/schemas/booking'

type ReservationStep = 'auth' | 'search' | 'booking' | 'confirmation'

interface ReservationPageProps {
  initialStep?: ReservationStep
  initialSearchCriteria?: SearchCriteria
  onReservationComplete?: (reservation: ReservationRequest) => void
  className?: string
}

interface ReservationState {
  currentStep: ReservationStep
  selectedLoft: LoftSearchResult | null
  searchCriteria: SearchCriteria
  pricing: PricingBreakdown | null
  reservation: ReservationRequest | null
  loading: boolean
  error: string | null
}

const STEPS = [
  { key: 'auth' as const, title: 'Sign In', icon: Users, description: 'Authenticate to continue' },
  { key: 'search' as const, title: 'Find Loft', icon: Search, description: 'Search and select your loft' },
  { key: 'booking' as const, title: 'Book', icon: Calendar, description: 'Complete your reservation' },
  { key: 'confirmation' as const, title: 'Confirm', icon: CheckCircle, description: 'Reservation confirmed' }
]

export function ReservationPage({ 
  initialStep = 'auth',
  initialSearchCriteria,
  onReservationComplete,
  className 
}: ReservationPageProps) {
  const { user, isAuthenticated, isLoading } = useClientAuth()
  const reservationFeedback = useReservationFeedback()
  const performanceFeedback = usePerformanceFeedback()
  
  const [state, setState] = useState<ReservationState>({
    currentStep: initialStep,
    selectedLoft: null,
    searchCriteria: {
      guests: 1,
      sortBy: 'rating',
      sortOrder: 'desc',
      ...initialSearchCriteria
    },
    pricing: null,
    reservation: null,
    loading: false,
    error: null
  })

  const [isOnline, setIsOnline] = useState(true)
  const [connectionQuality, setConnectionQuality] = useState<'fast' | 'slow' | 'offline'>('fast')

  // Monitor connection status and quality
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setConnectionQuality('fast')
      reservationFeedback.feedbackSystem.showSuccess('Connection Restored', 'You are back online!')
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setConnectionQuality('offline')
      reservationFeedback.feedbackSystem.showError('Connection Lost', 'You are currently offline. Please check your internet connection.', true)
    }

    // Monitor connection quality
    const checkConnectionQuality = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          setConnectionQuality('slow')
          performanceFeedback.showSlowConnection()
        }
      }
    }

    setIsOnline(navigator.onLine)
    checkConnectionQuality()
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [reservationFeedback.feedbackSystem, performanceFeedback])

  // Auto-advance from auth step if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && state.currentStep === 'auth') {
      setState(prev => ({ ...prev, currentStep: 'search' }))
      if (user.first_name) {
        reservationFeedback.showAuthSuccess(user.first_name)
      }
    }
  }, [isAuthenticated, user, state.currentStep, reservationFeedback])

  // Detect mobile and show optimized experience message
  useEffect(() => {
    const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (isMobile) {
      performanceFeedback.showOptimizedExperience()
    }
  }, [performanceFeedback])

  // Calculate current step index and progress
  const currentStepIndex = STEPS.findIndex(step => step.key === state.currentStep)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  const handleAuthSuccess = useCallback((session: ClientAuthSession) => {
    setState(prev => ({ 
      ...prev, 
      currentStep: 'search',
      error: null 
    }))
    
    if (session.user?.first_name) {
      reservationFeedback.showAuthSuccess(session.user.first_name)
    }
  }, [reservationFeedback])

  const handleLoftSelect = useCallback(async (loft: LoftSearchResult) => {
    if (!isOnline) {
      reservationFeedback.showNetworkError()
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    const loadingId = reservationFeedback.showBookingProgress('Calculating pricing')
    
    try {
      // Calculate pricing for the selected loft and dates
      const pricing = await calculatePricing(loft, state.searchCriteria)
      
      setState(prev => ({ 
        ...prev, 
        selectedLoft: loft,
        pricing,
        currentStep: 'booking',
        loading: false
      }))
      
      reservationFeedback.feedbackSystem.hideFeedback(loadingId)
      reservationFeedback.feedbackSystem.showSuccess(
        'Loft Selected',
        `${loft.name} is available for your dates. Complete your booking details below.`
      )
    } catch (error) {
      reservationFeedback.feedbackSystem.hideFeedback(loadingId)
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate pricing'
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        loading: false
      }))
      
      reservationFeedback.showBookingError(errorMessage)
    }
  }, [state.searchCriteria, isOnline, reservationFeedback])

  const handleSearchCriteriaChange = useCallback((criteria: SearchCriteria) => {
    setState(prev => ({ ...prev, searchCriteria: criteria }))
  }, [])

  const handleBookingSubmit = useCallback(async (reservation: ReservationRequest) => {
    if (!isOnline) {
      reservationFeedback.showNetworkError()
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    const loadingId = reservationFeedback.showBookingProgress('Submitting reservation')
    
    try {
      // Update progress
      reservationFeedback.updateBookingProgress(loadingId, 25, 'Validating booking details')
      
      // Submit the reservation
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservation)
      })

      reservationFeedback.updateBookingProgress(loadingId, 75, 'Processing payment')

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to create reservation')
      }

      const result = await response.json()
      
      reservationFeedback.updateBookingProgress(loadingId, 100, 'Finalizing reservation')
      
      setState(prev => ({ 
        ...prev, 
        reservation: result.reservation,
        currentStep: 'confirmation',
        loading: false
      }))

      reservationFeedback.feedbackSystem.hideFeedback(loadingId)
      reservationFeedback.showBookingSuccess(result.reservation.id || 'N/A')

      if (onReservationComplete) {
        onReservationComplete(result.reservation)
      }
    } catch (error) {
      reservationFeedback.feedbackSystem.hideFeedback(loadingId)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create reservation'
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        loading: false
      }))
      
      reservationFeedback.showBookingError(errorMessage)
    }
  }, [onReservationComplete, isOnline, reservationFeedback])

  const handleBackStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      const prevStep = STEPS[prevIndex].key
      setState(prev => ({ 
        ...prev, 
        currentStep: prevStep,
        error: null
      }))
    }
  }, [currentStepIndex])

  const handleRetryStep = useCallback(() => {
    setState(prev => ({ ...prev, error: null, loading: false }))
  }, [])

  // Helper function to calculate pricing
  const calculatePricing = async (loft: LoftSearchResult, criteria: SearchCriteria): Promise<PricingBreakdown> => {
    if (!criteria.checkIn || !criteria.checkOut) {
      throw new Error('Check-in and check-out dates are required')
    }

    const checkIn = new Date(criteria.checkIn)
    const checkOut = new Date(criteria.checkOut)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    
    if (nights <= 0) {
      throw new Error('Invalid date range')
    }

    const subtotal = loft.price_per_night * nights
    const cleaningFee = loft.cleaning_fee || 0
    const serviceFee = subtotal * 0.1 // 10% service fee
    const taxes = (subtotal + serviceFee) * 0.08 // 8% tax
    const total = subtotal + cleaningFee + serviceFee + taxes

    return {
      nightlyRate: loft.price_per_night,
      nights,
      subtotal,
      cleaningFee,
      serviceFee,
      taxes,
      total
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading reservation system...</p>
        </div>
      </div>
    )
  }

  return (
    <ReservationErrorBoundary
      onError={(error, errorInfo) => {
        reservationFeedback.feedbackSystem.showError(
          'System Error',
          'An unexpected error occurred. Our team has been notified.',
          true
        )
      }}
    >
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${className}`}>
        <UserFeedbackSystem position="top" maxMessages={3} />
      {/* Header with Progress */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="space-y-3 sm:space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progress} className="w-full h-1.5 sm:h-2" />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Badge variant="outline" className="text-xs sm:text-sm px-2 py-1">
                    {currentStepIndex + 1}/{STEPS.length}
                  </Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground hidden xs:block">
                    {STEPS[currentStepIndex]?.description}
                  </span>
                </div>
                {currentStepIndex > 0 && state.currentStep !== 'confirmation' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBackStep}
                    disabled={state.loading}
                    className="px-2 sm:px-3"
                  >
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Step Indicators - Mobile Optimized */}
            <div className="flex items-center justify-center overflow-x-auto">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-max px-4">
                {STEPS.map((step, index) => {
                  const isActive = index === currentStepIndex
                  const isCompleted = index < currentStepIndex
                  const StepIcon = step.icon

                  return (
                    <div key={step.key} className="flex items-center">
                      <div className={`
                        flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-200
                        ${isActive ? 'border-primary bg-primary text-white' : 
                          isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                          'border-gray-300 bg-white text-gray-400'}
                      `}>
                        <StepIcon className="h-3 w-3 sm:h-5 sm:w-5" />
                      </div>
                      <div className="ml-1 sm:ml-2 hidden md:block">
                        <p className={`text-xs sm:text-sm font-medium ${
                          isActive ? 'text-primary' : 
                          isCompleted ? 'text-green-600' : 
                          'text-gray-500'
                        }`}>
                          {step.title}
                        </p>
                      </div>
                      {index < STEPS.length - 1 && (
                        <div className={`
                          w-4 sm:w-8 h-0.5 mx-2 sm:mx-4 transition-all duration-200
                          ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}
                        `} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Error Display */}
        {state.error && (
          <Alert variant="destructive" className="max-w-4xl mx-auto mb-4 sm:mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-sm">{state.error}</span>
              <Button variant="outline" size="sm" onClick={handleRetryStep} className="self-start sm:self-auto">
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <div className="max-w-6xl mx-auto">
          {state.currentStep === 'auth' && (
            <ReservationEntry
              onAuthSuccess={handleAuthSuccess}
              showWelcome={true}
            />
          )}

          {state.currentStep === 'search' && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <span className="truncate">Find Your Perfect Loft</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <LoftSearch
                  onLoftSelect={handleLoftSelect}
                  onCriteriaChange={handleSearchCriteriaChange}
                  initialCriteria={state.searchCriteria}
                />
              </CardContent>
            </Card>
          )}

          {state.currentStep === 'booking' && state.selectedLoft && state.pricing && user && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <span className="truncate">Complete Your Booking</span>
                </CardTitle>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">{state.selectedLoft.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">{state.searchCriteria.checkIn} - {state.searchCriteria.checkOut}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{state.searchCriteria.guests} guests</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <BookingForm
                  loft={state.selectedLoft as any} // Type conversion needed
                  checkIn={state.searchCriteria.checkIn!}
                  checkOut={state.searchCriteria.checkOut!}
                  guests={state.searchCriteria.guests || 1}
                  user={user as any} // Type conversion needed
                  pricing={state.pricing}
                  onSubmit={handleBookingSubmit}
                  onCancel={handleBackStep}
                />
              </CardContent>
            </Card>
          )}

          {state.currentStep === 'confirmation' && state.reservation && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl max-w-2xl mx-auto">
              <CardHeader className="text-center pb-4 sm:pb-6">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-xl sm:text-2xl text-green-600">Reservation Confirmed!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                <div className="text-center space-y-2">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Your reservation has been successfully submitted and is being processed.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    You will receive a confirmation email shortly with all the details.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm sm:text-base">Reservation ID:</span>
                    <span className="font-mono text-xs sm:text-sm">{state.reservation.userId.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm sm:text-base">Status:</span>
                    <Badge variant="secondary" className="text-xs">Pending Confirmation</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm sm:text-base">Total Amount:</span>
                    <span className="font-semibold text-base sm:text-lg">€{state.pricing?.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full min-h-[44px]"
                    onClick={() => window.location.href = '/'}
                  >
                    Return Home
                  </Button>
                  <Button 
                    className="w-full min-h-[44px]"
                    onClick={() => window.location.href = '/reservations'}
                  >
                    View My Reservations
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Loading Overlay */}
        {state.loading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="font-medium">Processing...</span>
              </div>
            </Card>
          </div>
        )}
      </div>
      </div>
    </ReservationErrorBoundary>
  )
}