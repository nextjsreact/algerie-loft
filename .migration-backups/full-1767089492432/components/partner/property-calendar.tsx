'use client'

import { useState } from 'react'

interface Property {
  id: string
  name: string
}

interface PropertyCalendarProps {
  property: Property
}

export function PropertyCalendar({ property }: PropertyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<string[]>([])

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return days
  }

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const isDateSelected = (day: number) => {
    if (!day) return false
    const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return selectedDates.includes(dateStr)
  }

  const toggleDate = (day: number) => {
    if (!day) return
    const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    )
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

  return (
    <div>
      {/* Calendar Header */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
            📅 Calendrier de Disponibilité
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              style={{
                ...buttonStyle,
                backgroundColor: '#6B7280',
                color: 'white',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem'
              }}
            >
              Bloquer Sélection
            </button>
            <button
              style={{
                ...buttonStyle,
                backgroundColor: '#10B981',
                color: 'white',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem'
              }}
            >
              Débloquer Sélection
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '1rem' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#E5E7EB', borderRadius: '0.5rem', overflow: 'hidden' }}>
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
          {days.map((day, index) => (
            <div
              key={index}
              onClick={() => toggleDate(day)}
              style={{
                backgroundColor: day ? (isDateSelected(day) ? '#FEE2E2' : '#FFFFFF') : '#F9FAFB',
                padding: '0.75rem',
                textAlign: 'center',
                fontSize: '0.875rem',
                cursor: day ? 'pointer' : 'default',
                minHeight: '3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: day ? (isDateSelected(day) ? '#DC2626' : '#374151') : '#9CA3AF',
                fontWeight: isDateSelected(day) ? '600' : 'normal'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6B7280' }}>
          <p>💡 Cliquez sur les dates pour les bloquer/débloquer. Les dates en rouge sont bloquées.</p>
          <p>Sélectionnez plusieurs dates puis utilisez les boutons pour les gérer en lot.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          ⚡ Actions Rapides
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: '#F59E0B',
              color: 'white'
            }}
          >
            🚫 Bloquer Week-end
          </button>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: '#8B5CF6',
              color: 'white'
            }}
          >
            🎄 Bloquer Vacances
          </button>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: '#10B981',
              color: 'white'
            }}
          >
            ✅ Débloquer Tout
          </button>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: '#3B82F6',
              color: 'white'
            }}
          >
            💰 Tarifs Spéciaux
          </button>
        </div>
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '1rem', height: '1rem', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '0.25rem' }} />
            <span style={{ color: '#166534' }}>Disponible</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '1rem', height: '1rem', backgroundColor: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '0.25rem' }} />
            <span style={{ color: '#166534' }}>Bloqué</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '1rem', height: '1rem', backgroundColor: '#DBEAFE', border: '1px solid #93C5FD', borderRadius: '0.25rem' }} />
            <span style={{ color: '#166534' }}>Réservé</span>
          </div>
        </div>
      </div>
    </div>
  )
}