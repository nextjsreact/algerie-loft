'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PlatformSettings {
  booking_commission_rate: number
  minimum_booking_amount: number
  maximum_booking_days: number
  partner_verification_required: boolean
  auto_approve_bookings: boolean
  cancellation_policy_hours: number
  refund_processing_days: number
  platform_maintenance_mode: boolean
  registration_enabled: boolean
  partner_registration_enabled: boolean
}

interface SystemStats {
  total_users: number
  active_bookings: number
  platform_revenue: number
  storage_usage_gb: number
  api_calls_today: number
  error_rate_percent: number
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<PlatformSettings>({
    booking_commission_rate: 0,
    minimum_booking_amount: 0,
    maximum_booking_days: 0,
    partner_verification_required: true,
    auto_approve_bookings: false,
    cancellation_policy_hours: 24,
    refund_processing_days: 7,
    platform_maintenance_mode: false,
    registration_enabled: true,
    partner_registration_enabled: true
  })
  const [stats, setStats] = useState<SystemStats>({
    total_users: 0,
    active_bookings: 0,
    platform_revenue: 0,
    storage_usage_gb: 0,
    api_calls_today: 0,
    error_rate_percent: 0
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      
      // Fetch platform settings
      const settingsResponse = await fetch('/api/admin/settings')
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setSettings(settingsData.settings || settings)
      }

      // Fetch system stats
      const statsResponse = await fetch('/api/admin/system/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats || stats)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde')
      }

