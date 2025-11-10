'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Booking {
  id: string
  booking_reference: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
  loft: {
    id: string
    name: string
    address: string
    price_per_night: number
    images?: string[]
  }
}

interface DashboardData {
  userName: string
  userAvatar?: string
  bookings: Booking[]
  stats: {
    totalTrips: number
    points: number
    favorites: number
    rating: number
  }
  upcomingBookings: Booking[]
  pastBookings: Booking[]
}

export function useDashboardData() {
  const router = useRouter()
  const supabase = createClient()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Get user session
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/fr/login')
          return
        }

        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        const userName = profile?.full_name?.split(' ')[0] || 'Client'
        const userAvatar = profile?.avatar_url

        // Fetch bookings
        const response = await fetch(`/api/bookings?customer_id=${user.id}`)
        let bookings: Booking[] = []
        
        if (response.ok) {
          const result = await response.json()
          bookings = result.reservations || []
        }

        // Calculate stats
        const now = new Date()
        const upcomingBookings = bookings.filter(b => 
          new Date(b.check_in) > now && b.status !== 'cancelled'
        )
        const pastBookings = bookings.filter(b => 
          new Date(b.check_out) < now || b.status === 'completed' || b.status === 'cancelled'
        )
        const completedCount = bookings.filter(b => b.status === 'completed').length

        setData({
          userName,
          userAvatar,
          bookings,
          stats: {
            totalTrips: completedCount,
            points: completedCount * 200,
            favorites: 8, // TODO: Fetch from favorites
            rating: 4.9 // TODO: Calculate from reviews
          },
          upcomingBookings,
          pastBookings
        })
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router])

  return { data, loading, error }
}
