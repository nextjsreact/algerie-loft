'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface BookingSummary {
  id: string
  booking_reference: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
  created_at: string
  loft: {
    id: string
    name: string
    address: string
    price_per_night: number
  }
}

interface DashboardStats {
  total_bookings: number
  upcoming_bookings: number
  completed_bookings: number
  total_spent: number
}

export default function ClientDashboardPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingSummary[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    total_bookings: 0,
    upcoming_bookings: 0,
    completed_bookings: 0,
    total_spent: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming')

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch bookings
      const bookingsResponse = await fetch('/api/bookings?limit=50')
      if (!bookingsResponse.ok) {
        throw new Error('Erreur lors du chargement des réservations')
      }
      
      const bookingsData = await bookingsResponse.json()
      setBookings(bookingsData.bookings || [])
      
      // Calculate stats
      const now = new Date()
      const totalBookings = bookingsData.bookings?.length || 0
      const upcomingBookings = bookingsData.bookings?.filter((b: BookingSummary) => 
        new Date(b.check_in) > now && b.status !== 'cancelled'
      ).length || 0
      const completedBookings = bookingsData.bookings?.filter((b: BookingSummary) => 
        b.status === 'completed'
      ).length || 0
      const totalSpent = bookingsData.bookings?.reduce((sum: number, b: BookingSummary) => 
        b.payment_status === 'paid' ? sum + b.total_price : sum, 0
      ) || 0

      setStats({
        total_bookings: totalBookings,
        upcoming_bookings: upcomingBookings,
        completed_bookings: completedBookings,
        total_spent: totalSpent
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const getFilteredBookings = () => {
    const now = new Date()
    
    switch (activeTab) {
      case 'upcoming':
        return bookings.filter(booking => 
          new Date(booking.check_in) > now && booking.status !== 'cancelled'
        )
      case 'past':
        return bookings.filter(booking => 
          new Date(booking.check_out) < now || booking.status === 'completed' || booking.status === 'cancelled'
        )
      case 'all':
      default:
        return bookings
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B'
      case 'confirmed': return '#10B981'
      case 'cancelled': return '#EF4444'
      case 'completed': return '#3B82F6'
      case 'paid': return '#10B981'
      case 'failed': return '#EF4444'
      case 'refunded': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'confirmed': return 'Confirmée'
      case 'cancelled': return 'Annulée'
      case 'completed': return 'Terminée'
      case 'paid': return 'Payée'
      case 'failed': return 'Échec'
      case 'refunded': return 'Remboursée'
      default: return status
    }
  }

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  }

  const buttonStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '0.25rem',
    border: 'none',
    fontSize: '0.875rem',
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

  const filteredBookings = getFilteredBookings()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            🏠 Mon Dashboard Client
          </h1>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            Gérez vos réservations et découvrez de nouveaux lofts
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                Total Réservations
              </h3>
              <div style={{ fontSize: '1.5rem' }}>📊</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.total_bookings}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                Séjours à Venir
              </h3>
              <div style={{ fontSize: '1.5rem' }}>🗓️</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.upcoming_bookings}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                Séjours Terminés
              </h3>
              <div style={{ fontSize: '1.5rem' }}>✅</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.completed_bookings}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                Total Dépensé
              </h3>
              <div style={{ fontSize: '1.5rem' }}>💰</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.total_spent}€
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
              onClick={() => router.push('/fr/client/search')}
              style={{
                ...buttonStyle,
                backgroundColor: '#3B82F6',
                color: 'white',
                padding: '0.75rem 1.5rem'
              }}
            >
              🔍 Rechercher un Loft
            </button>
            <button
              onClick={() => router.push('/fr/client/profile')}
              style={{
                ...buttonStyle,
                backgroundColor: '#6B7280',
                color: 'white',
                padding: '0.75rem 1.5rem'
              }}
            >
              👤 Mon Profil
            </button>
            <button
              onClick={() => router.push('/fr/client/favorites')}
              style={{
                ...buttonStyle,
                backgroundColor: '#EF4444',
                color: 'white',
                padding: '0.75rem 1.5rem'
              }}
            >
              ❤️ Mes Favoris
            </button>
          </div>
        </div>

        {/* Bookings Section */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              📋 Mes Réservations
            </h2>
            <button
              onClick={fetchDashboardData}
              style={{
                ...buttonStyle,
                backgroundColor: 'transparent',
                color: '#3B82F6',
                border: '1px solid #3B82F6'
              }}
            >
              🔄 Actualiser
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
            {[
              { key: 'upcoming', label: 'À venir', count: stats.upcoming_bookings },
              { key: 'past', label: 'Passées', count: stats.completed_bookings },
              { key: 'all', label: 'Toutes', count: stats.total_bookings }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  ...buttonStyle,
                  backgroundColor: activeTab === tab.key ? '#3B82F6' : 'transparent',
                  color: activeTab === tab.key ? 'white' : '#6B7280',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid #3B82F6' : '2px solid transparent',
                  borderRadius: '0'
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {activeTab === 'upcoming' ? '🗓️' : activeTab === 'past' ? '📚' : '📋'}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {activeTab === 'upcoming' ? 'Aucun séjour à venir' : 
                 activeTab === 'past' ? 'Aucun séjour passé' : 
                 'Aucune réservation'}
              </h3>
              <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
                {activeTab === 'upcoming' ? 'Réservez votre prochain séjour dès maintenant !' : 
                 activeTab === 'past' ? 'Vos séjours passés apparaîtront ici' : 
                 'Commencez par rechercher un loft'}
              </p>
              {activeTab === 'upcoming' && (
                <button
                  onClick={() => router.push('/fr/client/search')}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    padding: '0.75rem 1.5rem'
                  }}
                >
                  🔍 Rechercher un Loft
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredBookings.map((booking) => {
                const nights = calculateNights(booking.check_in, booking.check_out)
                const isUpcoming = new Date(booking.check_in) > new Date()
                
                return (
                  <div
                    key={booking.id}
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      backgroundColor: '#FAFAFA',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => router.push(`/fr/client/bookings/${booking.id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F3F4F6'
                      e.currentTarget.style.borderColor = '#3B82F6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FAFAFA'
                      e.currentTarget.style.borderColor = '#E5E7EB'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                          {booking.loft.name}
                        </h3>
                        <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          📍 {booking.loft.address}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          {booking.total_price}€
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          #{booking.booking_reference}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Arrivée</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {new Date(booking.check_in).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Départ</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {new Date(booking.check_out).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Durée</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {nights} nuit{nights > 1 ? 's' : ''}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Invités</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {booking.guests} personne{booking.guests > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span
                          style={{
                            backgroundColor: getStatusColor(booking.status),
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}
                        >
                          {getStatusLabel(booking.status)}
                        </span>
                        <span
                          style={{
                            backgroundColor: getStatusColor(booking.payment_status),
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}
                        >
                          {getStatusLabel(booking.payment_status)}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isUpcoming && booking.status === 'confirmed' && (
                          <span style={{ fontSize: '0.875rem', color: '#10B981', fontWeight: '500' }}>
                            ✈️ Séjour à venir
                          </span>
                        )}
                        <span style={{ fontSize: '0.875rem', color: '#3B82F6' }}>
                          Voir détails →
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}