'use client'

import { useState, useEffect } from 'react'

interface DashboardMetrics {
  totalRevenue: number
  monthlyRevenue: number
  occupancyRate: number
  averageRating: number
  totalBookings: number
  activeProperties: number
  pendingBookings: number
  revenueGrowth: number
  bookingGrowth: number
  topPerformingProperty: string
}

interface RevenueData {
  month: string
  revenue: number
  bookings: number
}

interface PropertyPerformance {
  id: string
  name: string
  revenue: number
  bookings: number
  occupancyRate: number
  rating: number
  trend: 'up' | 'down' | 'stable'
}

interface EnhancedDashboardProps {
  partnerId: string
}

export function EnhancedDashboard({ partnerId }: EnhancedDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    occupancyRate: 0,
    averageRating: 0,
    totalBookings: 0,
    activeProperties: 0,
    pendingBookings: 0,
    revenueGrowth: 0,
    bookingGrowth: 0,
    topPerformingProperty: ''
  })
  
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [propertyPerformance, setPropertyPerformance] = useState<PropertyPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    fetchDashboardData()
  }, [partnerId, timeRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch metrics
      const metricsResponse = await fetch(`/api/partner/dashboard/metrics?range=${timeRange}`)
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData.metrics)
      }

      // Fetch revenue data
      const revenueResponse = await fetch(`/api/partner/dashboard/revenue?range=${timeRange}`)
      if (revenueResponse.ok) {
        const revenueData = await revenueResponse.json()
        setRevenueData(revenueData.data)
      }

      // Fetch property performance
      const performanceResponse = await fetch(`/api/partner/dashboard/properties?range=${timeRange}`)
      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json()
        setPropertyPerformance(performanceData.properties)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      case 'stable': return '➡️'
      default: return '➡️'
    }
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return '#10B981'
    if (value < 0) return '#EF4444'
    return '#6B7280'
  }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }

  const metricCardStyle = {
    ...cardStyle,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    position: 'relative' as const,
    overflow: 'hidden'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <p style={{ color: '#6B7280' }}>Chargement des analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header with Time Range Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
            📊 Dashboard Analytics
          </h2>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            Aperçu de vos performances et revenus
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { key: '7d', label: '7 jours' },
            { key: '30d', label: '30 jours' },
            { key: '90d', label: '3 mois' },
            { key: '1y', label: '1 an' }
          ].map((range) => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key as any)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: timeRange === range.key ? '#3B82F6' : '#F3F4F6',
                color: timeRange === range.key ? 'white' : '#6B7280',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={metricCardStyle}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '4rem', opacity: 0.2 }}>💰</div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
              Revenus Totaux
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
              <span style={{ color: getTrendColor(metrics.revenueGrowth) }}>
                {formatPercentage(metrics.revenueGrowth)}
              </span> vs période précédente
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, borderLeft: '4px solid #10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Taux d'Occupation</div>
            <div style={{ fontSize: '1.5rem' }}>🏠</div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981', marginBottom: '0.5rem' }}>
            {metrics.occupancyRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            {metrics.activeProperties} propriétés actives
          </div>
        </div>

        <div style={{ ...cardStyle, borderLeft: '4px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Réservations</div>
            <div style={{ fontSize: '1.5rem' }}>📅</div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F59E0B', marginBottom: '0.5rem' }}>
            {metrics.totalBookings}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            <span style={{ color: getTrendColor(metrics.bookingGrowth) }}>
              {formatPercentage(metrics.bookingGrowth)}
            </span> vs période précédente
          </div>
        </div>

        <div style={{ ...cardStyle, borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Note Moyenne</div>
            <div style={{ fontSize: '1.5rem' }}>⭐</div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8B5CF6', marginBottom: '0.5rem' }}>
            {metrics.averageRating.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            Basé sur toutes les propriétés
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Revenue Chart */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            📈 Évolution des Revenus
          </h3>
          
          {revenueData.length > 0 ? (
            <div>
              {/* Simple Bar Chart */}
              <div style={{ display: 'flex', alignItems: 'end', gap: '8px', height: '200px', marginBottom: '1rem' }}>
                {revenueData.map((data, index) => {
                  const maxRevenue = Math.max(...revenueData.map(d => d.revenue))
                  const height = (data.revenue / maxRevenue) * 180
                  
                  return (
                    <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${height}px`,
                          backgroundColor: '#3B82F6',
                          borderRadius: '4px 4px 0 0',
                          marginBottom: '0.5rem',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                        title={`${data.month}: ${formatCurrency(data.revenue)}`}
                      />
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', textAlign: 'center' }}>
                        {data.month}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#6B7280' }}>
                <span>Revenus mensuels sur {timeRange}</span>
                <span>Total: {formatCurrency(revenueData.reduce((sum, d) => sum + d.revenue, 0))}</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <p style={{ color: '#6B7280' }}>Aucune donnée de revenus disponible</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            ⚡ Actions Rapides
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              style={{
                padding: '0.75rem',
                backgroundColor: '#EBF8FF',
                border: '1px solid #3B82F6',
                borderRadius: '0.5rem',
                color: '#3B82F6',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                textAlign: 'left'
              }}
            >
              📊 Voir rapport détaillé
            </button>
            
            <button
              style={{
                padding: '0.75rem',
                backgroundColor: '#F0FDF4',
                border: '1px solid #10B981',
                borderRadius: '0.5rem',
                color: '#10B981',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                textAlign: 'left'
              }}
            >
              💰 Optimiser les prix
            </button>
            
            <button
              style={{
                padding: '0.75rem',
                backgroundColor: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '0.5rem',
                color: '#F59E0B',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                textAlign: 'left'
              }}
            >
              📅 Gérer disponibilités
            </button>
            
            <button
              style={{
                padding: '0.75rem',
                backgroundColor: '#F3E8FF',
                border: '1px solid #8B5CF6',
                borderRadius: '0.5rem',
                color: '#8B5CF6',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                textAlign: 'left'
              }}
            >
              📸 Ajouter photos
            </button>
          </div>

          {/* Pending Actions */}
          {metrics.pendingBookings > 0 && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              backgroundColor: '#FEF2F2', 
              border: '1px solid #FECACA', 
              borderRadius: '0.5rem' 
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#DC2626', marginBottom: '0.25rem' }}>
                ⚠️ Actions requises
              </div>
              <div style={{ fontSize: '0.75rem', color: '#DC2626' }}>
                {metrics.pendingBookings} réservation{metrics.pendingBookings > 1 ? 's' : ''} en attente
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Property Performance */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          🏆 Performance des Propriétés
        </h3>
        
        {propertyPerformance.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                    Propriété
                  </th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                    Revenus
                  </th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                    Réservations
                  </th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                    Occupation
                  </th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                    Note
                  </th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                    Tendance
                  </th>
                </tr>
              </thead>
              <tbody>
                {propertyPerformance.map((property, index) => (
                  <tr key={property.id} style={{ borderBottom: index < propertyPerformance.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        {property.name}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '500' }}>
                      {formatCurrency(property.revenue)}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '0.875rem' }}>
                      {property.bookings}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '0.875rem' }}>
                      {property.occupancyRate.toFixed(1)}%
                    </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '0.875rem' }}>
                      ⭐ {property.rating.toFixed(1)}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center', fontSize: '1.25rem' }}>
                      {getTrendIcon(property.trend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
            <p style={{ color: '#6B7280' }}>Aucune donnée de performance disponible</p>
          </div>
        )}
      </div>
    </div>
  )
}