'use client'

import { useState, useRef } from 'react'

interface Property {
  id: string
  name: string
  images?: string[]
}

interface PropertyPhotosProps {
  property: Property
  onUpdate: () => void
}

export function PropertyPhotos({ property, onUpdate }: PropertyPhotosProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      setUploading(true)
      setError(null)
      setSuccessMessage(null)

      // Simulate file upload (in real app, upload to storage service)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // For demo, we'll just show success message
      setSuccessMessage(`${files.length} photo(s) ajoutée(s) avec succès !`)
      onUpdate()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeletePhoto = async (photoIndex: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) return

    try {
      setError(null)
      setSuccessMessage(null)

      // Simulate photo deletion
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSuccessMessage('Photo supprimée avec succès !')
      onUpdate()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
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

  // Demo photos (in real app, these would come from property.images)
  const demoPhotos = [
    { id: '1', url: '🏠', title: 'Vue extérieure' },
    { id: '2', url: '🛏️', title: 'Chambre principale' },
    { id: '3', url: '🍳', title: 'Cuisine' },
    { id: '4', url: '🛁', title: 'Salle de bain' }
  ]

  return (
    <div>
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

      {/* Upload Section */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
            📸 Photos de la Propriété
          </h3>
          <button
            onClick={handleFileSelect}
            disabled={uploading}
            style={{
              ...buttonStyle,
              backgroundColor: uploading ? '#9CA3AF' : '#3B82F6',
              color: 'white',
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? '📤 Upload...' : '📤 Ajouter des Photos'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <div style={{ 
          border: '2px dashed #D1D5DB', 
          borderRadius: '0.5rem', 
          padding: '2rem', 
          textAlign: 'center',
          backgroundColor: '#F9FAFB'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
          <p style={{ color: '#6B7280', marginBottom: '1rem' }}>
            Glissez-déposez vos photos ici ou cliquez pour sélectionner
          </p>
          <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>
            Formats acceptés: JPG, PNG, WebP (max 5MB par photo)
          </p>
        </div>
      </div>

      {/* Photos Grid */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          🖼️ Photos Actuelles ({demoPhotos.length})
        </h3>

        {demoPhotos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
            <p style={{ color: '#6B7280', marginBottom: '1rem' }}>
              Aucune photo ajoutée pour le moment
            </p>
            <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>
              Ajoutez des photos attrayantes pour augmenter vos réservations
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {demoPhotos.map((photo, index) => (
              <div
                key={photo.id}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  backgroundColor: '#F9FAFB'
                }}
              >
                {/* Photo Placeholder */}
                <div style={{ 
                  height: '200px', 
                  backgroundColor: '#F3F4F6', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '4rem'
                }}>
                  {photo.url}
                </div>

                {/* Photo Info */}
                <div style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>
                      {photo.title}
                    </h4>
                    {index === 0 && (
                      <span style={{
                        backgroundColor: '#10B981',
                        color: 'white',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        Photo principale
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {index !== 0 && (
                      <button
                        style={{
                          ...buttonStyle,
                          backgroundColor: '#F59E0B',
                          color: 'white',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.75rem',
                          flex: 1
                        }}
                      >
                        ⭐ Principale
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePhoto(index)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: '#EF4444',
                        color: 'white',
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        flex: index === 0 ? 1 : undefined
                      }}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div style={{ 
        backgroundColor: '#EBF8FF', 
        border: '1px solid #93C5FD', 
        borderRadius: '0.5rem', 
        padding: '1rem'
      }}>
        <h4 style={{ color: '#1E40AF', fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          💡 Conseils pour de Meilleures Photos
        </h4>
        <ul style={{ color: '#1E40AF', margin: 0, paddingLeft: '1rem', fontSize: '0.875rem' }}>
          <li>Prenez des photos avec une bonne luminosité naturelle</li>
          <li>Montrez toutes les pièces principales (salon, chambre, cuisine, salle de bain)</li>
          <li>Incluez des vues extérieures et de l'environnement</li>
          <li>Évitez les photos floues ou mal cadrées</li>
          <li>La première photo sera utilisée comme photo principale</li>
        </ul>
      </div>
    </div>
  )
}