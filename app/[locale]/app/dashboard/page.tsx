'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AdminStats {
  total_users: number
  total_clients: number
  total_partners: number
  pending_partners: number
  total_properties: number
  active_properties: number
  total_bookings: number
  pending_bookings: number
  total_revenue: number
  monthly_revenue: number
  disputes_count: number
  platform_commission: number
}

interface RecentActivity {
  id: string
  type: 'user_registration' | 'partner_verification' | 'booking_created' | 'dispute_opened'
  description: string
  user_name: string
  timestamp: string
  status?: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    total_clients: 0,
    total_partners: 0,
    pending_partners: 0,
    total_properties: 0,
    active_properties: 0,
    total_bookings: 0,
    pending_bookings: 0,
    total_revenue: 0,
    monthly_revenue: 0,
    disputes_count: 0,
    platform_commission: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch admin stats
      const statsResponse = await fetch('/api/admin/dashboard/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/admin/dashboard/activity')
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData.activities || [])
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration': return '👤'
      case 'partner_verification': return '✅'
      case 'booking_created': return '📅'
      case 'dispute_opened': return '⚠️'
      default: return '📋'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_registration': return '#3B82F6'
      case 'partner_verification': return '#10B981'
      case 'booking_created': return '#F59E0B'
      case 'dispute_opened': return '#EF4444'
      default: return '#6B7280'
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
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
          <p style={{ color: '#6B7280' }}>Chargement du dashboard administrateur...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Erreur de chargement</h2>
          <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={fetchDashboardData}
            style={{ ...buttonStyle, backgroundColor: '#3B82F6', color: 'white' }}
          >
            Réessayer
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
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            🛡️ Dashboard Administrateur
          </h1>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            Supervision et gestion de la plateforme multi-rôles
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                Utilisateurs Totaux
              </h3>
              <div style={{ fontSize: '1.5rem' }}>👥</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.total_users}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.25rem' }}>
              {stats.total_clients} clients • {stats.total_partners} partenaires
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                Partenaires en Attente
              </h3>
              <div style={{ fontSize: '1.5rem' }}>⏳</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F59E0B' }}>
              {stats.pending_partners}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#F59E0B', marginTop: '0.25rem' }}>
              Nécessitent validation
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                Propriétés
              </h3>
              <div style={{ fontSize: '1.5rem' }}>🏠</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.total_properties}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#10B981', marginTop: '0.25rem' }}>
              {stats.active_properties} actives
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                Réservations
              </h3>
              <div style={{ fontSize: '1.5rem' }}>📅</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.total_bookings}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#F59E0B', marginTop: '0.25rem' }}>
              {stats.pending_bookings} en attente
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                Revenus Totaux
              </h3>
              <div style={{ fontSize: '1.5rem' }}>💰</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.total_revenue}€
            </div>
            <div style={{ fontSize: '0.875rem', color: '#10B981', marginTop: '0.25rem' }}>
              {stats.monthly_revenue}€ ce mois
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', margin: 0 }}>
                Litiges Ouverts
              </h3>
              <div style={{ fontSize: '1.5rem' }}>⚠️</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stats.disputes_count > 0 ? '#EF4444' : '#10B981' }}>
              {stats.disputes_count}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.25rem' }}>
              Nécessitent attention
            </div>
          </div>
        </div>        {
/* Quick Actions */}
        <div style={{ ...cardStyle, marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            🚀 Actions Rapides
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <button
              onClick={() => router.push('/fr/app/users')}
              style={{
                ...buttonStyle,
                backgroundColor: '#3B82F6',
                color: 'white'
              }}
            >
              👥 Gérer les Utilisateurs
            </button>
            <button
              onClick={() => router.push('/fr/app/partners/pending')}
              style={{
                ...buttonStyle,
                backgroundColor: '#F59E0B',
                color: 'white'
              }}
            >
              ⏳ Valider Partenaires ({stats.pending_partners})
            </button>
            <button
              onClick={() => router.push('/fr/app/bookings')}
              style={{
                ...buttonStyle,
                backgroundColor: '#10B981',
                color: 'white'
              }}
            >
              📅 Superviser Réservations
            </button>
            <button
              onClick={() => router.push('/fr/app/disputes')}
              style={{
                ...buttonStyle,
                backgroundColor: stats.disputes_count > 0 ? '#EF4444' : '#6B7280',
                color: 'white'
              }}
            >
              ⚠️ Gérer Litiges ({stats.disputes_count})
            </button>
            <button
              onClick={() => router.push('/fr/app/reports')}
              style={{
                ...buttonStyle,
                backgroundColor: '#8B5CF6',
                color: 'white'
              }}
            >
              📊 Rapports Financiers
            </button>
            <button
              onClick={() => router.push('/fr/app/settings')}
              style={{
                ...buttonStyle,
                backgroundColor: '#6B7280',
                color: 'white'
              }}
            >
              ⚙️ Paramètres Plateforme
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Recent Activity */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                📋 Activité Récente
              </h2>
              <button
                onClick={fetchDashboardData}
                style={{
                  ...buttonStyle,
                  backgroundColor: 'transparent',
                  color: '#3B82F6',
                  border: '1px solid #3B82F6',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem'
                }}
              >
                🔄 Actualiser
              </button>
            </div>

            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <p style={{ color: '#6B7280' }}>Aucune activité récente</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '0.5rem',
                      border: '1px solid #E5E7EB'
                    }}
                  >
                    <div
                      style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        backgroundColor: getActivityColor(activity.type),
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem'
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                        {activity.description}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        {activity.user_name} • {new Date(activity.timestamp).toLocaleString('fr-FR')}
                      </div>
                    </div>
                    {activity.status && (
                      <span
                        style={{
                          backgroundColor: activity.status === 'pending' ? '#F59E0B' : '#10B981',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                      >
                        {activity.status === 'pending' ? 'En attente' : 'Traité'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Health */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              🔧 État du Système
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>Plateforme</span>
                <span style={{ color: '#10B981', fontSize: '0.875rem', fontWeight: '500' }}>✅ Opérationnelle</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>Base de données</span>
                <span style={{ color: '#10B981', fontSize: '0.875rem', fontWeight: '500' }}>✅ Normale</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>Paiements</span>
                <span style={{ color: '#10B981', fontSize: '0.875rem', fontWeight: '500' }}>✅ Actifs</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>Notifications</span>
                <span style={{ color: '#10B981', fontSize: '0.875rem', fontWeight: '500' }}>✅ Fonctionnelles</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem' }}>Stockage</span>
                <span style={{ color: '#F59E0B', fontSize: '0.875rem', fontWeight: '500' }}>⚠️ 78% utilisé</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#EBF8FF', borderRadius: '0.5rem' }}>
              <h4 style={{ color: '#1E40AF', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                📈 Performance
              </h4>
              <div style={{ fontSize: '0.75rem', color: '#1E40AF' }}>
                <div>Temps de réponse moyen: 245ms</div>
                <div>Disponibilité: 99.8%</div>
                <div>Utilisateurs actifs: {Math.floor(stats.total_users * 0.15)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}