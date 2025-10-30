'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchFilters, ClientLoftView } from '@/lib/types'
import { PortalNavigation } from '@/components/portal/portal-navigation'

interface SearchResponse {
  lofts: ClientLoftView[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: SearchFilters
}

export default function ClientSearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [lofts, setLofts] = useState<ClientLoftView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })

  const [filters, setFilters] = useState<SearchFilters>({
    check_in: searchParams.get('check_in') || '',
    check_out: searchParams.get('check_out') || '',
    location: searchParams.get('location') || '',
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    guests: searchParams.get('guests') ? Number(searchParams.get('guests')) : 1,
    amenities: searchParams.get('amenities')?.split(',').filter(Boolean) || []
  })

  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating' | 'newest'>('price_asc')

  const searchLofts = async (page: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (filters.check_in) params.set('check_in', filters.check_in)
      if (filters.check_out) params.set('check_out', filters.check_out)
      if (filters.location) params.set('location', filters.location)
      if (filters.min_price) params.set('min_price', filters.min_price.toString())
      if (filters.max_price) params.set('max_price', filters.max_price.toString())
      if (filters.guests) params.set('guests', filters.guests.toString())
      if (filters.amenities && filters.amenities.length > 0) {
        params.set('amenities', filters.amenities.join(','))
      }
      params.set('page', page.toString())
      params.set('limit', '12')

      const response = await fetch(`/api/lofts/search?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la recherche')
      }

      const data: SearchResponse = await response.json()
      
      // Sort results
      let sortedLofts = [...data.lofts]
      switch (sortBy) {
        case 'price_asc':
          sortedLofts.sort((a, b) => a.price_per_night - b.price_per_night)
          break
        case 'price_desc':
          sortedLofts.sort((a, b) => b.price_per_night - a.price_per_night)
          break
        case 'rating':
          sortedLofts.sort((a, b) => b.average_rating - a.average_rating)
          break
        case 'newest':
          // Keep original order (newest first from API)
          break
      }

      setLofts(sortedLofts)
      setPagination(data.pagination)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    searchLofts()
  }, [sortBy])

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleSearch = () => {
    searchLofts(1)
  }

  const handleLoftClick = (loftId: string) => {
    const params = new URLSearchParams()
    if (filters.check_in) params.set('check_in', filters.check_in)
    if (filters.check_out) params.set('check_out', filters.check_out)
    if (filters.guests) params.set('guests', filters.guests.toString())
    
    router.push(`/fr/client/lofts/${loftId}?${params.toString()}`)
  }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s'
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
    fontWeight: '500'
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <PortalNavigation currentPage="Recherche Client" locale="fr" />
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
            🔍 Recherche de Lofts
          </h1>
          <p style={{ color: '#6B7280' }}>
            Trouvez le loft parfait pour votre séjour
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Search Filters */}
        <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                📅 Date d'arrivée
              </label>
              <input
                type="date"
                value={filters.check_in || ''}
                onChange={(e) => handleFilterChange({ check_in: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                📅 Date de départ
              </label>
              <input
                type="date"
                value={filters.check_out || ''}
                onChange={(e) => handleFilterChange({ check_out: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                👥 Nombre d'invités
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={filters.guests || 1}
                onChange={(e) => handleFilterChange({ guests: Number(e.target.value) })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                📍 Localisation
              </label>
              <input
                type="text"
                placeholder="Ville, quartier..."
                value={filters.location || ''}
                onChange={(e) => handleFilterChange({ location: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                💰 Prix min (€/nuit)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={filters.min_price || ''}
                onChange={(e) => handleFilterChange({ min_price: e.target.value ? Number(e.target.value) : undefined })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                💰 Prix max (€/nuit)
              </label>
              <input
                type="number"
                min="0"
                placeholder="500"
                value={filters.max_price || ''}
                onChange={(e) => handleFilterChange({ max_price: e.target.value ? Number(e.target.value) : undefined })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                📊 Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={inputStyle}
              >
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="rating">Mieux notés</option>
                <option value="newest">Plus récents</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button onClick={handleSearch} style={buttonStyle}>
                🔍 Rechercher
              </button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              {loading ? 'Recherche en cours...' : `${pagination?.total || 0} loft${(pagination?.total || 0) > 1 ? 's' : ''} trouvé${(pagination?.total || 0) > 1 ? 's' : ''}`}
            </h2>
            {pagination && pagination.totalPages > 1 && (
              <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                Page {pagination.page} sur {pagination.totalPages}
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#DC2626', margin: 0 }}>❌ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
            <p style={{ color: '#6B7280' }}>Recherche en cours...</p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && lofts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {lofts.map((loft) => (
              <div
                key={loft.id}
                style={cardStyle}
                onClick={() => handleLoftClick(loft.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Loft Image Placeholder */}
                <div style={{ 
                  height: '200px', 
                  backgroundColor: '#F3F4F6', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '3rem'
                }}>
                  🏠
                </div>

                <div style={{ padding: '1.5rem' }}>
                  {/* Loft Name and Rating */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, flex: 1 }}>
                      {loft.name}
                    </h3>
                    {loft.average_rating > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.5rem' }}>
                        <span style={{ color: '#F59E0B' }}>⭐</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {loft.average_rating.toFixed(1)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          ({loft.review_count})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    📍 {loft.address}
                  </p>

                  {/* Description */}
                  {loft.description && (
                    <p style={{ 
                      color: '#374151', 
                      fontSize: '0.875rem', 
                      margin: '0 0 1rem 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {loft.description}
                    </p>
                  )}

                  {/* Partner Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ 
                      width: '1.5rem', 
                      height: '1.5rem', 
                      backgroundColor: '#3B82F6', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'white', 
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {loft.partner?.name?.charAt(0) || loft.partner?.business_name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        {loft.partner?.business_name || loft.partner?.name || 'Propriétaire'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        Partenaire vérifié ✅
                      </div>
                    </div>
                  </div>

                  {/* Price and Book Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
                        {loft.price_per_night}€
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        par nuit
                      </div>
                    </div>
                    <button
                      style={{
                        ...buttonStyle,
                        fontSize: '0.875rem',
                        padding: '0.5rem 1rem'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLoftClick(loft.id)
                      }}
                    >
                      Voir détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && lofts.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Aucun loft trouvé
            </h3>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              Essayez de modifier vos critères de recherche
            </p>
            <button
              onClick={() => {
                setFilters({
                  check_in: '',
                  check_out: '',
                  location: '',
                  min_price: undefined,
                  max_price: undefined,
                  guests: 1,
                  amenities: []
                })
                searchLofts(1)
              }}
              style={{ ...buttonStyle, backgroundColor: '#6B7280' }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2rem' }}>
            <button
              onClick={() => searchLofts((pagination?.page || 1) - 1)}
              disabled={(pagination?.page || 1) <= 1}
              style={{
                ...buttonStyle,
                backgroundColor: (pagination?.page || 1) <= 1 ? '#9CA3AF' : '#6B7280',
                cursor: (pagination?.page || 1) <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Précédent
            </button>
            
            <span style={{ padding: '0 1rem', color: '#6B7280' }}>
              Page {pagination?.page || 1} sur {pagination?.totalPages || 1}
            </span>
            
            <button
              onClick={() => searchLofts((pagination?.page || 1) + 1)}
              disabled={(pagination?.page || 1) >= (pagination?.totalPages || 1)}
              style={{
                ...buttonStyle,
                backgroundColor: (pagination?.page || 1) >= (pagination?.totalPages || 1) ? '#9CA3AF' : '#6B7280',
                cursor: (pagination?.page || 1) >= (pagination?.totalPages || 1) ? 'not-allowed' : 'pointer'
              }}
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}