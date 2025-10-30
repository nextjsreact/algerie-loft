'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

interface BookingDetails {
  id: string
  booking_reference: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
  special_requests?: string
  created_at: string
  loft: {
    id: string
    name: string
    address: string
    price_per_night: number
  }
  partner?: {
    id: string
    name: string
    business_name?: string
  }
}

interface BookingPageProps {
  params: Promise<{
    id: string
    locale: string
  }>
}

export default function BookingDetailPage({ params }: BookingPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bookings/${resolvedParams.id}`)
      
      if (!response.ok) {
        throw new Error('Réservation non trouvée')
      }

      const bookingData = await response.json()
      setBooking(bookingData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookingDetails()
  }, [resolvedParams.id])

  const calculateNights = () => {
    if (!booking) return 0
    const start = new Date(booking.check_in)
    const end = new Date(booking.check_out)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const handlePayment = async () => {
    if (!booking) return

    setPaymentLoading(true)
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      const response = await fetch(`/api/bookings/${booking.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_method: 'card',
          amount: booking.total_price
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors du paiement')
      }

      // Refresh booking data
      await fetchBookingDetails()
      
      alert('Paiement effectué avec succès ! Votre réservation est confirmée.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du paiement')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!booking || !confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return

    try {
      const response = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'annulation')
      }

      await fetchBookingDetails()
      alert('Réservation annulée avec succès')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de l\'annulation')
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
          <p style={{ color: '#6B7280' }}>Chargement de la réservation...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Réservation non trouvée</h2>
          <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={() => router.push('/fr/client/search')}
            style={{ ...buttonStyle, backgroundColor: '#3B82F6', color: 'white' }}
          >
            Retour à la recherche
          </button>
        </div>
      </div>
    )
  }

  const nights = calculateNights()
  const subtotal = nights * booking.loft.price_per_night
  const serviceFee = Math.round(subtotal * 0.1)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <button
            onClick={() => router.push('/fr/client/search')}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #D1D5DB',
              borderRadius: '0.25rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            ← Retour à la recherche
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            Réservation #{booking.booking_reference}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <span
              style={{
                backgroundColor: getStatusColor(booking.status),
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {getStatusLabel(booking.status)}
            </span>
            <span
              style={{
                backgroundColor: getStatusColor(booking.payment_status),
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Paiement: {getStatusLabel(booking.payment_status)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Main Content */}
          <div>
            {/* Loft Information */}
            <div style={{ ...cardStyle, marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                🏠 {booking.loft.name}
              </h2>
              <p style={{ color: '#6B7280', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                📍 {booking.loft.address}
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Date d'arrivée</div>
                  <div style={{ fontWeight: '500' }}>
                    {new Date(booking.check_in).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Date de départ</div>
                  <div style={{ fontWeight: '500' }}>
                    {new Date(booking.check_out).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Durée</div>
                  <div style={{ fontWeight: '500' }}>{nights} nuit{nights > 1 ? 's' : ''}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Invités</div>
                  <div style={{ fontWeight: '500' }}>{booking.guests} personne{booking.guests > 1 ? 's' : ''}</div>
                </div>
              </div>

              {booking.special_requests && (
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Demandes spéciales</div>
                  <div style={{ padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.25rem' }}>
                    {booking.special_requests}
                  </div>
                </div>
              )}
            </div>

            {/* Check-in Information */}
            {booking.status === 'confirmed' && (
              <div style={{ ...cardStyle, marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                  ℹ️ Informations d'arrivée
                </h3>
                <div style={{ backgroundColor: '#EBF8FF', padding: '1rem', borderRadius: '0.5rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>Instructions d'accès :</p>
                  <p style={{ margin: 0, color: '#1E40AF' }}>
                    Les instructions détaillées vous seront envoyées par email 24h avant votre arrivée.
                    En cas de problème, contactez directement votre hôte.
                  </p>
                </div>
              </div>
            )}

            {/* Contact Host */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                💬 Contacter votre hôte
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  backgroundColor: '#3B82F6', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontSize: '1.25rem',
                  fontWeight: '600'
                }}>
                  {booking.partner?.name?.charAt(0) || 'H'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                    {booking.partner?.business_name || booking.partner?.name || 'Votre hôte'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    Partenaire vérifié ✅
                  </div>
                </div>
                <button
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#3B82F6',
                    color: 'white'
                  }}
                >
                  Envoyer un message
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Payment Summary */}
            <div style={{ ...cardStyle, marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                💰 Résumé du paiement
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>{nights} nuit{nights > 1 ? 's' : ''} × {booking.loft.price_per_night}€</span>
                  <span>{subtotal}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Frais de service</span>
                  <span>{serviceFee}€</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontWeight: '600', 
                  fontSize: '1.125rem',
                  borderTop: '1px solid #E5E7EB',
                  paddingTop: '0.5rem'
                }}>
                  <span>Total</span>
                  <span>{booking.total_price}€</span>
                </div>
              </div>

              {booking.payment_status === 'pending' && (
                <button
                  onClick={handlePayment}
                  disabled={paymentLoading}
                  style={{
                    ...buttonStyle,
                    backgroundColor: paymentLoading ? '#9CA3AF' : '#10B981',
                    color: 'white',
                    width: '100%',
                    cursor: paymentLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {paymentLoading ? '💳 Traitement...' : `💳 Payer ${booking.total_price}€`}
                </button>
              )}

              {booking.payment_status === 'paid' && (
                <div style={{ 
                  backgroundColor: '#F0FDF4', 
                  border: '1px solid #BBF7D0', 
                  borderRadius: '0.5rem', 
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#166534', fontWeight: '500' }}>
                    ✅ Paiement confirmé
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#15803D', marginTop: '0.25rem' }}>
                    Votre réservation est confirmée
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                ⚙️ Actions
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {booking.status === 'pending' && (
                  <button
                    onClick={handleCancelBooking}
                    style={{
                      ...buttonStyle,
                      backgroundColor: '#EF4444',
                      color: 'white',
                      width: '100%'
                    }}
                  >
                    ❌ Annuler la réservation
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#6B7280',
                    color: 'white',
                    width: '100%'
                  }}
                >
                  🖨️ Imprimer la confirmation
                </button>

                <button
                  onClick={() => router.push('/fr/client/search')}
                  style={{
                    ...buttonStyle,
                    backgroundColor: 'transparent',
                    color: '#3B82F6',
                    border: '1px solid #3B82F6',
                    width: '100%'
                  }}
                >
                  🔍 Nouvelle recherche
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}