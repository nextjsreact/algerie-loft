'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ClientLoftView } from '@/lib/types'

interface LoftDetailPageProps {
  params: Promise<{
    id: string
    locale: string
  }>
}

export default function LoftDetailPage({ params }: LoftDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loft, setLoft] = useState<ClientLoftView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Booking form state
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || '')
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || '')
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 1)
  const [specialRequests, setSpecialRequests] = useState('')
  
  // Customer information state
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const fetchLoftDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/lofts/${resolvedParams.id}`)
      
      if (!response.ok) {
        throw new Error('Loft non trouvé')
      }

      const loftData = await response.json()
      console.log('Loft data received:', loftData)
      
      if (loftData.success && loftData.loft) {
        setLoft(loftData.loft)
      } else {
        throw new Error(loftData.error || 'Données du loft invalides')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoftDetails()
  }, [resolvedParams.id])

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const calculateTotal = () => {
    if (!loft || !loft.price_per_night) return 0
    const nights = calculateNights()
    const subtotal = nights * loft.price_per_night
    const serviceFee = Math.round(subtotal * 0.1) // 10% service fee
    return subtotal + serviceFee
  }

  const handleBooking = async () => {
    console.log('handleBooking called, loft state:', loft)
    
    // Enhanced validation with detailed logging
    if (!loft) {
      console.error('Booking failed: loft is null or undefined')
      alert('Erreur: Informations du loft non disponibles')
      return
    }
    
    if (!loft.id) {
      console.error('Booking failed: loft.id is missing', loft)
      alert('Erreur: ID du loft manquant')
      return
    }
    
    if (!checkIn || !checkOut) {
      console.error('Booking failed: dates missing', { checkIn, checkOut })
      alert('Veuillez sélectionner les dates d\'arrivée et de départ')
      return
    }
    

    
    if (!customerName || !customerEmail) {
      console.error('Booking failed: customer info missing', { customerName, customerEmail })
      alert('Veuillez remplir vos informations personnelles (nom et email)')
      return
    }

    const bookingData = {
      loft_id: loft.id,
      check_in_date: checkIn,
      check_out_date: checkOut,
      guest_count: guests,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      special_requests: specialRequests,
      total_amount: calculateTotal()
    }

    try {
      console.log('Sending booking request:', bookingData)
      
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Booking API error:', errorData)
        throw new Error(errorData.error || 'Erreur lors de la réservation')
      }

      const result = await response.json()
      console.log('Booking result:', result)
      
      // Handle different response structures safely
      const bookingId = result?.booking?.id || result?.id || result?.reservation?.id
      console.log('Extracted booking ID:', bookingId)
      
      if (bookingId) {
        console.log('Booking created successfully:', bookingId)
        alert(`🎉 Réservation créée avec succès !\n\nNuméro de réservation: ${bookingId}\n\nVous recevrez un email de confirmation à ${customerEmail}`)
        
        // Reset form
        setCustomerName('')
        setCustomerEmail('')
        setCustomerPhone('')
        setSpecialRequests('')
        setCheckIn('')
        setCheckOut('')
        setGuests(1)
      } else {
        // Fallback: show success message and redirect to search
        console.log('No booking ID found, showing success message')
        alert(`Réservation créée avec succès! Référence: ${result?.confirmation_code || 'N/A'}`)
        router.push('/fr/client/search')
      }
    } catch (err) {
      console.error('Booking error:', err)
      alert(err instanceof Error ? err.message : 'Erreur lors de la réservation')
    }
  }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.25rem',
    fontSize: '0.875rem'
  }

  const buttonStyle = {
    backgroundColor: '#3B82F6',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '500',
    width: '100%'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
          <p style={{ color: '#6B7280' }}>Chargement du loft...</p>
        </div>
      </div>
    )
  }

  if (error || !loft) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Loft non trouvé</h2>
          <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
            {error || 'Les informations du loft ne sont pas disponibles'}
          </p>
          <button
            onClick={() => router.push('/fr/client/search')}
            style={{ ...buttonStyle, width: 'auto' }}
          >
            Retour à la recherche
          </button>
        </div>
      </div>
    )
  }

  // Additional safety check for loft.id
  if (!loft.id) {
    console.error('Loft loaded but missing ID:', loft)
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Erreur de données</h2>
          <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
            Les données du loft sont incomplètes
          </p>
          <button
            onClick={() => router.push('/fr/client/search')}
            style={{ ...buttonStyle, width: 'auto' }}
          >
            Retour à la recherche
          </button>
        </div>
      </div>
    )
  }

  // Calculs sécurisés avec vérifications
  const nights = calculateNights()
  const pricePerNight = loft?.price_per_night || 0
  const subtotal = nights * pricePerNight
  const serviceFee = Math.round(subtotal * 0.1)
  const total = subtotal + serviceFee
  
  console.log('Render calculations:', { nights, pricePerNight, subtotal, total, loftExists: !!loft, loftId: loft?.id })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <button
            onClick={() => router.back()}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #D1D5DB',
              borderRadius: '0.25rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            ← Retour
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            {loft?.name || 'Loft'}
          </h1>
          <p style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0.5rem 0 0 0' }}>
            📍 {loft?.address || 'Adresse non disponible'}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Main Content */}
          <div>
            {/* Image Gallery */}
            <div style={{ 
              height: '400px', 
              backgroundColor: '#F3F4F6', 
              borderRadius: '0.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '6rem',
              marginBottom: '2rem'
            }}>
              🏠
            </div>

            {/* Loft Info */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                    {loft?.name || 'Loft'}
                  </h2>
                  {(loft?.average_rating || 0) > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#F59E0B' }}>⭐</span>
                      <span style={{ fontWeight: '500' }}>{loft?.average_rating?.toFixed(1)}</span>
                      <span style={{ color: '#6B7280' }}>({loft?.review_count || 0} avis)</span>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{loft?.price_per_night || 0} DZD</div>
                  <div style={{ color: '#6B7280' }}>par nuit</div>
                </div>
              </div>

              {loft?.description && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Description</h3>
                  <p style={{ color: '#374151', lineHeight: '1.6' }}>{loft.description}</p>
                </div>
              )}

              {loft?.amenities && loft.amenities.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Équipements</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    {(loft?.amenities || []).map((amenity, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#10B981', borderRadius: '50%' }} />
                        <span style={{ fontSize: '0.875rem' }}>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Partner Info */}
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Votre hôte</h3>
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
                    {loft?.partner?.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                      {loft?.partner?.business_name || loft?.partner?.name || 'Propriétaire'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                      Partenaire vérifié ✅
                    </div>
                  </div>
                  <button
                    style={{
                      marginLeft: 'auto',
                      backgroundColor: 'transparent',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.25rem',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer'
                    }}
                  >
                    💬 Contacter
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div>
            <div style={{ ...cardStyle, position: 'sticky', top: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                Réserver ce loft
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Arrivée
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Départ
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Nombre d'invités
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    style={inputStyle}
                  />
                </div>

                {/* Customer Information */}
                <div style={{ marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#DC2626' }}>
                    ⚠️ Vos informations (obligatoire)
                  </h4>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Votre nom complet"
                      style={{
                        ...inputStyle,
                        borderColor: customerName ? '#10B981' : '#EF4444'
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="votre@email.com"
                      style={{
                        ...inputStyle,
                        borderColor: customerEmail ? '#10B981' : '#EF4444'
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Téléphone (optionnel)
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+213 XXX XXX XXX"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Demandes spéciales (optionnel)
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Avez-vous des demandes particulières ?"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>

              {checkIn && checkOut && nights > 0 && loft && (
                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>{nights} nuit{nights > 1 ? 's' : ''} × {loft?.price_per_night || 0} DZD</span>
                    <span>{subtotal} DZD</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Frais de service</span>
                    <span>{serviceFee} DZD</span>
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
                    <span>{total} DZD</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={!checkIn || !checkOut || nights <= 0 || !loft}
                style={{
                  ...buttonStyle,
                  backgroundColor: (!checkIn || !checkOut || nights <= 0 || !loft) ? '#9CA3AF' : '#3B82F6',
                  cursor: (!checkIn || !checkOut || nights <= 0 || !loft) ? 'not-allowed' : 'pointer'
                }}
              >
                {(!checkIn || !checkOut) ? 'Sélectionnez vos dates' : 
                 nights <= 0 ? 'Dates invalides' : 
                 !loft ? 'Chargement...' :
                 `Réserver pour ${total} DZD`}
              </button>

              <p style={{ fontSize: '0.75rem', color: '#6B7280', textAlign: 'center', margin: '0.5rem 0 0 0' }}>
                Vous ne serez pas débité maintenant
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}