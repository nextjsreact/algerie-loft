'use client'

import { useState } from 'react'
import { PropertyEditForm } from '@/components/partner/property-edit-form-complete'
import { PropertyPhotos } from '@/components/partner/property-photos-complete'
import { PropertyCalendarSimple } from '@/components/partner/property-calendar-simple'

export default function PropertyManagementDemoPage() {
  const [activeDemo, setActiveDemo] = useState<'edit' | 'photos' | 'calendar'>('edit')

  const mockProperty = {
    id: 'demo-property-123',
    name: 'Loft Moderne Centre-Ville',
    address: '123 Rue de la Paix, 75001 Paris',
    description: 'Magnifique loft rénové dans le centre historique de Paris. Idéal pour un séjour d\'affaires ou touristique.',
    price_per_night: 120,
    status: 'available' as const,
    max_guests: 4,
    bedrooms: 2,
    bathrooms: 1,
    area_sqm: 65,
    amenities: ['WiFi gratuit', 'Cuisine équipée', 'Climatisation', 'Télévision', 'Lave-linge'],
    is_published: true,
    images: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const mockPhotos = [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      caption: 'Vue d\'ensemble du loft',
      is_primary: true,
      order_index: 0
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      caption: 'Cuisine moderne équipée',
      is_primary: false,
      order_index: 1
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
      caption: 'Chambre principale avec lit double',
      is_primary: false,
      order_index: 2
    }
  ]

  const handlePropertySave = async (updates: any) => {
    console.log('Property updates:', updates)
    alert('Propriété mise à jour avec succès ! (Mode démonstration)')
  }

  const handlePhotosChange = () => {
    console.log('Photos changed')
    alert('Photos mises à jour ! (Mode démonstration)')
  }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem'
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
    border: isActive ? 'none' : '1px solid #D1D5DB'
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            🏠 Démonstration - Gestion de Propriété Complète
          </h1>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            Interface complète d'édition, gestion des photos et calendrier
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
                {mockProperty.name} (Démonstration)
              </h2>
              <p style={{ color: '#6B7280', margin: '0.25rem 0 0 0' }}>
                {mockProperty.address} • {mockProperty.price_per_night}€/nuit
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
              Cette page présente les composants complets de gestion de propriété. 
              Les données ne sont pas sauvegardées en mode démonstration.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              onClick={() => setActiveDemo('edit')}
              style={tabStyle(activeDemo === 'edit')}
            >
              ✏️ Formulaire d'Édition
            </button>
            <button
              onClick={() => setActiveDemo('photos')}
              style={tabStyle(activeDemo === 'photos')}
            >
              📸 Gestion des Photos
            </button>
            <button
              onClick={() => setActiveDemo('calendar')}
              style={tabStyle(activeDemo === 'calendar')}
            >
              📅 Calendrier Simple
            </button>
          </div>

          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            {activeDemo === 'edit' && (
              <p>
                Formulaire complet d'édition de propriété avec validation, 
                gestion des équipements et statut de publication.
              </p>
            )}
            {activeDemo === 'photos' && (
              <p>
                Interface de gestion des photos avec upload par glisser-déposer, 
                réorganisation et gestion des légendes.
              </p>
            )}
            {activeDemo === 'calendar' && (
              <p>
                Calendrier simple affichant les réservations avec navigation mensuelle 
                et aperçu des prochaines réservations.
              </p>
            )}
          </div>
        </div>

        {/* Demo Content */}
        {activeDemo === 'edit' && (
          <PropertyEditForm
            property={mockProperty}
            onSave={handlePropertySave}
            onCancel={() => alert('Annulation (Mode démonstration)')}
          />
        )}

        {activeDemo === 'photos' && (
          <PropertyPhotos
            propertyId={mockProperty.id}
            photos={mockPhotos}
            onPhotosChange={handlePhotosChange}
          />
        )}

        {activeDemo === 'calendar' && (
          <PropertyCalendarSimple propertyId={mockProperty.id} />
        )}

        {/* Features Overview */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            🚀 Fonctionnalités Implémentées
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#3B82F6' }}>
                ✏️ Formulaire d'Édition Complet
              </h4>
              <ul style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, paddingLeft: '1.5rem' }}>
                <li>Validation en temps réel des champs</li>
                <li>Gestion des équipements avec sélection multiple</li>
                <li>Configuration du statut et de la publication</li>
                <li>Interface responsive et intuitive</li>
                <li>Sauvegarde avec gestion d'erreurs</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#8B5CF6' }}>
                📸 Gestion des Photos Avancée
              </h4>
              <ul style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, paddingLeft: '1.5rem' }}>
                <li>Upload par glisser-déposer</li>
                <li>Réorganisation par drag & drop</li>
                <li>Gestion des photos principales</li>
                <li>Ajout de légendes descriptives</li>
                <li>Validation des formats et tailles</li>
                <li>Interface de galerie interactive</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#F59E0B' }}>
                📅 Calendrier et Réservations
              </h4>
              <ul style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, paddingLeft: '1.5rem' }}>
                <li>Vue calendrier mensuelle</li>
                <li>Affichage des réservations par statut</li>
                <li>Navigation temporelle intuitive</li>
                <li>Liste des prochaines réservations</li>
                <li>Codes couleur par statut</li>
                <li>Lien vers la gestion avancée</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Integration Info */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            🔗 Intégration dans l'Interface Partenaire
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '0.5rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#059669' }}>
                Pages Créées
              </h4>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#6B7280' }}>
                <div>/partner/properties/[id] - Page principale</div>
                <div>/partner/properties/[id]/availability - Calendrier avancé</div>
                <div>/property-management-demo - Cette démonstration</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '0.5rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#7C3AED' }}>
                Composants Créés
              </h4>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#6B7280' }}>
                <div>PropertyEditForm - Édition complète</div>
                <div>PropertyPhotos - Gestion des photos</div>
                <div>PropertyCalendarSimple - Calendrier basique</div>
                <div>AvailabilityCalendar - Calendrier avancé</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}