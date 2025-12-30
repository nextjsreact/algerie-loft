'use client'

import { useState, useEffect } from 'react'

interface Booking {
  id: string
  client_name: string
  check_in: string
  check_out: string
  guests: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  total_price: number
}

interface PropertyCalendarSimpleProps {
  propertyId: string
}

export function PropertyCalendarSimple({ propertyId }: PropertyCalendarSimpleProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [propertyId, currentMonth])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      
      const response = await fetch(
        `/api/partner/properties/${propertyId}/bookings?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return days
  }

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const getBookingForDate = (day: number): Booking | null => {
    if (!day) return null
    
    const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const date = new Date(dateStr)
    
    return bookings.find(booking => {
      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)
      return date >= checkIn && date < checkOut
    }) || null
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const days = getDaysInMonth(currentMonth)
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    marginBottom: '1.5rem'
  }

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '500'
  }

  const upcomingBookings = bookings
    .filter(booking => new Date(booking.check_in) >= new Date())
    .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())
    .slice(0, 5)

  return (
    <div>
      {/* Calendar */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
            📅 Calendrier des Réservations
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {loading && (
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                🔄 Chargement...
              </div>
            )}
            <button
              onClick={() => window.open(`/fr/partner/properties/${propertyId}/availability`, '_blank')}
              style={{
                ...buttonStyle,
                backgroundColor: '#3B82F6',
                color: 'white',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem'
              }}
            >
              📅 Gestion Avancée
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button
            onClick={() => navigateMonth('prev')}
            style={{
              ...buttonStyle,
              backgroundColor: 'transparent',
              color: '#6B7280',
              border: '1px solid #D1D5DB',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem'
            }}
          >
            ← Précédent
          </button>
          
          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h4>
          
          <button
            onClick={() => navigateMonth('next')}
            style={{
              ...buttonStyle,
              backgroundColor: 'transparent',
              color: '#6B7280',
              border: '1px solid #D1D5DB',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem'
            }}
          >
            Suivant →
          </button>
        </div>

        {/* Calendar Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '1px', 
          backgroundColor: '#E5E7EB', 
          borderRadius: '0.5rem', 
          overflow: 'hidden'
        }}>
          {/* Day Headers */}
          {dayNames.map(dayName => (
            <div
              key={dayName}
              style={{
                backgroundColor: '#F3F4F6',
                padding: '0.75rem',
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#6B7280'
              }}
            >
              {dayName}
            </div>
          ))}
          
          {/* Calendar Days */}
          {days.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#F9FAFB',
                    minHeight: '4rem'
                  }}
                />
              )
            }

            const booking = getBookingForDate(day)
            const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString()

            return (
              <div
                key={index}
                style={{
                  backgroundColor: booking ? getStatusColor(booking.status) + '20' : '#FFFFFF',
                  padding: '0.5rem',
                  minHeight: '4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  border: isToday ? '2px solid #3B82F6' : 'none'
                }}
              >
                <div style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: isToday ? '600' : 'normal',
                  color: isToday ? '#3B82F6' : '#374151',
                  marginBottom: '0.25rem'
                }}>
                  {day}
                </div>
                
                {booking && (
                  <div style={{
                    backgroundColor: getStatusColor(booking.status),
                    color: 'white',
                    padding: '0.25rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.625rem',
                    textAlign: 'center',
                    marginBottom: '0.25rem'
                  }}>
                    {booking.client_name}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          📋 Prochaines Réservations
        </h3>

        {upcomingBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Aucune réservation à venir
            </h4>
            <p style={{ color: '#6B7280' }}>
              Les prochaines réservations apparaîtront ici
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {booking.client_name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                    {new Date(booking.check_in).toLocaleDateString('fr-FR')} - {new Date(booking.check_out).toLocaleDateString('fr-FR')}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    {booking.guests} invité{booking.guests > 1 ? 's' : ''} • {booking.total_price}€
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                  
                  <button
                    onClick={() => window.open(`/fr/partner/bookings/${booking.id}`, '_blank')}
                    style={{
                      ...buttonStyle,
                      backgroundColor: 'transparent',
                      color: '#3B82F6',
                      border: '1px solid #3B82F6',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    👁️ Voir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ 
        backgroundColor: '#F0FDF4', 
        border: '1px solid #BBF7D0', 
        borderRadius: '0.5rem', 
        padding: '1rem'
      }}>
        <h4 style={{ color: '#166534', fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          📋 Légende
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '1rem', height: '1rem', backgroundColor: '#F59E0B', borderRadius: '0.25rem' }} />
            <span style={{ color: '#166534' }}>En attente</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '1rem', height: '1rem', backgroundColor: '#10B981', borderRadius: '0.25rem' }} />
            <span style={{ color: '#166534' }}>Confirmée</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '1rem', height: '1rem', backgroundColor: '#EF4444', borderRadius: '0.25rem' }} />
            <span style={{ color: '#166534' }}>Annulée</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '1rem', height: '1rem', backgroundColor: '#6B7280', borderRadius: '0.25rem' }} />
            <span style={{ color: '#166534' }}>Terminée</span>
          </div>
        </div>
      </div>
    </div>
  )
}