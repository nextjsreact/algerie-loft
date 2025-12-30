'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PropertyEditForm } from '@/components/partner/property-edit-form-complete'
import { PropertyPhotos } from '@/components/partner/property-photos-complete'
import { PropertyCalendarSimple } from '@/components/partner/property-calendar-simple'

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
  images?: string[]
  created_at: string
  updated_at: string
}

interface PropertyPhoto {
  id: string
  url: string
  caption?: string
  is_primary: boolean
  order_index: number
}

interface PropertyDetailPageProps {
  params: {
    id: string
    locale: string
  }
}

export default function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [photos, setPhotos] = useState<PropertyPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'photos' | 'calendar'>('overview')

  const fetchProperty = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/partner/properties/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Propriété non trouvée')
      }

      const propertyData = await response.json()
      setProperty(propertyData.property)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/partner/properties/${params.id}/photos`)
      
      if (response.ok) {
        const data = await response.json()
        setPhotos(data.photos || [])
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
    }
  }

  useEffect(() => {
    fetchProperty()
    fetchPhotos()
  }, [params.id])

  const handlePropertyUpdate = async (updates: Partial<Property>) => {
    try {
      const response = await fetch(`/api/partner/properties/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      await fetchProperty()
      setActiveTab('overview')
      
    } catch (error) {
      console.error('Error updating property:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
          <p style={{ color: '#6B7280' }}>Chargement de la propriété...</p>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Propriété non trouvée</h2>
          <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={() => router.push('/fr/partner/properties')}
            style={{
              backgroundColor: '#3B82F6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Retour aux propriétés
          </button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10B981'
      case 'occupied': return '#F59E0B'
      case 'maintenance': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible'
      case 'occupied': return 'Occupé'
      case 'maintenance': return 'Maintenance'
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <button
            onClick={() => router.push('/fr/partner/properties')}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #D1D5DB',
              borderRadius: '0.25rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            ← Retour aux propriétés
          </button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>
                {property.name}
              </h1>
              <p style={{ color: '#6B7280', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                📍 {property.address}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span
                  style={{
                    backgroundColor: getStatusColor(property.status),
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  {getStatusLabel(property.status)}
                </span>
                {!property.is_published && (
                  <span
                    style={{
                      backgroundColor: '#F59E0B',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    Brouillon
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setActiveTab('edit')}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#3B82F6',
                  color: 'white'
                }}
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => setActiveTab('photos')}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#8B5CF6',
                  color: 'white'
                }}
              >
                📸 Photos
              </button>
              <button
                onClick={() => router.push(`/fr/partner/properties/${params.id}/availability`)}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#F59E0B',
                  color: 'white'
                }}
              >
                📅 Disponibilité & Prix
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #E5E7EB' }}>
          {[
            { key: 'overview', label: 'Vue d\'ensemble', icon: '👁️' },
            { key: 'edit', label: 'Modifier', icon: '✏️' },
            { key: 'photos', label: 'Photos', icon: '📸' },
            { key: 'calendar', label: 'Calendrier', icon: '📅' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: activeTab === tab.key ? '#3B82F6' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#6B7280',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #3B82F6' : '2px solid transparent',
                borderRadius: '0',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <PropertyOverview property={property} photos={photos} />
        )}
        
        {activeTab === 'edit' && (
          <PropertyEditForm 
            property={property} 
            onSave={handlePropertyUpdate}
            onCancel={() => setActiveTab('overview')}
          />
        )}
        
        {activeTab === 'photos' && (
          <PropertyPhotos 
            propertyId={property.id}
            photos={photos}
            onPhotosChange={fetchPhotos}
          />
        )}
        
        {activeTab === 'calendar' && (
          <PropertyCalendarSimple propertyId={property.id} />
        )}
      </div>
    </div>
  )
}

// Composant Vue d'ensemble
function PropertyOverview({ property, photos }: { property: Property; photos: PropertyPhoto[] }) {
  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    marginBottom: '1.5rem'
  }

  const primaryPhoto = photos.find(p => p.is_primary) || photos[0]

  return (
    <div>
      {/* Hero Image */}
      {primaryPhoto && (
        <div style={cardStyle}>
          <img
            src={primaryPhoto.url}
            alt={primaryPhoto.caption || property.name}
            style={{
              width: '100%',
              height: '300px',
              objectFit: 'cover',
              borderRadius: '0.5rem'
            }}
          />
          {primaryPhoto.caption && (
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.5rem', textAlign: 'center' }}>
              {primaryPhoto.caption}
            </p>
          )}
        </div>
      )}

      {/* Property Details */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          🏠 Détails de la Propriété
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Prix par nuit</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{property.price_per_night}€</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Capacité max</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{property.max_guests} invités</div>
          </div>
          {property.bedrooms && (
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Chambres</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{property.bedrooms}</div>
            </div>
          )}
          {property.bathrooms && (
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Salles de bain</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{property.bathrooms}</div>
            </div>
          )}
          {property.area_sqm && (
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Surface</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{property.area_sqm} m²</div>
            </div>
          )}
        </div>

        {property.description && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Description</h3>
            <p style={{ color: '#374151', lineHeight: '1.6' }}>{property.description}</p>
          </div>
        )}
      </div>

      {/* Amenities */}
      {property.amenities && property.amenities.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            ✨ Équipements
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {property.amenities.map((amenity, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#10B981', borderRadius: '50%' }} />
                <span style={{ fontSize: '0.875rem' }}>{amenity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Gallery Preview */}
      {photos.length > 1 && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            📸 Galerie Photos ({photos.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
            {photos.slice(0, 6).map((photo, index) => (
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.caption || `Photo ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '0.25rem'
                }}
              />
            ))}
            {photos.length > 6 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F3F4F6',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                color: '#6B7280',
                fontWeight: '500'
              }}>
                +{photos.length - 6} photos
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}