'use client'

import { AvailabilityCalendar } from '@/components/partner/availability-calendar'
import { PricingRules } from '@/components/partner/pricing-rules'

export default function AvailabilityDemoPage() {
  const mockPropertyId = 'demo-property-123'
  const mockBasePrice = 120

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem'
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            📅 Démonstration - Calendrier de Disponibilité et Tarification
          </h1>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            Interface complète de gestion de disponibilité et tarification dynamique
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Demo Info */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>🏠</div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                Loft Moderne Centre-Ville (Démonstration)
              </h2>
              <p style={{ color: '#6B7280', margin: '0.25rem 0 0 0' }}>
                123 Rue de la Paix, Paris • Prix de base: {mockBasePrice}€/nuit
              </p>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: '#EBF8FF', 
            border: '1px solid #93C5FD', 
            borderRadius: '0.5rem', 
            padding: '1rem'
          }}>
            <h4 style={{ color: '#1E40AF', fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              💡 Mode Démonstration
            </h4>
            <p style={{ color: '#1E40AF', fontSize: '0.875rem', margin: 0 }}>
              Cette page présente les fonctionnalités complètes du système de calendrier de disponibilité 
              et de tarification dynamique. Les données ne sont pas sauvegardées en mode démonstration.
            </p>
          </div>
        </div>

        {/* Availability Calendar */}
        <AvailabilityCalendar
          propertyId={mockPropertyId}
          basePrice={mockBasePrice}
          onAvailabilityChange={(date, data) => {
            console.log('Availability changed:', date, data)
          }}
        />

        {/* Pricing Rules */}
        <PricingRules
          propertyId={mockPropertyId}
          basePrice={mockBasePrice}
          onRulesChange={() => {
            console.log('Pricing rules changed')
          }}
        />

        {/* Features Overview */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            🚀 Fonctionnalités Implémentées
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#3B82F6' }}>
                📅 Calendrier de Disponibilité
              </h4>
              <ul style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, paddingLeft: '1.5rem' }}>
                <li>Navigation mensuelle intuitive</li>
                <li>Sélection multiple de dates</li>
                <li>Actions en lot (bloquer/débloquer)</li>
                <li>Prix personnalisés par date</li>
                <li>Séjours minimum configurables</li>
                <li>Visualisation des réservations</li>
                <li>Actions rapides (week-ends, vacances)</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#10B981' }}>
                💰 Tarification Dynamique
              </h4>
              <ul style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, paddingLeft: '1.5rem' }}>
                <li>Règles saisonnières automatiques</li>
                <li>Multiplicateurs de prix flexibles</li>
                <li>Gestion des périodes spéciales</li>
                <li>Modèles prédéfinis</li>
                <li>Validation des chevauchements</li>
                <li>Activation/désactivation des règles</li>
                <li>Aperçu des prix effectifs</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B5CF6' }}>
                🔧 Fonctionnalités Techniques
              </h4>
              <ul style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, paddingLeft: '1.5rem' }}>
                <li>API REST complète</li>
                <li>Validation des données</li>
                <li>Gestion des conflits</li>
                <li>Sécurité RLS (Row Level Security)</li>
                <li>Interface responsive</li>
                <li>Optimisation des performances</li>
                <li>Gestion d'erreurs robuste</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            🔌 API Endpoints Créés
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '0.5rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#059669' }}>
                Gestion de la Disponibilité
              </h4>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#6B7280' }}>
                <div>GET /api/partner/properties/[id]/availability</div>
                <div>PUT /api/partner/properties/[id]/availability</div>
                <div>PUT /api/partner/properties/[id]/availability/bulk</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '0.5rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#7C3AED' }}>
                Règles de Tarification
              </h4>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#6B7280' }}>
                <div>GET /api/partner/properties/[id]/pricing-rules</div>
                <div>POST /api/partner/properties/[id]/pricing-rules</div>
                <div>PUT /api/partner/properties/[id]/pricing-rules/[ruleId]</div>
                <div>DELETE /api/partner/properties/[id]/pricing-rules/[ruleId]</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}