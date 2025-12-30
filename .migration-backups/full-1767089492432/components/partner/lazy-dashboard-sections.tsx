'use client'

import { lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Lazy-loaded dashboard sections for better performance
 * Components are loaded only when needed
 */

// Lazy load heavy components
export const LazyPropertiesOverview = lazy(() => 
  import('./properties-overview').then(module => ({ 
    default: module.PropertiesOverview 
  }))
)

export const LazyRecentBookingsSection = lazy(() => 
  import('./recent-bookings-section').then(module => ({ 
    default: module.RecentBookingsSection 
  }))
)

/**
 * Loading skeleton for properties section
 */
function PropertiesLoadingSkeleton() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-32 w-48 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Loading skeleton for bookings section
 */
function BookingsLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Wrapper components with Suspense boundaries
 */
export function PropertiesOverviewWithSuspense(props: any) {
  return (
    <Suspense fallback={<PropertiesLoadingSkeleton />}>
      <LazyPropertiesOverview {...props} />
    </Suspense>
  )
}

export function RecentBookingsSectionWithSuspense(props: any) {
  return (
    <Suspense fallback={<BookingsLoadingSkeleton />}>
      <LazyRecentBookingsSection {...props} />
    </Suspense>
  )
}
