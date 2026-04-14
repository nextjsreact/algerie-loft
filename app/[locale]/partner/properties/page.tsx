'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsivePartnerLayout } from '@/components/partner/responsive-partner-layout'

interface Property {
  id: string
  name: string
  address: string
  description?: string
  price_per_night: number
  status: 'available' | 'occupied' | 'maintenance'
  max_guests?: number
  amenities?: string[]
  bookings_count?: number
  earnings_this_month?: number
  occupancy_rate?: number
  cover_photo?: string | null
  images?: string[]
  created_at: string
}

export default function PartnerPropertiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied' | 'maintenance'>('all')

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/partner/properties')
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des propriétés')
      }

      const data = await response.json()
      // API returns { success, data: { properties: [...] } }
      setProperties(data?.data?.properties || data?.properties || [])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  const getFilteredProperties = () => {
    switch (filter) {
      case 'available': return properties.filter(p => p.status === 'available')
      case 'occupied': return properties.filter(p => p.status === 'occupied')
      case 'maintenance': return properties.filter(p => p.status === 'maintenance')
      default: return properties
    }
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

  if (loading) {
    return (
      <ResponsivePartnerLayout locale={locale}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
            <p style={{ color: '#6B7280' }}>Chargement de vos propriétés...</p>
          </div>
        </div>
      </ResponsivePartnerLayout>
    )
  }

  if (error) {
    return (
      <ResponsivePartnerLayout locale={locale}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Erreur de chargement</h2>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>{error}</p>
            <button
              onClick={fetchProperties}
              style={{ ...buttonStyle, backgroundColor: '#3B82F6', color: 'white' }}
            >
              Réessayer
            </button>
          </div>
        </div>
      </ResponsivePartnerLayout>
    )
  }

  const filteredProperties = getFilteredProperties()

  return (
    <ResponsivePartnerLayout locale={locale}>
      <div>
        {/* Page Title */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            🏠 Mes Propriétés
          </h1>
          <p style={{ color: '#6B7280', margin: '0.25rem 0 0 0' }}>
            Consultez vos lofts et suivez leurs performances
          </p>
        </div>
        {/* Filters */}
        <div style={{ ...cardStyle, marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'Tous', count: properties.length },
              { key: 'available', label: '✅ Disponible', count: properties.filter(p => p.status === 'available').length },
              { key: 'occupied', label: '🔴 Occupé', count: properties.filter(p => p.status === 'occupied').length },
              { key: 'maintenance', label: '🔧 Maintenance', count: properties.filter(p => p.status === 'maintenance').length }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                style={{
                  ...buttonStyle,
                  backgroundColor: filter === filterOption.key ? '#3B82F6' : 'transparent',
                  color: filter === filterOption.key ? 'white' : '#6B7280',
                  border: '1px solid #D1D5DB',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem'
                }}
              >
                {filterOption.label} ({filterOption.count})
              </button>
            ))}
          </div>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div style={cardStyle}>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏠</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {filter === 'all' ? 'Aucune propriété' : 
                 filter === 'available' ? 'Aucune propriété disponible' :
                 filter === 'occupied' ? 'Aucune propriété occupée' :
                 'Aucune propriété en maintenance'}
              </h2>
              <p style={{ color: '#6B7280', marginBottom: '2rem' }}>
                {filter === 'all' ? 'Aucune propriété trouvée.' :
                 filter === 'available' ? 'Aucune propriété disponible.' :
                 filter === 'occupied' ? 'Aucune propriété occupée.' :
                 'Aucune propriété en maintenance.'}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                style={{
                  ...cardStyle,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => router.push(`/${locale}/lofts/${property.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Property Image */}
                <div style={{ 
                  height: '200px', 
                  backgroundColor: '#F3F4F6', 
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  marginBottom: '1rem',
                  position: 'relative'
                }}>
                  {property.cover_photo ? (
                    <img
                      src={property.cover_photo}
                      alt={property.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                      🏠
                    </div>
                  )}
                </div>

                {/* Property Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                      {property.name}
                    </h3>
                    <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      📍 {property.address}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'end' }}>
                    <span
                      style={{
                        backgroundColor: getStatusColor(property.status),
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      {getStatusLabel(property.status)}
                    </span>
                  </div>
                </div>

                {/* Property Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Prix par nuit</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{property.price_per_night?.toLocaleString('fr-DZ')} DA</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Capacité</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{property.max_guests} invités</div>
                  </div>
                  {property.bedrooms && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Chambres</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{property.bedrooms}</div>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Salles de bain</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{property.bathrooms}</div>
                    </div>
                  )}
                </div>

                {/* Performance Stats */}
                {property.bookings_count !== undefined && (
                  <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
                      <div>
                        <div style={{ color: '#6B7280' }}>Réservations</div>
                        <div style={{ fontWeight: '500' }}>{property.bookings_count}</div>
                      </div>
                      <div>
                        <div style={{ color: '#6B7280' }}>Revenus/mois</div>
                        <div style={{ fontWeight: '500' }}>{(property.earnings_this_month || 0).toLocaleString('fr-DZ')} DA</div>
                      </div>
                      <div>
                        <div style={{ color: '#6B7280' }}>Occupation</div>
                        <div style={{ fontWeight: '500' }}>{Math.round(property.occupancy_rate || 0)}%</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Amenities Preview */}
                {property.amenities && property.amenities.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>Équipements</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {property.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          style={{
                            backgroundColor: '#F3F4F6',
                            color: '#374151',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.125rem',
                            fontSize: '0.75rem'
                          }}
                        >
                          {amenity}
                        </span>
                      ))}
                      {property.amenities.length > 3 && (
                        <span
                          style={{
                            backgroundColor: '#E5E7EB',
                            color: '#6B7280',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.125rem',
                            fontSize: '0.75rem'
                          }}
                        >
                          +{property.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </ResponsivePartnerLayout>
  )
}