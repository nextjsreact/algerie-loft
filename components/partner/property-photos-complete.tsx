'use client'

import { useState, useRef } from 'react'

interface PropertyPhoto {
  id: string
  url: string
  caption?: string
  is_primary: boolean
  order_index: number
}

interface PropertyPhotosProps {
  propertyId: string
  photos: PropertyPhoto[]
  onPhotosChange: () => void
}

export function PropertyPhotos({ propertyId, photos, onPhotosChange }: PropertyPhotosProps) {
  const [uploading, setUploading] = useState(false)
  const [draggedPhoto, setDraggedPhoto] = useState<string | null>(null)
  const [showCaptionModal, setShowCaptionModal] = useState<string | null>(null)
  const [captionText, setCaptionText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return

    try {
      setUploading(true)
      
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} n'est pas une image valide`)
          continue
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} est trop volumineux (max 5MB)`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('propertyId', propertyId)

        const response = await fetch('/api/partner/properties/photos/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Erreur lors de l'upload de ${file.name}`)
        }
      }

      onPhotosChange()
      
    } catch (error) {
      console.error('Error uploading photos:', error)
      alert('Erreur lors de l\'upload des photos')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const deletePhoto = async (photoId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      return
    }

    try {
      const response = await fetch(`/api/partner/properties/photos/${photoId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      onPhotosChange()
      
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('Erreur lors de la suppression de la photo')
    }
  }

  const setPrimaryPhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/partner/properties/photos/${photoId}/primary`, {
        method: 'PUT'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      onPhotosChange()
      
    } catch (error) {
      console.error('Error setting primary photo:', error)
      alert('Erreur lors de la mise à jour de la photo principale')
    }
  }

  const updatePhotoCaption = async (photoId: string, caption: string) => {
    try {
      const response = await fetch(`/api/partner/properties/photos/${photoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ caption })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      onPhotosChange()
      setShowCaptionModal(null)
      setCaptionText('')
      
    } catch (error) {
      console.error('Error updating caption:', error)
      alert('Erreur lors de la mise à jour de la légende')
    }
  }

  const reorderPhotos = async (photoId: string, newIndex: number) => {
    try {
      const response = await fetch(`/api/partner/properties/photos/${photoId}/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_index: newIndex })
      })

      if (!response.ok) {
        throw new Error('Erreur lors du réordonnancement')
      }

      onPhotosChange()
      
    } catch (error) {
      console.error('Error reordering photos:', error)
      alert('Erreur lors du réordonnancement des photos')
    }
  }

  const handleDragStart = (e: React.DragEvent, photoId: string) => {
    setDraggedPhoto(photoId)
  }

  const handleDragEnd = () => {
    setDraggedPhoto(null)
  }

  const handlePhotoDropZone = (e: React.DragEvent, targetPhotoId: string) => {
    e.preventDefault()
    
    if (draggedPhoto && draggedPhoto !== targetPhotoId) {
      const draggedIndex = photos.findIndex(p => p.id === draggedPhoto)
      const targetIndex = photos.findIndex(p => p.id === targetPhotoId)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        reorderPhotos(draggedPhoto, targetIndex)
      }
    }
  }

  const openCaptionModal = (photo: PropertyPhoto) => {
    setShowCaptionModal(photo.id)
    setCaptionText(photo.caption || '')
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

  const sortedPhotos = [...photos].sort((a, b) => a.order_index - b.order_index)

  return (
    <div>
      {/* Upload Zone */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          📸 Ajouter des Photos
        </h3>
        
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            border: '2px dashed #D1D5DB',
            borderRadius: '0.5rem',
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: uploading ? '#F9FAFB' : '#FAFAFA',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />
          
          {uploading ? (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
              <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Upload en cours...
              </p>
              <p style={{ color: '#6B7280' }}>
                Veuillez patienter pendant l'upload des photos
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
              <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Glissez-déposez vos photos ici
              </p>
              <p style={{ color: '#6B7280', marginBottom: '1rem' }}>
                ou cliquez pour sélectionner des fichiers
              </p>
              <button
                type="button"
                style={{
                  ...buttonStyle,
                  backgroundColor: '#3B82F6',
                  color: 'white'
                }}
              >
                Choisir des photos
              </button>
              <div style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '1rem' }}>
                Formats acceptés: JPG, PNG, WebP • Taille max: 5MB par photo
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photos Grid */}
      {sortedPhotos.length > 0 && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              🖼️ Photos de la Propriété ({sortedPhotos.length})
            </h3>
            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              Glissez-déposez pour réorganiser
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {sortedPhotos.map((photo, index) => (
              <div
                key={photo.id}
                draggable
                onDragStart={(e) => handleDragStart(e, photo.id)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handlePhotoDropZone(e, photo.id)}
                onDragOver={(e) => e.preventDefault()}
                style={{
                  position: 'relative',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  border: photo.is_primary ? '3px solid #10B981' : '1px solid #E5E7EB',
                  cursor: 'move',
                  opacity: draggedPhoto === photo.id ? 0.5 : 1
                }}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || `Photo ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover'
                  }}
                />
                
                {/* Photo Overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.5) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '0.75rem'
                }}>
                  {/* Top Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {photo.is_primary && (
                        <span style={{
                          backgroundColor: '#10B981',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          ⭐ Principale
                        </span>
                      )}
                      <span style={{
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                      }}>
                        #{index + 1}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      style={{
                        backgroundColor: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Bottom Actions */}
                  <div>
                    {photo.caption && (
                      <div style={{
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem'
                      }}>
                        {photo.caption}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!photo.is_primary && (
                        <button
                          onClick={() => setPrimaryPhoto(photo.id)}
                          style={{
                            backgroundColor: '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          ⭐ Principale
                        </button>
                      )}
                      
                      <button
                        onClick={() => openCaptionModal(photo)}
                        style={{
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️ Légende
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {sortedPhotos.length === 0 && (
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📷</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Aucune photo ajoutée
            </h3>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              Ajoutez des photos attrayantes pour présenter votre propriété aux clients
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                ...buttonStyle,
                backgroundColor: '#3B82F6',
                color: 'white'
              }}
            >
              Ajouter la première photo
            </button>
          </div>
        </div>
      )}

      {/* Caption Modal */}
      {showCaptionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              ✏️ Modifier la Légende
            </h3>
            
            <textarea
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              placeholder="Décrivez cette photo..."
              style={{
                width: '100%',
                minHeight: '4rem',
                padding: '0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                marginBottom: '1rem'
              }}
            />
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCaptionModal(null)
                  setCaptionText('')
                }}
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
                onClick={() => updatePhotoCaption(showCaptionModal, captionText)}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#3B82F6',
                  color: 'white'
                }}
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

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
        <ul style={{ color: '#1E40AF', fontSize: '0.875rem', margin: 0, paddingLeft: '1.5rem' }}>
          <li>Utilisez un éclairage naturel et évitez le flash</li>
          <li>Prenez des photos de tous les angles importants</li>
          <li>Assurez-vous que les espaces sont propres et bien rangés</li>
          <li>La première photo sera utilisée comme image principale</li>
          <li>Ajoutez des légendes descriptives pour chaque photo</li>
        </ul>
      </div>
    </div>
  )
}