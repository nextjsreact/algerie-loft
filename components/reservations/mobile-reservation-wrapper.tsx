"use client"

import { useState, useEffect } from 'react'
import { ReservationPage } from './reservation-page'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Menu, 
  X, 
  ChevronLeft, 
  Home, 
  Search, 
  Calendar, 
  User,
  Phone,
  Mail,
  MapPin,
  Smartphone
} from 'lucide-react'
import type { SearchCriteria } from '@/lib/services/loft'
import type { ReservationRequest } from '@/lib/schemas/booking'

interface MobileReservationWrapperProps {
  initialSearchCriteria?: SearchCriteria
  onReservationComplete?: (reservation: ReservationRequest) => void
}

export function MobileReservationWrapper({ 
  initialSearchCriteria,
  onReservationComplete 
}: MobileReservationWrapperProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  // Detect mobile device and orientation
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
      
      const isLandscape = window.innerWidth > window.innerHeight
      setOrientation(isLandscape ? 'landscape' : 'portrait')
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [])

  // Prevent zoom on input focus (iOS Safari)
  useEffect(() => {
    if (isMobile) {
      const viewport = document.querySelector('meta[name=viewport]')
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        )
      }
    }
  }, [isMobile])

  if (!isMobile) {
    // Desktop version - use regular ReservationPage
    return (
      <ReservationPage
        initialSearchCriteria={initialSearchCriteria}
        onReservationComplete={onReservationComplete}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Loft Reservation</h1>
              <p className="text-xs text-muted-foreground">Find & Book Your Stay</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            <Smartphone className="h-3 w-3 mr-1" />
            Mobile
          </Badge>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="border-t border-gray-200 bg-white">
            <div className="p-4 space-y-3">
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <Home className="h-4 w-4 mr-3" />
                Home
              </Button>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <Search className="h-4 w-4 mr-3" />
                Search Lofts
              </Button>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <Calendar className="h-4 w-4 mr-3" />
                My Reservations
              </Button>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <User className="h-4 w-4 mr-3" />
                Profile
              </Button>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>+213 123 456 789</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                  <Mail className="h-4 w-4" />
                  <span>support@loftalgerie.com</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile-Optimized Content */}
      <div className="pb-20"> {/* Bottom padding for mobile navigation */}
        <MobileReservationPage
          initialSearchCriteria={initialSearchCriteria}
          onReservationComplete={onReservationComplete}
          orientation={orientation}
        />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
            <Home className="h-4 w-4 mb-1" />
            <span className="text-xs">Home</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
            <Search className="h-4 w-4 mb-1" />
            <span className="text-xs">Search</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
            <Calendar className="h-4 w-4 mb-1" />
            <span className="text-xs">Bookings</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
            <User className="h-4 w-4 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Mobile-specific ReservationPage component
function MobileReservationPage({ 
  initialSearchCriteria,
  onReservationComplete,
  orientation 
}: {
  initialSearchCriteria?: SearchCriteria
  onReservationComplete?: (reservation: ReservationRequest) => void
  orientation: 'portrait' | 'landscape'
}) {
  return (
    <div className={`
      ${orientation === 'landscape' ? 'px-2 py-2' : 'px-4 py-4'}
    `}>
      <ReservationPage
        initialSearchCriteria={initialSearchCriteria}
        onReservationComplete={onReservationComplete}
        className="mobile-optimized"
      />
      
      {/* Mobile-specific styles */}
      <style jsx global>{`
        .mobile-optimized {
          /* Override desktop styles for mobile */
        }
        
        .mobile-optimized .container {
          padding-left: 0;
          padding-right: 0;
        }
        
        .mobile-optimized .grid {
          grid-template-columns: 1fr;
        }
        
        .mobile-optimized .md\\:grid-cols-2,
        .mobile-optimized .md\\:grid-cols-3,
        .mobile-optimized .lg\\:grid-cols-3,
        .mobile-optimized .lg\\:grid-cols-4 {
          grid-template-columns: 1fr;
        }
        
        .mobile-optimized .hidden.sm\\:block {
          display: none;
        }
        
        .mobile-optimized input,
        .mobile-optimized textarea,
        .mobile-optimized select {
          font-size: 16px; /* Prevent zoom on iOS */
          padding: 12px;
          min-height: 44px; /* Touch-friendly size */
        }
        
        .mobile-optimized button {
          min-height: 44px; /* Touch-friendly size */
          padding: 12px 16px;
        }
        
        .mobile-optimized .card {
          margin-bottom: 16px;
          border-radius: 12px;
        }
        
        /* Landscape specific adjustments */
        ${orientation === 'landscape' ? `
          .mobile-optimized .space-y-8 {
            gap: 1rem;
          }
          
          .mobile-optimized .py-8 {
            padding-top: 1rem;
            padding-bottom: 1rem;
          }
        ` : ''}
        
        /* Touch-friendly interactions */
        .mobile-optimized .hover\\:shadow-lg:hover {
          transform: scale(1.02);
          transition: transform 0.2s ease;
        }
        
        /* Improved text readability on mobile */
        .mobile-optimized .text-sm {
          font-size: 14px;
          line-height: 1.5;
        }
        
        .mobile-optimized .text-xs {
          font-size: 12px;
          line-height: 1.4;
        }
        
        /* Better spacing for mobile */
        .mobile-optimized .space-y-6 > * + * {
          margin-top: 1.5rem;
        }
        
        .mobile-optimized .space-y-4 > * + * {
          margin-top: 1rem;
        }
        
        /* Mobile-friendly form layouts */
        .mobile-optimized .grid.grid-cols-2 {
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        
        .mobile-optimized .flex.flex-row {
          flex-direction: column;
          align-items: stretch;
        }
        
        /* Sticky elements adjustments */
        .mobile-optimized .sticky {
          position: relative;
        }
        
        /* Image optimizations */
        .mobile-optimized img {
          max-width: 100%;
          height: auto;
          object-fit: cover;
        }
        
        /* Progress bar mobile adjustments */
        .mobile-optimized .progress {
          height: 6px;
        }
        
        /* Modal adjustments for mobile */
        .mobile-optimized .dialog-content {
          margin: 0;
          width: 100vw;
          height: 100vh;
          max-width: none;
          max-height: none;
          border-radius: 0;
        }
      `}</style>
    </div>
  )
}