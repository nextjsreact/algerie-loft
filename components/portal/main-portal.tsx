'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MainPortalProps {
  locale: string
}

export default function MainPortal({ locale }: MainPortalProps) {
  const router = useRouter()
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)

  const profiles = [
    {
      id: 'client',
      title: 'Client',
      subtitle: 'Je veux réserver un loft',
      description: 'Recherchez et réservez des lofts exceptionnels en Algérie',
      icon: '🏠',
      color: '#3B82F6',
      features: [
        'Recherche avancée de lofts',
        'Réservation en ligne sécurisée',
        'Gestion de vos réservations',
        'Communication avec les propriétaires'
      ]
    },
    {
      id: 'partner',
      title: 'Partenaire',
      subtitle: 'Je veux louer mes biens',
      description: 'Gérez vos propriétés et maximisez vos revenus locatifs',
      icon: '🏢',
      color: '#10B981',
      features: [
        'Gestion de vos propriétés',
        'Calendrier de disponibilité',
        'Suivi des revenus et analytics',
        'Communication avec les clients'
      ]
    },
    {
      id: 'admin',
      title: 'Administration',
      subtitle: 'Gestion de la plateforme',
      description: 'Accès complet à la gestion et supervision de la plateforme',
      icon: '⚙️',
      color: '#EF4444',
      features: [
        'Gestion des utilisateurs',
        'Vérification des partenaires',
        'Résolution des litiges',
        'Rapports et analytics'
      ]
    }
  ]

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfile(profileId)
    
    // Redirect based on profile selection
    switch (profileId) {
      case 'client':
        router.push(`/${locale}/client/search`)
        break
      case 'partner':
        router.push(`/${locale}/partner-demo`)
        break
      case 'admin':
        router.push(`/${locale}/login?role=admin`)
        break
      default:
        break
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            🏛️ Portail Loft Algérie
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'rgba(255,255,255,0.9)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Choisissez votre profil pour accéder à votre espace personnalisé
          </p>
        </div>

        {/* Profile Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {profiles.map((profile) => (
            <div 
              key={profile.id}
              onClick={() => handleProfileSelect(profile.id)}
              style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                border: selectedProfile === profile.id ? `3px solid ${profile.color}` : '3px solid transparent',
                transform: selectedProfile === profile.id ? 'translateY(-5px)' : 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                if (selectedProfile !== profile.id) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)'
                }
              }}
            >
              {/* Profile Header */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                  fontSize: '3rem', 
                  marginBottom: '1rem'
                }}>
                  {profile.icon}
                </div>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: profile.color,
                  marginBottom: '0.5rem'
                }}>
                  {profile.title}
                </h2>
                <p style={{ 
                  fontSize: '1rem', 
                  color: '#6B7280',
                  fontWeight: '500'
                }}>
                  {profile.subtitle}
                </p>
              </div>

              {/* Description */}
              <p style={{ 
                color: '#374151', 
                marginBottom: '1.5rem',
                fontSize: '0.95rem'
              }}>
                {profile.description}
              </p>

              {/* Features */}
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Fonctionnalités principales
                </h4>
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  margin: 0 
                }}>
                  {profile.features.map((feature, index) => (
                    <li key={index} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#6B7280'
                    }}>
                      <div style={{ 
                        width: '0.5rem', 
                        height: '0.5rem', 
                        backgroundColor: profile.color, 
                        borderRadius: '50%' 
                      }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                style={{
                  width: '100%',
                  backgroundColor: profile.color,
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '1.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                Accéder à {profile.title}
              </button>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div style={{ 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          borderRadius: '0.5rem', 
          padding: '1.5rem',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ 
            color: 'white', 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            marginBottom: '1rem' 
          }}>
            ℹ️ Informations
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1rem',
            fontSize: '0.875rem',
            color: 'rgba(255,255,255,0.9)'
          }}>
            <div>
              <strong>🏠 Clients :</strong> Accès direct à la recherche et réservation
            </div>
            <div>
              <strong>🏢 Partenaires :</strong> Connexion requise pour la gestion
            </div>
            <div>
              <strong>⚙️ Administration :</strong> Authentification sécurisée obligatoire
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}