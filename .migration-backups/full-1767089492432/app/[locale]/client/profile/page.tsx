'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ClientProfile {
  id: string
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  date_of_birth?: string
  address?: string
  city?: string
  country?: string
  preferences?: {
    language: string
    currency: string
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
  }
  created_at: string
}

export default function ClientProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    address: '',
    city: '',
    country: '',
    language: 'fr',
    currency: 'EUR',
    notifications: {
      email: true,
      sms: false,
      push: true
    }
  })

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile')
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du profil')
      }

      const profileData = await response.json()
      setProfile(profileData)
      
      // Update form data
      setFormData({
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
        date_of_birth: profileData.date_of_birth || '',
        address: profileData.address || '',
        city: profileData.city || '',
        country: profileData.country || '',
        language: profileData.preferences?.language || 'fr',
        currency: profileData.preferences?.currency || 'EUR',
        notifications: {
          email: profileData.preferences?.notifications?.email ?? true,
          sms: profileData.preferences?.notifications?.sms ?? false,
          push: profileData.preferences?.notifications?.push ?? true
        }
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNotificationChange = (type: 'email' | 'sms' | 'push', value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: value
      }
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          preferences: {
            language: formData.language,
            currency: formData.currency,
            notifications: formData.notifications
          }
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde')
      }

      setSuccessMessage('Profil mis à jour avec succès !')
      await fetchProfile()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.25rem',
    fontSize: '0.875rem'
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
          <p style={{ color: '#6B7280' }}>Chargement du profil...</p>
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
            onClick={() => router.push('/fr/client/dashboard')}
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
            👤 Mon Profil
          </h1>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            Gérez vos informations personnelles et préférences
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Messages */}
        {error && (
          <div style={{ 
            backgroundColor: '#FEF2F2', 
            border: '1px solid #FECACA', 
            borderRadius: '0.5rem', 
            padding: '1rem', 
            marginBottom: '1.5rem',
            color: '#DC2626'
          }}>
            ❌ {error}
          </div>
        )}

        {successMessage && (
          <div style={{ 
            backgroundColor: '#F0FDF4', 
            border: '1px solid #BBF7D0', 
            borderRadius: '0.5rem', 
            padding: '1rem', 
            marginBottom: '1.5rem',
            color: '#166534'
          }}>
            ✅ {successMessage}
          </div>
        )}

        {/* Profile Picture */}
        <div style={{ ...cardStyle, marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ 
            width: '6rem', 
            height: '6rem', 
            backgroundColor: '#3B82F6', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'white', 
            fontSize: '2rem',
            fontWeight: '600',
            margin: '0 auto 1rem auto'
          }}>
            {profile?.full_name?.charAt(0) || '👤'}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {profile?.full_name || 'Nom non défini'}
          </h2>
          <p style={{ color: '#6B7280', marginBottom: '1rem' }}>
            {profile?.email}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            Membre depuis {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : 'N/A'}
          </p>
        </div>

        {/* Personal Information */}
        <div style={{ ...cardStyle, marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            📝 Informations Personnelles
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Nom complet *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                style={inputStyle}
                placeholder="Votre nom complet"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                style={inputStyle}
                placeholder="+33 6 XX XX XX XX"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Date de naissance
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Pays
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                style={inputStyle}
              >
                <option value="">Sélectionnez un pays</option>
                <option value="DZ">Algérie</option>
                <option value="FR">France</option>
                <option value="MA">Maroc</option>
                <option value="TN">Tunisie</option>
                <option value="CA">Canada</option>
                <option value="US">États-Unis</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Adresse
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                style={inputStyle}
                placeholder="Votre adresse"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Ville
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                style={inputStyle}
                placeholder="Votre ville"
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div style={{ ...cardStyle, marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            ⚙️ Préférences
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Langue
              </label>
              <select
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                style={inputStyle}
              >
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Devise
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                style={inputStyle}
              >
                <option value="EUR">Euro (€)</option>
                <option value="DZD">Dinar Algérien (DA)</option>
                <option value="USD">Dollar US ($)</option>
                <option value="CAD">Dollar Canadien (CAD)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div style={{ ...cardStyle, marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            🔔 Notifications
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>📧 Notifications par email</div>
                <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                  Confirmations de réservation, rappels et offres spéciales
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.notifications.email}
                onChange={(e) => handleNotificationChange('email', e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>📱 Notifications SMS</div>
                <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                  Rappels urgents et informations de dernière minute
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.notifications.sms}
                onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>🔔 Notifications push</div>
                <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                  Notifications en temps réel sur l'application
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.notifications.push}
                onChange={(e) => handleNotificationChange('push', e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem' }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => router.push('/fr/client/dashboard')}
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
            onClick={handleSave}
            disabled={saving}
            style={{
              ...buttonStyle,
              backgroundColor: saving ? '#9CA3AF' : '#3B82F6',
              color: 'white',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  )
}