'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AvailabilityCalendar } from '@/components/partner/availability-calendar'
import { PricingRules } from '@/components/partner/pricing-rules'

interface Property {
  id: string
  name: string
  address: string
  price_per_night: number
  is_published: boolean
}

export default function PropertyAvailabilityPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string
  
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'calendar' | 'pricing'>('calendar')

  useEffect(() => {
    fetchProperty()
  }, [propertyId])

  const fetchProperty = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/partner/properties/${propertyId}`)
      
      if (!response.ok) {
        throw new Error('Propriété non trouvée')
      }

      const data = await response.json()
      setProperty(data.property)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleAvailabilityChange = () => {
    // Refresh data if needed
    console.log('Availability updated')
  }

  const handlePricingRulesChange = () => {
    // Refresh data if needed
    console.log('Pricing rules updated')
  }

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

  const tabStyle = (isActive: boolean) => ({
    ...buttonStyle,
    backgroundColor: isActive ? '#3B82F6' : 'transparent',
    color: isActive ? 'white' : '#6B7280',
    border: isActive ? 'none' : '1px solid #D1D5DB',
    padding: '0.75rem 1.5rem'
  })

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
            style={{ ...buttonStyle, backgroundColor: '#3B82F6', color: 'white' }}
          >
            Retour aux propriétés
          </button>
        </div>
      </div>
    )
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
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                📅 Disponibilité et Tarification
              </h1>
              <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
                {property.name} • {property.address}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Prix de base</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                  {property.price_per_night}€/nuit
                </div>
              </div>
              
              <div style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                backgroundColor: property.is_published ? '#10B981' : '#F59E0B'
              }} />
              <span style={{ 
                fontSize: '0.875rem', 
                color: property.is_published ? '#10B981' : '#F59E0B',
                fontWeight: '500'
              }}>
                {property.is_published ? 'Publié' : 'Brouillon'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Navigation Tabs */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              onClick={() => setActiveTab('calendar')}
              style={tabStyle(activeTab === 'calendar')}
            >
              📅 Calendrier de Disponibilité
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              style={tabStyle(activeTab === 'pricing')}
            >
              💰 Règles de Tarification
            </button>
          </div>

          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            {activeTab === 'calendar' && (
              <p>
                Gérez la disponibilité de votre propriété jour par jour. Bloquez des dates, 
                définissez des prix spéciaux et configurez les séjours minimum.
              </p>
            )}
            {activeTab === 'pricing' && (
              <p>
                Créez des règles de tarification automatiques pour optimiser vos revenus 
                selon les saisons, événements et périodes spéciales.
              </p>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'calendar' && (
          <AvailabilityCalendar
            propertyId={propertyId}
            basePrice={property.price_per_night}
            onAvailabilityChange={handleAvailabilityChange}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingRules
            propertyId={propertyId}
            basePrice={property.price_per_night}
            onRulesChange={handlePricingRulesChange}
          />
        )}

        {/* Quick Stats */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            📊 Statistiques Rapides
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#F0FDF4', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>85%</div>
              <div style={{ fontSize: '0.875rem', color: '#166534' }}>Taux d'occupation</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#EBF8FF', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1E40AF' }}>12</div>
              <div style={{ fontSize: '0.875rem', color: '#1E40AF' }}>Jours bloqués ce mois</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#FEF3C7', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400E' }}>3</div>
              <div style={{ fontSize: '0.875rem', color: '#92400E' }}>Règles de prix actives</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#F3E8FF', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7C3AED' }}>
                {Math.round(property.price_per_night * 1.2)}€
              </div>
              <div style={{ fontSize: '0.875rem', color: '#7C3AED' }}>Prix moyen effectif</div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div style={{ 
          backgroundColor: '#EBF8FF', 
          border: '1px solid #93C5FD', 
          borderRadius: '0.5rem', 
          padding: '1rem'
        }}>
          <h4 style={{ color: '#1E40AF', fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            💡 Conseils d'Optimisation
          </h4>
          <ul style={{ color: '#1E40AF', fontSize: '0.875rem', margin: 0, paddingLeft: '1.5rem' }}>
            <li>Utilisez des règles saisonnières pour maximiser vos revenus pendant les périodes de forte demande</li>
            <li>Bloquez les dates de maintenance ou d'indisponibilité personnelle à l'avance</li>
            <li>Définissez des séjours minimum pour les week-ends et périodes spéciales</li>
            <li>Surveillez vos statistiques pour ajuster vos prix en fonction de la demande</li>
          </ul>
        </div>
      </div>
    </div>
  )
}