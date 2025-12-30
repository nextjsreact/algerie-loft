'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Booking {
  id: string
  loft_id: string
  client_id: string
  partner_id: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded'
  special_requests?: string
  created_at: string
  loft: {
    name: string
    address: string
  }
  client: {
    full_name: string
    email: string
  }
  partner: {
    full_name: string
    email: string
  }
}

export default function AdminBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/bookings')
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des réservations')
      }

      const data = await response.json()
      setBookings(data.bookings || [])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const getFilteredBookings = () => {
    let filtered = bookings

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(booking => booking.status === filter)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.loft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.partner.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B'
      case 'confirmed': return '#10B981'
      case 'cancelled': return '#EF4444'
      case 'completed': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'confirmed': return 'Confirmée'
      case 'cancelled': return 'Annulée'
      case 'completed': return 'Terminée'
      default: return status
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B'
      case 'paid': return '#10B981'
      case 'refunded': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'paid': return 'Payé'
      case 'refunded': return 'Remboursé'
      default: return status
    }
  }

  const handleBookingAction = async (bookingId: string, action: 'cancel' | 'refund' | 'confirm') => {
    if (!confirm(`Êtes-vous sûr de vouloir ${action === 'cancel' ? 'annuler' : action === 'refund' ? 'rembourser' : 'confirmer'} cette réservation ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'action')
      }

      await fetchBookings()
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de l\'action')
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
    padding: '0.5rem 1rem',
    borderRadius: '0.25rem',
    border: 'none',
    fontSize: '0.875rem',
    cursor: 'pointer',
    fontWeight: '500'
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.25rem',
    fontSize: '0.875rem'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
          <p style={{ color: '#6B7280' }}>Chargement des réservations...</p>
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
            onClick={fetchBookings}
            style={{ ...buttonStyle, backgroundColor: '#3B82F6', color: 'white', padding: '0.75rem 1.5rem' }}
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
          <button
            onClick={() => router.push('/fr/app/dashboard')}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #D1D5DB',
              borderRadius: '0.25rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            ← Retour au dashboard
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            📅 Supervision des Réservations
          </h1>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            Superviser et gérer toutes les réservations de la plateforme
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Filters and Search */}
        <div style={{ ...cardStyle, marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Rechercher
              </label>
              <input
                type="text"
                placeholder="ID, loft, client, partenaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Filtrer par statut
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                style={inputStyle}
              >
                <option value="all">Toutes les réservations</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmées</option>
                <option value="cancelled">Annulées</option>
                <option value="completed">Terminées</option>
              </select>
            </div>

            <button
              onClick={fetchBookings}
              style={{
                ...buttonStyle,
                backgroundColor: '#3B82F6',
                color: 'white',
                padding: '0.75rem 1rem'
              }}
            >
              🔄 Actualiser
            </button>
          </div>
        </div>

        {/* Bookings List */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              Réservations ({filteredBookings.length})
            </h2>
          </div>

          {filteredBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Aucune réservation trouvée
              </h3>
              <p style={{ color: '#6B7280' }}>
                Aucune réservation ne correspond à vos critères de recherche
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                      Réservation
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                      Client
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                      Partenaire
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                      Dates
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                      Montant
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                      Statut
                    </th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {booking.loft.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                            ID: {booking.id.slice(0, 8)}...
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                            {booking.guests} invité{booking.guests > 1 ? 's' : ''}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {booking.client.full_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                            {booking.client.email}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {booking.partner.full_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                            {booking.partner.email}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem' }}>
                        <div>
                          <div>{new Date(booking.check_in).toLocaleDateString('fr-FR')}</div>
                          <div style={{ color: '#6B7280' }}>au</div>
                          <div>{new Date(booking.check_out).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {booking.total_price}€
                        </div>
                        <span
                          style={{
                            backgroundColor: getPaymentStatusColor(booking.payment_status),
                            color: 'white',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}
                        >
                          {getPaymentStatusLabel(booking.payment_status)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
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
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleBookingAction(booking.id, 'confirm')}
                              style={{
                                ...buttonStyle,
                                backgroundColor: '#10B981',
                                color: 'white'
                              }}
                            >
                              ✅ Confirmer
                            </button>
                          )}
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <button
                              onClick={() => handleBookingAction(booking.id, 'cancel')}
                              style={{
                                ...buttonStyle,
                                backgroundColor: '#EF4444',
                                color: 'white'
                              }}
                            >
                              ❌ Annuler
                            </button>
                          )}
                          {booking.payment_status === 'paid' && booking.status === 'cancelled' && (
                            <button
                              onClick={() => handleBookingAction(booking.id, 'refund')}
                              style={{
                                ...buttonStyle,
                                backgroundColor: '#F59E0B',
                                color: 'white'
                              }}
                            >
                              💰 Rembourser
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/fr/app/bookings/${booking.id}`)}
                            style={{
                              ...buttonStyle,
                              backgroundColor: '#3B82F6',
                              color: 'white'
                            }}
                          >
                            👁️ Voir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}