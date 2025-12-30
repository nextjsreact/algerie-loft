'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PortalNavigation } from '@/components/portal/portal-navigation'

export default function PartnerDemoPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'earnings'>('overview')

  const mockStats = {
    totalProperties: 5,
    activeBookings: 12,
    monthlyEarnings: 15750,
    occupancyRate: 78,
    averageRating: 4.8,
    totalReviews: 156
  }

  const mockProperties = [
    {
      id: '1',
      name: 'Loft Moderne Centre-Ville',
      address: '123 Rue de la Paix, Alger',
      status: 'available',
      nextBooking: '2024-11-15',
      monthlyRevenue: 4200
    },
    {
      id: '2', 
      name: 'Studio Vue Mer',
      address: '456 Boulevard Maritime, Oran',
      status: 'occupied',
      nextBooking: '2024-11-20',
      monthlyRevenue: 3800
    },
    {
      id: '3',
      name: 'Appartement Familial',
      address: '789 Avenue des Martyrs, Constantine',
      status: 'maintenance',
      nextBooking: '2024-11-25',
      monthlyRevenue: 2900
    }
  ]

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
      default: return 'Inconnu'
    }
  }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  }

  const tabStyle = (isActive: boolean) => ({
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    backgroundColor: isActive ? '#3B82F6' : '#F3F4F6',
    color: isActive ? 'white' : '#374151',
    transition: 'all 0.2s'
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <PortalNavigation currentPage="Démonstration Partenaire" locale="fr" />
      
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '2rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
            🏢 Dashboard Partenaire - Démonstration
          </h1>
          <p style={{ color: '#6B7280', fontSize: '1.125rem' }}>
            Découvrez l'interface de gestion pour les propriétaires de lofts
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={tabStyle(activeTab === 'overview')}
          >
            📊 Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            style={tabStyle(activeTab === 'properties')}
          >
            🏠 Mes Propriétés
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            style={tabStyle(activeTab === 'earnings')}
          >
            💰 Revenus
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                    Propriétés Totales
                  </h3>
                  <div style={{ fontSize: '1.5rem' }}>🏠</div>
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {mockStats.totalProperties}
                </p>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                    Réservations Actives
                  </h3>
                  <div style={{ fontSize: '1.5rem' }}>📅</div>
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {mockStats.activeBookings}
                </p>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                    Revenus Mensuels
                  </h3>
                  <div style={{ fontSize: '1.5rem' }}>💰</div>
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981', margin: 0 }}>
                  {mockStats.monthlyEarnings.toLocaleString()} DA
                </p>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                    Taux d'Occupation
                  </h3>
                  <div style={{ fontSize: '1.5rem' }}>📈</div>
                </div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {mockStats.occupancyRate}%
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                🚀 Actions Rapides
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <button
                  onClick={() => router.push('/fr/login?role=partner&redirect=/partner/properties')}
                  style={{
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  ➕ Ajouter une Propriété
                </button>
                <button
                  onClick={() => router.push('/fr/login?role=partner&redirect=/partner/dashboard')}
                  style={{
                    backgroundColor: '#10B981',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  📊 Voir les Analytics
                </button>
                <button
                  onClick={() => router.push('/fr/login?role=partner&redirect=/partner/bookings')}
                  style={{
                    backgroundColor: '#F59E0B',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  📅 Gérer les Réservations
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              🏠 Mes Propriétés
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {mockProperties.map((property) => (
                <div key={property.id} style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      {property.name}
                    </h3>
                    <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
                      {property.address}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Statut</div>
                      <div style={{
                        backgroundColor: getStatusColor(property.status),
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                      }}>
                        {getStatusLabel(property.status)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Revenus/mois</div>
                      <div style={{ fontWeight: '600', color: '#10B981' }}>
                        {property.monthlyRevenue.toLocaleString()} DA
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              💰 Analyse des Revenus
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                  📈 Revenus par Mois
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#F9FAFB', borderRadius: '0.25rem' }}>
                    <span>Octobre 2024</span>
                    <span style={{ fontWeight: '600', color: '#10B981' }}>15,750 DA</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#F9FAFB', borderRadius: '0.25rem' }}>
                    <span>Septembre 2024</span>
                    <span style={{ fontWeight: '600', color: '#10B981' }}>14,200 DA</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#F9FAFB', borderRadius: '0.25rem' }}>
                    <span>Août 2024</span>
                    <span style={{ fontWeight: '600', color: '#10B981' }}>16,800 DA</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                  🏆 Meilleures Propriétés
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {mockProperties.map((property, index) => (
                    <div key={property.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#F9FAFB', borderRadius: '0.25rem' }}>
                      <span>#{index + 1} {property.name}</span>
                      <span style={{ fontWeight: '600', color: '#10B981' }}>
                        {property.monthlyRevenue.toLocaleString()} DA
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div style={{ 
          ...cardStyle, 
          marginTop: '2rem',
          backgroundColor: '#EBF8FF',
          border: '1px solid #93C5FD'
        }}>
          <h3 style={{ color: '#1E40AF', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            🚀 Prêt à commencer ?
          </h3>
          <p style={{ color: '#1E40AF', marginBottom: '1.5rem' }}>
            Connectez-vous pour accéder à votre vrai dashboard partenaire avec toutes les fonctionnalités.
          </p>
          <button
            onClick={() => router.push('/fr/login?role=partner')}
            style={{
              backgroundColor: '#3B82F6',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🔑 Se Connecter comme Partenaire
          </button>
        </div>
      </div>
    </div>
  )
}