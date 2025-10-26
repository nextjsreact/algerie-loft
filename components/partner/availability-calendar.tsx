'use client'

import { useState, useEffect } from 'react'

interface AvailabilityData {
  date: string
  is_available: boolean
  price_override?: number
  minimum_stay?: number
  booking_id?: string
  booking_status?: 'pending' | 'confirmed' | 'cancelled'
}

interface PricingRule {
  id: string
  name: string
  start_date: string
  end_date: string
  price_multiplier: number
  minimum_stay?: number
  is_active: boolean
}

interface AvailabilityCalendarProps {
  propertyId: string
  basePrice: number
  onAvailabilityChange?: (date: string, data: Partial<AvailabilityData>) => void
}

export function AvailabilityCalendar({ 
  propertyId, 
  basePrice, 
  onAvailabilityChange 
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availabilityData, setAvailabilityData] = useState<Record<string, AvailabilityData>>({})
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<'block' | 'unblock' | 'price'>('block')
  const [bulkPrice, setBulkPrice] = useState<number>(basePrice)
  const [bulkMinStay, setBulkMinStay] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)

  useEffect(() => {
    fetchAvailabilityData()
    fetchPricingRules()
  }, [propertyId, currentMonth])

  const fetchAvailabilityData = async () => {
    try {
      setLoading(true)
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      
      const response = await fetch(
        `/api/partner/properties/${propertyId}/availability?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      )
      
      if (response.ok) {
        const data = await response.json()
        const availabilityMap: Record<string, AvailabilityData> = {}
        
        data.availability?.forEach((item: AvailabilityData) => {
          availabilityMap[item.date] = item
        })
        
        setAvailabilityData(availabilityMap)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPricingRules = async () => {
    try {
      const response = await fetch(`/api/partner/properties/${propertyId}/pricing-rules`)
      if (response.ok) {
        const data = await response.json()
        setPricingRules(data.rules || [])
      }
    } catch (error) {
      console.error('Error fetching pricing rules:', error)
    }
  }

  const updateAvailability = async (date: string, updates: Partial<AvailabilityData>) => {
    try {
      const response = await fetch(`/api/partner/properties/${propertyId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, ...updates })
      })

      if (response.ok) {
        setAvailabilityData(prev => ({
          ...prev,
          [date]: { ...prev[date], date, ...updates }
        }))
        onAvailabilityChange?.(date, updates)
      }
    } catch (error) {
      console.error('Error updating availability:', error)
    }
  }

  const bulkUpdateAvailability = async () => {
    if (selectedDates.length === 0) return

    try {
      setLoading(true)
      const updates = selectedDates.map(date => {
        const update: any = { date }
        
        switch (bulkAction) {
          case 'block':
            update.is_available = false
            break
          case 'unblock':
            update.is_available = true
            break
          case 'price':
            update.price_override = bulkPrice
            update.minimum_stay = bulkMinStay
            break
        }
        
        return update
      })

      const response = await fetch(`/api/partner/properties/${propertyId}/availability/bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })

      if (response.ok) {
        await fetchAvailabilityData()
        setSelectedDates([])
      }
    } catch (error) {
      console.error('Error bulk updating availability:', error)
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

  const getDateData = (day: number): AvailabilityData | null => {
    if (!day) return null
    const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return availabilityData[dateStr] || null
  }

  const getEffectivePrice = (day: number): number => {
    const dateData = getDateData(day)
    if (dateData?.price_override) return dateData.price_override

    const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const date = new Date(dateStr)
    
    // Check pricing rules
    for (const rule of pricingRules) {
      if (!rule.is_active) continue
      const startDate = new Date(rule.start_date)
      const endDate = new Date(rule.end_date)
      
      if (date >= startDate && date <= endDate) {
        return Math.round(basePrice * rule.price_multiplier)
      }
    }
    
    return basePrice
  }

  const getDayStatus = (day: number): 'available' | 'blocked' | 'booked' | 'pending' => {
    const dateData = getDateData(day)
    if (!dateData) return 'available'
    
    if (dateData.booking_id) {
      return dateData.booking_status === 'confirmed' ? 'booked' : 'pending'
    }
    
    return dateData.is_available ? 'available' : 'blocked'
  }

  const getDayColor = (status: string): string => {
    switch (status) {
      case 'available': return '#FFFFFF'
      case 'blocked': return '#FEE2E2'
      case 'booked': return '#DBEAFE'
      case 'pending': return '#FEF3C7'
      default: return '#F9FAFB'
    }
  }

  const getDayTextColor = (status: string): string => {
    switch (status) {
      case 'available': return '#374151'
      case 'blocked': return '#DC2626'
      case 'booked': return '#1D4ED8'
      case 'pending': return '#D97706'
      default: return '#9CA3AF'
    }
  }

  const toggleDateSelection = (day: number) => {
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

  const quickActions = [
    {
      label: 'Bloquer Week-ends',
      action: () => {
        const weekendDates: string[] = []
        const days = getDaysInMonth(currentMonth)
        
        days.forEach((day, index) => {
          if (day) {
            const dayOfWeek = (index) % 7
            if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
              const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day)
              weekendDates.push(dateStr)
            }
          }
        })
        
        setSelectedDates(weekendDates)
        setBulkAction('block')
      }
    },
    {
      label: 'Prix Haute Saison',
      action: () => {
        setBulkPrice(Math.round(basePrice * 1.5))
        setBulkAction('price')
        setShowPricingModal(true)
      }
    },
    {
      label: 'Débloquer Mois',
      action: () => {
        const allDates: string[] = []
        const days = getDaysInMonth(currentMonth)
        
        days.forEach(day => {
          if (day) {
            const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day)
            allDates.push(dateStr)
          }
        })
        
        setSelectedDates(allDates)
        setBulkAction('unblock')
      }
    }
  ]

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

  return (
    <div>
      {/* Calendar Header */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
            📅 Calendrier de Disponibilité et Tarification
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} sélectionnée{selectedDates.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Month Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button
            onClick={() => navigateMonth('prev')}
            disabled={loading}
            style={{
              ...buttonStyle,
              backgroundColor: 'transparent',
              color: '#6B7280',
              border: '1px solid #D1D5DB',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            ← Précédent
          </button>
          
          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h4>
          
          <button
            onClick={() => navigateMonth('next')}
            disabled={loading}
            style={{
              ...buttonStyle,
              backgroundColor: 'transparent',
              color: '#6B7280',
              border: '1px solid #D1D5DB',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer'
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
          overflow: 'hidden',
          opacity: loading ? 0.6 : 1
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

            const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day)
            const status = getDayStatus(day)
            const price = getEffectivePrice(day)
            const dateData = getDateData(day)
            const isSelected = selectedDates.includes(dateStr)
            const isPast = new Date(dateStr) < new Date(new Date().toDateString())

            return (
              <div
                key={index}
                onClick={() => !isPast && toggleDateSelection(day)}
                style={{
                  backgroundColor: isSelected ? '#E0E7FF' : getDayColor(status),
                  padding: '0.5rem',
                  textAlign: 'center',
                  cursor: isPast ? 'not-allowed' : 'pointer',
                  minHeight: '4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isPast ? '#9CA3AF' : getDayTextColor(status),
                  fontWeight: isSelected ? '600' : 'normal',
                  border: isSelected ? '2px solid #3B82F6' : 'none',
                  opacity: isPast ? 0.5 : 1
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                  {day}
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {price}€
                </div>
                {dateData?.minimum_stay && dateData.minimum_stay > 1 && (
                  <div style={{ fontSize: '0.625rem', color: '#8B5CF6' }}>
                    Min {dateData.minimum_stay}j
                  </div>
                )}
                {status === 'booked' && (
                  <div style={{ fontSize: '0.625rem', color: '#1D4ED8' }}>
                    Réservé
                  </div>
                )}
                {status === 'pending' && (
                  <div style={{ fontSize: '0.625rem', color: '#D97706' }}>
                    En attente
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDates.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            ⚡ Actions en Lot ({selectedDates.length} dates)
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Action
              </label>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="block">Bloquer dates</option>
                <option value="unblock">Débloquer dates</option>
                <option value="price">Modifier prix</option>
              </select>
            </div>

            {bulkAction === 'price' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Prix (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Séjour minimum (jours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={bulkMinStay}
                    onChange={(e) => setBulkMinStay(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={bulkUpdateAvailability}
              disabled={loading}
              style={{
                ...buttonStyle,
                backgroundColor: loading ? '#9CA3AF' : '#3B82F6',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Application...' : '✅ Appliquer'}
            </button>
            <button
              onClick={() => setSelectedDates([])}
              style={{
                ...buttonStyle,
                backgroundColor: 'transparent',
                color: '#6B7280',
                border: '1px solid #D1D5DB'
              }}
            >
              ❌ Annuler Sélection
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
          🚀 Actions Rapides
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              style={{
                ...buttonStyle,
                backgroundColor: '#F59E0B',
                color: 'white'
              }}
            >
              {action.label}
            </button>
          ))}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '1rem', height: '1rem', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '0.25rem' }} />
            <span style={{ color: '#166534' }}>En attente</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '1rem', height: '1rem', backgroundColor: '#E0E7FF', border: '2px solid #3B82F6', borderRadius: '0.25rem' }} />
            <span style={{ color: '#166534' }}>Sélectionné</span>
          </div>
        </div>
      </div>
    </div>
  )
}