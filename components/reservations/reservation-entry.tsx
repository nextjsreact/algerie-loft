"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useClientAuth } from '@/contexts/ClientAuthContext'
import { ClientAuthGateway } from '@/components/auth/client-auth-gateway'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Calendar, Users, MapPin, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react'
import type { ClientAuthSession } from '@/lib/types/client-auth'

interface ReservationEntryProps {
  onAuthSuccess?: (session: ClientAuthSession) => void
  onProceedToReservation?: () => void
  returnUrl?: string
  showWelcome?: boolean
}

export function ReservationEntry({ 
  onAuthSuccess, 
  onProceedToReservation, 
  returnUrl,
  showWelcome = true 
}: ReservationEntryProps) {
  const { user, isLoading, isAuthenticated } = useClientAuth()
  const [showAuthGateway, setShowAuthGateway] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const router = useRouter()

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-proceed if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && onProceedToReservation) {
      onProceedToReservation()
    }
  }, [isAuthenticated, user, onProceedToReservation])

  // Handle authentication errors
  useEffect(() => {
    if (!isLoading && !isAuthenticated && error) {
      setError(null)
    }
  }, [isLoading, isAuthenticated, error])

  const handleAuthSuccess = (session: ClientAuthSession) => {
    setShowAuthGateway(false)
    setError(null)
    
    if (onAuthSuccess) {
      onAuthSuccess(session)
    }
    
    if (onProceedToReservation) {
      onProceedToReservation()
    } else if (returnUrl) {
      router.push(returnUrl)
    }
  }

  const handleAuthError = (errorMessage: string) => {
    setError(errorMessage)
    setShowAuthGateway(false)
  }

  const handleStartReservation = () => {
    if (isAuthenticated) {
      if (onProceedToReservation) {
        onProceedToReservation()
      }
    } else {
      setShowAuthGateway(true)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <div>
            <p className="text-muted-foreground">Checking authentication status...</p>
            <p className="text-sm text-muted-foreground mt-1">Please wait while we verify your session</p>
          </div>
        </div>
      </div>
    )
  }

  // Offline state
  if (!isOnline) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <WifiOff className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">You're Offline</CardTitle>
            <CardDescription>
              Please check your internet connection to continue with your reservation.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showAuthGateway) {
    return (
      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="max-w-md mx-auto mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <ClientAuthGateway
          returnUrl={returnUrl}
          onAuthSuccess={handleAuthSuccess}
          onClose={() => setShowAuthGateway(false)}
        />
      </div>
    )
  }

  if (isAuthenticated && user) {
    if (!showWelcome) {
      // Skip welcome screen and proceed directly
      if (onProceedToReservation) {
        onProceedToReservation()
      }
      return null
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="max-w-2xl mx-auto mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Welcome back! You're successfully logged in and ready to make a reservation.
          </AlertDescription>
        </Alert>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Welcome back, {user.first_name}!</CardTitle>
            <CardDescription>
              Ready to find your perfect loft? Let's get started with your reservation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Choose Dates</h3>
                <p className="text-sm text-muted-foreground">Select your check-in and check-out dates</p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Find Location</h3>
                <p className="text-sm text-muted-foreground">Browse available lofts in your area</p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Book & Enjoy</h3>
                <p className="text-sm text-muted-foreground">Complete your reservation and enjoy your stay</p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <Button 
                size="lg" 
                onClick={handleStartReservation}
                className="px-8 py-3"
              >
                Start Your Reservation
              </Button>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Wifi className="h-4 w-4 text-green-500" />
                <span>Connected - Your profile information will be pre-filled</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not authenticated - show welcome screen
  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <Alert variant="destructive" className="max-w-2xl mx-auto mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Find Your Perfect Loft</CardTitle>
          <CardDescription>
            Discover amazing lofts in Algeria. Sign in or create an account to start your reservation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Easy Booking</h3>
              <p className="text-sm text-muted-foreground">Simple and fast reservation process</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Prime Locations</h3>
              <p className="text-sm text-muted-foreground">Lofts in the best areas of Algeria</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Great Experience</h3>
              <p className="text-sm text-muted-foreground">Comfortable stays with excellent service</p>
            </div>
          </div>

          <div className="text-center space-y-4">
            <Button 
              size="lg" 
              onClick={handleStartReservation}
              className="px-8 py-3"
              disabled={!isOnline}
            >
              Get Started
            </Button>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                New to our platform? No worries! You can create an account in just a few steps.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500" />
                    <span>Offline - Please check your connection</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}