      alert('Paramètres sauvegardés avec succès')
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleSystemAction = async (action: 'backup' | 'clear_cache' | 'restart_services') => {
    if (!confirm(`Êtes-vous sûr de vouloir ${action === 'backup' ? 'créer une sauvegarde' : action === 'clear_cache' ? 'vider le cache' : 'redémarrer les services'} ?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/system/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'action système')
      }

      alert('Action système exécutée avec succès')
      await fetchSettings() // Refresh stats
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de l\'action système')
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
    borderRadius: '0.25rem',
    border: 'none',
    fontSize: '0.875rem',
    cursor: 'pointer',
    fontWeight: '500'
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.25rem',
    fontSize: '0.875rem'
  }

  const switchStyle = {
    position: 'relative' as const,
    display: 'inline-block',
    width: '3rem',
    height: '1.5rem'
  }

  const switchInputStyle = {
    opacity: 0,
    width: 0,
    height: 0
  }

  const sliderStyle = (checked: boolean) => ({
    position: 'absolute' as const,
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: checked ? '#10B981' : '#D1D5DB',
    transition: '0.4s',
    borderRadius: '1.5rem'
  })

  const sliderBeforeStyle = (checked: boolean) => ({
    position: 'absolute' as const,
    content: '""',
    height: '1.125rem',
    width: '1.125rem',
    left: checked ? '1.5rem' : '0.1875rem',
    bottom: '0.1875rem',
    backgroundColor: 'white',
    transition: '0.4s',
    borderRadius: '50%'
  })

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
          <p style={{ color: '#6B7280' }}>Chargement des paramètres...</p>
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
            onClick={fetchSettings}
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
          <button
            onClick={() => router.push('/fr/app/dashboard')}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #D1D5DB',
              borderRadius: '0.25rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            ← Retour au dashboard
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            ⚙️ Paramètres de la Plateforme
          </h1>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            Configuration et administration du système
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Business Settings */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                💼 Paramètres Commerciaux
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Taux de commission (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={settings.booking_commission_rate}
                    onChange={(e) => setSettings({...settings, booking_commission_rate: parseFloat(e.target.value) || 0})}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Montant minimum de réservation (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.minimum_booking_amount}
                    onChange={(e) => setSettings({...settings, minimum_booking_amount: parseInt(e.target.value) || 0})}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Durée maximum de réservation (jours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.maximum_booking_days}
                    onChange={(e) => setSettings({...settings, maximum_booking_days: parseInt(e.target.value) || 30})}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Délai d'annulation (heures)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="168"
                    value={settings.cancellation_policy_hours}
                    onChange={(e) => setSettings({...settings, cancellation_policy_hours: parseInt(e.target.value) || 24})}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Platform Settings */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                🔧 Paramètres de la Plateforme
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                      Vérification des partenaires obligatoire
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      Les nouveaux partenaires doivent être approuvés manuellement
                    </div>
                  </div>
                  <label style={switchStyle}>
                    <input
                      type="checkbox"
                      checked={settings.partner_verification_required}
                      onChange={(e) => setSettings({...settings, partner_verification_required: e.target.checked})}
                      style={switchInputStyle}
                    />
                    <span style={sliderStyle(settings.partner_verification_required)}>
                      <span style={sliderBeforeStyle(settings.partner_verification_required)}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                      Approbation automatique des réservations
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      Les réservations sont confirmées automatiquement
                    </div>
                  </div>
                  <label style={switchStyle}>
                    <input
                      type="checkbox"
                      checked={settings.auto_approve_bookings}
                      onChange={(e) => setSettings({...settings, auto_approve_bookings: e.target.checked})}
                      style={switchInputStyle}
                    />
                    <span style={sliderStyle(settings.auto_approve_bookings)}>
                      <span style={sliderBeforeStyle(settings.auto_approve_bookings)}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                      Inscriptions ouvertes
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      Permettre les nouvelles inscriptions d'utilisateurs
                    </div>
                  </div>
                  <label style={switchStyle}>
                    <input
                      type="checkbox"
                      checked={settings.registration_enabled}
                      onChange={(e) => setSettings({...settings, registration_enabled: e.target.checked})}
                      style={switchInputStyle}
                    />
                    <span style={sliderStyle(settings.registration_enabled)}>
                      <span style={sliderBeforeStyle(settings.registration_enabled)}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                      Inscriptions partenaires ouvertes
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      Permettre les nouvelles inscriptions de partenaires
                    </div>
                  </div>
                  <label style={switchStyle}>
                    <input
                      type="checkbox"
                      checked={settings.partner_registration_enabled}
                      onChange={(e) => setSettings({...settings, partner_registration_enabled: e.target.checked})}
                      style={switchInputStyle}
                    />
                    <span style={sliderStyle(settings.partner_registration_enabled)}>
                      <span style={sliderBeforeStyle(settings.partner_registration_enabled)}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#FEF2F2', borderRadius: '0.5rem', border: '1px solid #FECACA' }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#DC2626' }}>
                      Mode maintenance
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#DC2626' }}>
                      Désactive temporairement la plateforme pour maintenance
                    </div>
                  </div>
                  <label style={switchStyle}>
                    <input
                      type="checkbox"
                      checked={settings.platform_maintenance_mode}
                      onChange={(e) => setSettings({...settings, platform_maintenance_mode: e.target.checked})}
                      style={switchInputStyle}
                    />
                    <span style={sliderStyle(settings.platform_maintenance_mode)}>
                      <span style={sliderBeforeStyle(settings.platform_maintenance_mode)}></span>
                    </span>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleSaveSettings}
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
                <button
                  onClick={fetchSettings}
                  style={{
                    ...buttonStyle,
                    backgroundColor: 'transparent',
                    color: '#6B7280',
                    border: '1px solid #D1D5DB'
                  }}
                >
                  🔄 Annuler
                </button>
              </div>
            </div>
          </div>

          {/* System Info & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* System Stats */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                📊 Statistiques Système
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem' }}>Utilisateurs totaux</span>
                  <span style={{ fontWeight: '600' }}>{stats.total_users}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem' }}>Réservations actives</span>
                  <span style={{ fontWeight: '600' }}>{stats.active_bookings}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem' }}>Revenus plateforme</span>
                  <span style={{ fontWeight: '600' }}>{stats.platform_revenue}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem' }}>Stockage utilisé</span>
                  <span style={{ fontWeight: '600' }}>{stats.storage_usage_gb} GB</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem' }}>Appels API aujourd'hui</span>
                  <span style={{ fontWeight: '600' }}>{stats.api_calls_today}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem' }}>Taux d'erreur</span>
                  <span style={{ 
                    fontWeight: '600',
                    color: stats.error_rate_percent > 5 ? '#EF4444' : stats.error_rate_percent > 2 ? '#F59E0B' : '#10B981'
                  }}>
                    {stats.error_rate_percent}%
                  </span>
                </div>
              </div>
            </div>

            {/* System Actions */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                🔧 Actions Système
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => handleSystemAction('backup')}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    width: '100%'
                  }}
                >
                  💾 Créer une Sauvegarde
                </button>
                
                <button
                  onClick={() => handleSystemAction('clear_cache')}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#F59E0B',
                    color: 'white',
                    width: '100%'
                  }}
                >
                  🗑️ Vider le Cache
                </button>
                
                <button
                  onClick={() => handleSystemAction('restart_services')}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#EF4444',
                    color: 'white',
                    width: '100%'
                  }}
                >
                  🔄 Redémarrer les Services
                </button>
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#FEF3C7', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: '500', marginBottom: '0.5rem' }}>
                  ⚠️ Attention
                </div>
                <div style={{ fontSize: '0.75rem', color: '#92400E' }}>
                  Les actions système peuvent affecter temporairement les performances de la plateforme.
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                🔗 Liens Rapides
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={() => router.push('/fr/app/users')}
                  style={{
                    ...buttonStyle,
                    backgroundColor: 'transparent',
                    color: '#3B82F6',
                    border: '1px solid #3B82F6',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  👥 Gestion des Utilisateurs
                </button>
                
                <button
                  onClick={() => router.push('/fr/app/partners/pending')}
                  style={{
                    ...buttonStyle,
                    backgroundColor: 'transparent',
                    color: '#F59E0B',
                    border: '1px solid #F59E0B',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  ⏳ Validation Partenaires
                </button>
                
                <button
                  onClick={() => router.push('/fr/reports')}
                  style={{
                    ...buttonStyle,
                    backgroundColor: 'transparent',
                    color: '#8B5CF6',
                    border: '1px solid #8B5CF6',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  📊 Rapports Financiers
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}