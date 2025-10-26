'use client'

import { useState, useEffect } from 'react'

interface Property {
  id: string
  name: string
  address: string
  description?: string
  price_per_night: number
  status: 'available' | 'occupied' | 'maintenance'
  max_guests: number
  bedrooms?: number
  bathrooms?: number
  area_sqm?: number
  amenities: string[]
  is_published: boolean
}

interface PropertyEditFormProps {
  property: Property
  onSave: (updatedProperty: Partial<Property>) => Promise<void>
  onCancel: () => void
}

export function PropertyEditForm({ property, onSave, onCancel }: PropertyEditFormProps) {
  const [formData, setFormData] = useState({
    name: property.name,
    address: property.address,
    description: property.description || '',
    price_per_night: property.price_per_night,
    status: property.status,
    max_guests: property.max_guests,
    bedrooms: property.bedrooms || 1,
    bathrooms: property.bathrooms || 1,
    area_sqm: property.area_sqm || 0,
    amenities: property.amenities,
    is_published: property.is_published
  })
  
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const availableAmenities = [
    'WiFi gratuit',
    'Climatisation',
    'Chauffage',
    'Cuisine équipée',
    'Lave-vaisselle',
    'Lave-linge',
    'Sèche-linge',
    'Télévision',
    'Parking',
    'Balcon/Terrasse',
    'Jardin',
    'Piscine',
    'Jacuzzi',
    'Salle de sport',
    'Ascenseur',
    'Animaux acceptés',
    'Non-fumeur',
    'Accès handicapés',
    'Concierge',
    'Sécurité 24h/24'
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'L\'adresse est obligatoire'
    }

    if (formData.price_per_night <= 0) {
      newErrors.price_per_night = 'Le prix doit être supérieur à 0'
    }

    if (formData.max_guests <= 0) {
      newErrors.max_guests = 'Le nombre d\'invités doit être supérieur à 0'
    }

    if (formData.bedrooms <= 0) {
      newErrors.bedrooms = 'Le nombre de chambres doit être supérieur à 0'
    }

    if (formData.bathrooms <= 0) {
      newErrors.bathrooms = 'Le nombre de salles de bain doit être supérieur à 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)
      await onSave(formData)
    } catch (error) {
      console.error('Error saving property:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    marginBottom: '1.5rem'
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.5rem',
    fontSize: '1rem'
  }

  const errorInputStyle = {
    ...inputStyle,
    borderColor: '#EF4444'
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
    <form onSubmit={handleSubmit}>
      {/* Basic Information */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          📝 Informations de Base
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Nom de la propriété *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={errors.name ? errorInputStyle : inputStyle}
              placeholder="Ex: Loft moderne centre-ville"
            />
            {errors.name && (
              <div style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.name}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Adresse *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              style={errors.address ? errorInputStyle : inputStyle}
              placeholder="Ex: 123 Rue de la Paix, Paris"
            />
            {errors.address && (
              <div style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.address}
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ ...inputStyle, minHeight: '6rem' }}
            placeholder="Décrivez votre propriété, ses atouts et son environnement..."
          />
        </div>
      </div>

      {/* Property Details */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          🏠 Détails de la Propriété
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Prix par nuit (€) *
            </label>
            <input
              type="number"
              min="1"
              value={formData.price_per_night}
              onChange={(e) => setFormData({ ...formData, price_per_night: Number(e.target.value) })}
              style={errors.price_per_night ? errorInputStyle : inputStyle}
            />
            {errors.price_per_night && (
              <div style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.price_per_night}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Nombre d'invités max *
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.max_guests}
              onChange={(e) => setFormData({ ...formData, max_guests: Number(e.target.value) })}
              style={errors.max_guests ? errorInputStyle : inputStyle}
            />
            {errors.max_guests && (
              <div style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.max_guests}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              style={inputStyle}
            >
              <option value="available">Disponible</option>
              <option value="occupied">Occupé</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Chambres *
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
              style={errors.bedrooms ? errorInputStyle : inputStyle}
            />
            {errors.bedrooms && (
              <div style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.bedrooms}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Salles de bain *
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={formData.bathrooms}
              onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
              style={errors.bathrooms ? errorInputStyle : inputStyle}
            />
            {errors.bathrooms && (
              <div style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.bathrooms}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Surface (m²)
            </label>
            <input
              type="number"
              min="0"
              value={formData.area_sqm}
              onChange={(e) => setFormData({ ...formData, area_sqm: Number(e.target.value) })}
              style={inputStyle}
              placeholder="Optionnel"
            />
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          ✨ Équipements et Services
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {availableAmenities.map((amenity) => (
            <label
              key={amenity}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                backgroundColor: formData.amenities.includes(amenity) ? '#EBF8FF' : 'transparent',
                border: formData.amenities.includes(amenity) ? '1px solid #3B82F6' : '1px solid transparent'
              }}
            >
              <input
                type="checkbox"
                checked={formData.amenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                style={{ margin: 0 }}
              />
              <span style={{ fontSize: '0.875rem' }}>{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Publication Status */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          🌐 Publication
        </h3>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.is_published}
            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
          />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '500' }}>
              Publier cette propriété
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              La propriété sera visible par les clients et disponible à la réservation
            </div>
          </div>
        </label>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            ...buttonStyle,
            backgroundColor: 'transparent',
            color: '#6B7280',
            border: '1px solid #D1D5DB'
          }}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{
            ...buttonStyle,
            backgroundColor: saving ? '#9CA3AF' : '#10B981',
            color: 'white',
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
        </button>
      </div>
    </form>
  )
}