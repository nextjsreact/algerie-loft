'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, BookOpen, Home } from 'lucide-react'
import { useUserSession } from '@/lib/hooks/use-homepage-data'

interface SeamlessAuthIntegrationProps {
  locale?: string
  onLoginClick?: () => void
  showUserMenu?: boolean
}

export function SeamlessAuthIntegration({ 
  locale = 'fr', 
  onLoginClick,
  showUserMenu = true 
}: SeamlessAuthIntegrationProps) {
  const { session, isLoading, refreshSession } = useUserSession()
  const router = useRouter()

  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick()
    } else {
      router.push(`/${locale}/login`)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await refreshSession()
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleNavigation = (path: string) => {
    router.push(`/${locale}${path}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          onClick={handleLoginClick}
          className="text-sm font-medium"
        >
          Se connecter
        </Button>
        <Button 
          onClick={() => router.push(`/${locale}/register`)}
          className="text-sm font-medium"
        >
          S'inscrire
        </Button>
      </div>
    )
  }

  if (!showUserMenu) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">
          Bonjour, {session.user.full_name || session.user.email}
        </span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${session.user.full_name || session.user.email}`} 
              alt={session.user.full_name || 'User'} 
            />
            <AvatarFallback>
              {session.user.full_name 
                ? session.user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                : session.user.email?.[0]?.toUpperCase() || 'U'
              }
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session.user.full_name || 'Utilisateur'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground capitalize">
              {session.user.role}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Role-based navigation */}
        {session.user.role === 'client' && (
          <>
            <DropdownMenuItem onClick={() => handleNavigation('/reservations')}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Mes réservations</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Mon profil</span>
            </DropdownMenuItem>
          </>
        )}
        
        {session.user.role === 'partner' && (
          <>
            <DropdownMenuItem onClick={() => handleNavigation('/app')}>
              <Home className="mr-2 h-4 w-4" />
              <span>Tableau de bord</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/lofts')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Mes lofts</span>
            </DropdownMenuItem>
          </>
        )}
        
        {['admin', 'manager'].includes(session.user.role) && (
          <DropdownMenuItem onClick={() => handleNavigation('/app')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Administration</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Quick booking integration for authenticated users
export function QuickBookingIntegration({ 
  loftId, 
  checkIn, 
  checkOut, 
  guests,
  locale = 'fr' 
}: {
  loftId: string
  checkIn: string
  checkOut: string
  guests: number
  locale?: string
}) {
  const { session } = useUserSession()
  const router = useRouter()

  const handleQuickBooking = async () => {
    if (!session) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/${locale}/lofts/${loftId}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`)
      router.push(`/${locale}/login?return_to=${returnUrl}`)
      return
    }

    // Proceed with booking for authenticated user
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          loft_id: loftId,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          // Additional booking data would be calculated here
        })
      })

      if (response.ok) {
        const booking = await response.json()
        router.push(`/${locale}/bookings/${booking.booking.id}`)
      } else {
        const error = await response.json()
        console.error('Booking error:', error)
        // Handle booking error (show modal, etc.)
      }
    } catch (error) {
      console.error('Quick booking error:', error)
    }
  }

  return (
    <Button 
      onClick={handleQuickBooking}
      className="w-full"
      size="lg"
    >
      {session ? 'Réserver maintenant' : 'Se connecter pour réserver'}
    </Button>
  )
}