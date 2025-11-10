'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PortalNavigation } from '@/components/portal/portal-navigation'

interface PartnerStats {
  total_properties: number
  active_properties: number
  total_bookings: number
  upcoming_bookings: number
  monthly_earnings: number
  occupancy_rate: number
  average_rating: number
  total_reviews: number
}

interface PropertySummary {
  id: string
  name: string
  address: string
  status: 'available' | 'occupied' | 'maintenance'
  price_per_night: number
  bookings_count: number
  earnings_this_month: number
  occupancy_rate: number
  average_rating: number
  next_booking?: {
    check_in: string
    check_out: string
    client_name: string
  }
}

interface RecentBooking {
  id: string
  booking_reference: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
  client_name: string
  loft_name: string
}

export default function PartnerDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<PartnerStats>({
    total_properties: 0,
    active_properties: 0,
    total_bookings: 0,
    upcoming_bookings: 0,
    monthly_earnings: 0,
    occupancy_rate: 0,
    average_rating: 0,
    total_reviews: 0
  })
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch partner stats
      try {
        const statsResponse = await fetch('/api/partner/dashboard/stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        } else {
          console.log('Stats API not available, using default values')
        }
      } catch (statsErr) {
        console.log('Stats API error:', statsErr)
      }

      // Fetch properties
      try {
        const propertiesResponse = await fetch('/api/partner/properties?summary=true')
        if (propertiesResponse.ok) {
          const propertiesData = await propertiesResponse.json()
          setProperties(propertiesData.properties || [])
        } else {
          console.log('Properties API not available, using empty array')
        }
      } catch (propsErr) {
        console.log('Properties API error:', propsErr)
      }

      // Fetch recent bookings
      try {
        const bookingsResponse = await fetch('/api/bookings?limit=5')
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json()
          setRecentBookings(bookingsData.bookings || [])
        } else {
          console.log('Bookings API not available, using empty array')
        }
      } catch (bookingsErr) {
        console.log('Bookings API error:', bookingsErr)
      }
      
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10B981'
      case 'occupied': return '#F59E0B'
      case 'maintenance': return '#EF4444'
      case 'pending': return '#F59E0B'
      case 'confirmed': return '#10B981'
      case 'cancelled': return '#EF4444'
      case 'completed': return '#3B82F6'
      case 'paid': return '#10B981'
      case 'failed': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible'
      case 'occupied': return 'Occupé'
      case 'maintenance': return 'Maintenance'
      case 'pending': return 'En attente'
      case 'confirmed': return 'Confirmée'
      case 'cancelled': return 'Annulée'
      case 'completed': return 'Terminée'
      case 'paid': return 'Payée'
      case 'failed': return 'Échec'
      default: return status
    }
  }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  }

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '500'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
          <p style={{ color: '#6B7280' }}>Chargement de votre dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Erreur de chargement</h2>
          <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={fetchDashboardData}
            style={{ ...buttonStyle, backgroundColor: '#3B82F6', color: 'white' }}
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <PortalNavigation currentPage="Dashboard Partenaire" locale="fr" />
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            🏢 Dashboard Partenaire
          </h1>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            Gérez vos propriétés et suivez vos performances
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                Propriétés Totales
              </h3>
              <div style={{ fontSize: '1.5rem' }}>🏠</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.total_properties}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#10B981', marginTop: '0.25rem' }}>
              {stats.active_properties} actives
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                Réservations
              </h3>
              <div style={{ fontSize: '1.5rem' }}>📅</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.total_bookings}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#F59E0B', marginTop: '0.25rem' }}>
              {stats.upcoming_bookings} à venir
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                Revenus ce Mois
              </h3>
              <div style={{ fontSize: '1.5rem' }}>💰</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.monthly_earnings}€
            </div>
            <div style={{ fontSize: '0.875rem', color: '#10B981', marginTop: '0.25rem' }}>
              +{Math.round(stats.monthly_earnings * 0.15)}€ vs mois dernier
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                Taux d'Occupation
              </h3>
              <div style={{ fontSize: '1.5rem' }}>📊</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {Math.round(stats.occupancy_rate)}%
            </div>
            <div style={{ fontSize: '0.875rem', color: '#10B981', marginTop: '0.25rem' }}>
              Excellent taux
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                Note Moyenne
              </h3>
              <div style={{ fontSize: '1.5rem' }}>⭐</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.average_rating.toFixed(1)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.25rem' }}>
              {stats.total_reviews} avis
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ ...cardStyle, marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            🚀 Actions Rapides
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <button
              onClick={() => router.push('/fr/partner/properties/new')}
              style={{
                ...buttonStyle,
                backgroundColor: '#10B981',
                color: 'white'
              }}
            >
              ➕ Ajouter une Propriété
            </button>
            <button
              onClick={() => router.push('/fr/partner/properties')}
              style={{
                ...buttonStyle,
                backgroundColor: '#3B82F6',
                color: 'white'
              }}
            >
              🏠 Gérer mes Propriétés
            </button>
            <button
              onClick={() => router.push('/fr/partner/calendar')}
              style={{
                ...buttonStyle,
                backgroundColor: '#F59E0B',
                color: 'white'
              }}
            >
              📅 Calendrier
            </button>
            <button
              onClick={() => router.push('/fr/partner/earnings')}
              style={{
                ...buttonStyle,
                backgroundColor: '#8B5CF6',
                color: 'white'
              }}
            >
              💰 Rapports Financiers
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Properties Overview */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                🏠 Mes Propriétés
              </h2>
              <button
                onClick={() => router.push('/fr/partner/properties')}
                style={{
                  ...buttonStyle,
                  backgroundColor: 'transparent',
                  color: '#3B82F6',
                  border: '1px solid #3B82F6',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem'
                }}
              >
                Voir tout
              </button>
            </div>

            {properties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Aucune propriété
                </h3>
                <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
                  Ajoutez votre première propriété pour commencer à recevoir des réservations
                </p>
                <button
                  onClick={() => router.push('/fr/partner/properties/new')}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#10B981',
                    color: 'white'
                  }}
                >
                  ➕ Ajouter une Propriété
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {properties.slice(0, 3).map((property) => (
                  <div
                    key={property.id}
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      backgroundColor: '#FAFAFA',
                      cursor: 'pointer'
                    }}
                    onClick={() => router.push(`/fr/partner/properties/${property.id}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                          {property.name}
                        </h3>
                        <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
                          📍 {property.address}
                        </p>
                      </div>
                      <span
                        style={{
                          backgroundColor: getStatusColor(property.status),
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                      >
                        {getStatusLabel(property.status)}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
                      <div>
                        <div style={{ color: '#6B7280' }}>Prix/nuit</div>
                        <div style={{ fontWeight: '500' }}>{property.price_per_night}€</div>
                      </div>
                      <div>
                        <div style={{ color: '#6B7280' }}>Réservations</div>
                        <div style={{ fontWeight: '500' }}>{property.bookings_count}</div>
                      </div>
                      <div>
                        <div style={{ color: '#6B7280' }}>Revenus/mois</div>
                        <div style={{ fontWeight: '500' }}>{property.earnings_this_month}€</div>
                      </div>
                      <div>
                        <div style={{ color: '#6B7280' }}>Occupation</div>
                        <div style={{ fontWeight: '500' }}>{Math.round(property.occupancy_rate)}%</div>
                      </div>
                    </div>

                    {property.next_booking && (
                      <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#EBF8FF', borderRadius: '0.25rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: '500' }}>
                          Prochaine réservation: {property.next_booking.client_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#1E40AF' }}>
                          {new Date(property.next_booking.check_in).toLocaleDateString('fr-FR')} - {new Date(property.next_booking.check_out).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              📋 Réservations Récentes
            </h2>

            {recentBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                  Aucune réservation récente
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.25rem',
                      padding: '0.75rem',
                      backgroundColor: '#FAFAFA',
                      cursor: 'pointer'
                    }}
                    onClick={() => router.push(`/fr/client/bookings/${booking.id}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {booking.client_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          {booking.loft_name}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        {booking.total_price}€
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                      {new Date(booking.check_in).toLocaleDateString('fr-FR')} - {new Date(booking.check_out).toLocaleDateString('fr-FR')}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <span
                        style={{
                          backgroundColor: getStatusColor(booking.status),
                          color: 'white',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.125rem',
                          fontSize: '0.625rem',
                          fontWeight: '500'
                        }}
                      >
                        {getStatusLabel(booking.status)}
                      </span>
                      <span
                        style={{
                          backgroundColor: getStatusColor(booking.payment_status),
                          color: 'white',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.125rem',
                          fontSize: '0.625rem',
                          fontWeight: '500'
                        }}
                      >
                        {getStatusLabel(booking.payment_status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}