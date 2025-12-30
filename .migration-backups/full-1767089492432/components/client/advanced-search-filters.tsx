'use client'

import { useState, useEffect } from 'react'

interface SearchFilters {
  dates: { checkIn: string; checkOut: string }
  location: string
  priceRange: { min: number; max: number }
  amenities: string[]
  guests: number
  propertyType: string[]
  instantBook: boolean
  rating: number
  accessibility: boolean
  petFriendly: boolean
  workFriendly: boolean
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onSearch: () => void
  loading?: boolean
}

export function AdvancedSearchFilters({ 
  filters, 
  onFiltersChange, 
  onSearch, 
  loading = false 
}: AdvancedSearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [priceHistogram, setPriceHistogram] = useState<number[]>([])

  const amenitiesList = [
    { id: 'wifi', label: 'WiFi gratuit', icon: '📶' },
    { id: 'kitchen', label: 'Cuisine équipée', icon: '🍳' },
    { id: 'parking', label: 'Parking', icon: '🚗' },
    { id: 'pool', label: 'Piscine', icon: '🏊' },
    { id: 'gym', label: 'Salle de sport', icon: '💪' },
    { id: 'balcony', label: 'Balcon/Terrasse', icon: '🌿' },
    { id: 'ac', label: 'Climatisation', icon: '❄️' },
    { id: 'heating', label: 'Chauffage', icon: '🔥' },
    { id: 'washer', label: 'Lave-linge', icon: '👕' },
    { id: 'tv', label: 'Télévision', icon: '📺' },
    { id: 'workspace', label: 'Espace de travail', icon: '💻' },
    { id: 'elevator', label: 'Ascenseur', icon: '🛗' }
  ]

  const propertyTypes = [
    { id: 'apartment', label: 'Appartement', icon: '🏠' },
    { id: 'loft', label: 'Loft', icon: '🏢' },
    { id: 'studio', label: 'Studio', icon: '🏡' },
    { id: 'house', label: 'Maison', icon: '🏘️' },
    { id: 'penthouse', label: 'Penthouse', icon: '🏙️' }
  ]

  useEffect(() => {
    // Simulate price histogram data
    setPriceHistogram([5, 12, 25, 35, 28, 18, 8, 3])
  }, [])

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const toggleAmenity = (amenityId: string) => {
    const newAmenities = filters.amenities.includes(amenityId)
      ? filters.amenities.filter(id => id !== amenityId)
      : [...filters.amenities, amenityId]
    
    handleFilterChange('amenities', newAmenities)
  }

  const togglePropertyType = (typeId: string) => {
    const newTypes = filters.propertyType.includes(typeId)
      ? filters.propertyType.filter(id => id !== typeId)
      : [...filters.propertyType, typeId]
    
    handleFilterChange('propertyType', newTypes)
  }

  const clearAllFilters = () => {
    onFiltersChange({
      dates: { checkIn: '', checkOut: '' },
      location: '',
      priceRange: { min: 0, max: 500 },
      amenities: [],
      guests: 1,
      propertyType: [],
      instantBook: false,
      rating: 0,
      accessibility: false,
      petFriendly: false,
      workFriendly: false
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.location) count++
    if (filters.amenities.length > 0) count++
    if (filters.propertyType.length > 0) count++
    if (filters.instantBook) count++
    if (filters.rating > 0) count++
    if (filters.accessibility) count++
    if (filters.petFriendly) count++
    if (filters.workFriendly) count++
    return count
  }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    transition: 'border-color 0.2s'
  }

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s'
  }

  return (
    <div style={cardStyle}>
      {/* Main Search Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
            📍 Destination
          </label>
          <input
            type="text"
            placeholder="Où souhaitez-vous aller ?"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
            📅 Arrivée
          </label>
          <input
            type="date"
            value={filters.dates.checkIn}
            onChange={(e) => handleFilterChange('dates', { ...filters.dates, checkIn: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
            📅 Départ
          </label>
          <input
            type="date"
            value={filters.dates.checkOut}
            onChange={(e) => handleFilterChange('dates', { ...filters.dates, checkOut: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
            👥 Invités
          </label>
          <select
            value={filters.guests}
            onChange={(e) => handleFilterChange('guests', parseInt(e.target.value))}
            style={inputStyle}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <option key={num} value={num}>
                {num} invité{num > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Button and Advanced Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAdvanced ? '1.5rem' : '0' }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            ...buttonStyle,
            backgroundColor: 'transparent',
            color: '#3B82F6',
            border: '1px solid #3B82F6'
          }}
        >
          {showAdvanced ? '🔼 Masquer les filtres' : '🔽 Filtres avancés'} 
          {getActiveFiltersCount() > 0 && ` (${getActiveFiltersCount()})`}
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {getActiveFiltersCount() > 0 && (
            <button
              onClick={clearAllFilters}
              style={{
                ...buttonStyle,
                backgroundColor: 'transparent',
                color: '#6B7280',
                border: '1px solid #D1D5DB'
              }}
            >
              🗑️ Effacer
            </button>
          )}
          
          <button
            onClick={onSearch}
            disabled={loading}
            style={{
              ...buttonStyle,
              backgroundColor: loading ? '#9CA3AF' : '#3B82F6',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '🔄 Recherche...' : '🔍 Rechercher'}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' }}>
          {/* Price Range with Histogram */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
              💰 Gamme de Prix ({filters.priceRange.min}€ - {filters.priceRange.max}€)
            </label>
            
            {/* Price Histogram */}
            <div style={{ display: 'flex', alignItems: 'end', gap: '2px', height: '60px', marginBottom: '1rem', backgroundColor: '#F9FAFB', padding: '0.5rem', borderRadius: '0.5rem' }}>
              {priceHistogram.map((height, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    height: `${height * 2}px`,
                    backgroundColor: '#3B82F6',
                    borderRadius: '2px 2px 0 0',
                    opacity: 0.7
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', color: '#6B7280' }}>Prix minimum</label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={filters.priceRange.min}
                  onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, min: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', color: '#6B7280' }}>Prix maximum</label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={filters.priceRange.max}
                  onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, max: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Property Types */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
              🏠 Type de Logement
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
              {propertyTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => togglePropertyType(type.id)}
                  style={{
                    padding: '0.75rem',
                    border: filters.propertyType.includes(type.id) ? '2px solid #3B82F6' : '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    backgroundColor: filters.propertyType.includes(type.id) ? '#EBF8FF' : 'white',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{type.icon}</div>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
              ✨ Équipements
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {amenitiesList.map((amenity) => (
                <label
                  key={amenity.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    border: filters.amenities.includes(amenity.id) ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    backgroundColor: filters.amenities.includes(amenity.id) ? '#EBF8FF' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(amenity.id)}
                    onChange={() => toggleAmenity(amenity.id)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '1.25rem' }}>{amenity.icon}</span>
                  <span style={{ fontSize: '0.875rem' }}>{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
              ⭐ Note Minimum
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[0, 3, 4, 4.5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleFilterChange('rating', rating)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: filters.rating === rating ? '2px solid #3B82F6' : '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    backgroundColor: filters.rating === rating ? '#EBF8FF' : 'white',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {rating === 0 ? 'Toutes' : `${rating}+ ⭐`}
                </button>
              ))}
            </div>
          </div>

          {/* Special Features */}
          <div>
            <label style={{ display: 'block', marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
              🎯 Caractéristiques Spéciales
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.instantBook}
                  onChange={(e) => handleFilterChange('instantBook', e.target.checked)}
                />
                <span>⚡ Réservation instantanée</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.accessibility}
                  onChange={(e) => handleFilterChange('accessibility', e.target.checked)}
                />
                <span>♿ Accessible PMR</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.petFriendly}
                  onChange={(e) => handleFilterChange('petFriendly', e.target.checked)}
                />
                <span>🐕 Animaux acceptés</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.workFriendly}
                  onChange={(e) => handleFilterChange('workFriendly', e.target.checked)}
                />
                <span>💻 Télétravail friendly</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}