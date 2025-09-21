'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import Image from 'next/image'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface LoftPhoto {
  id: string
  file_name: string
  file_size: number
  mime_type: string
  url: string
  created_at: string
  uploader?: {
    full_name: string
    email: string
  }
}

interface LoftPhotoGalleryProps {
  loftId: string
  loftName?: string
}

export function LoftPhotoGallery({ loftId, loftName }: LoftPhotoGalleryProps) {
  const t = useTranslations('lofts')
  const tCommon = useTranslations('common')
  const [photos, setPhotos] = useState<LoftPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null)

  useEffect(() => {
    loadPhotos()
  }, [loftId])

  const loadPhotos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/lofts/${loftId}/photos`)
      
      if (response.ok) {
        const data = await response.json()
        setPhotos(data)
      } else {
        console.error('Erreur chargement photos')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(t('photos.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const downloadPhoto = async (photo: LoftPhoto) => {
    try {
      const response = await fetch(photo.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = photo.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success(t('photos.photoDownloaded'))
    } catch (error) {
      console.error('Erreur téléchargement:', error)
      toast.error('Erreur lors du téléchargement')
    }
  }

  const nextPhoto = () => {
    if (selectedPhoto !== null && selectedPhoto < photos.length - 1) {
      setSelectedPhoto(selectedPhoto + 1)
    }
  }

  const prevPhoto = () => {
    if (selectedPhoto !== null && selectedPhoto > 0) {
      setSelectedPhoto(selectedPhoto - 1)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-muted rounded-full">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium mb-2">{t('photos.noPhotos')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('photos.noPhotosDescription')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Photo principale */}
      {photos.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-video">
              <Image
                src={photos[0].url}
                alt={`${loftName} - ${t('photos.mainPhoto')}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
              
              {/* Overlay avec actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                <div className="absolute bottom-4 right-4 flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedPhoto(0)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {tCommon('view')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl w-full p-0">
                        <VisuallyHidden>
                          <DialogTitle>{t('photos.photoViewer')}</DialogTitle>
                        </VisuallyHidden>
                        <PhotoViewer 
                          photos={photos}
                          selectedIndex={selectedPhoto || 0}
                          onClose={() => setSelectedPhoto(null)}
                          onNext={nextPhoto}
                          onPrev={prevPhoto}
                          onDownload={downloadPhoto}
                          t={t}
                        />
                      </DialogContent>
                    </Dialog>
                    
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => downloadPhoto(photos[0])}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Galerie de miniatures */}
      {photos.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {photos.slice(1).map((photo, index) => (
            <Dialog key={photo.id}>
              <DialogTrigger asChild>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                  onClick={() => setSelectedPhoto(index + 1)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square relative">
                      <Image
                        src={photo.url}
                        alt={photo.file_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                      />
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-full p-0">
                <VisuallyHidden>
                  <DialogTitle>{t('photos.photoGallery')}</DialogTitle>
                </VisuallyHidden>
                <PhotoViewer 
                  photos={photos}
                  selectedIndex={selectedPhoto || 0}
                  onClose={() => setSelectedPhoto(null)}
                  onNext={nextPhoto}
                  onPrev={prevPhoto}
                  onDownload={downloadPhoto}
                  t={t}
                />
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}

      {/* Compteur de photos */}
      <div className="text-center text-sm text-muted-foreground">
        {t('photos.photosAvailable', { count: photos.length })}
      </div>
    </div>
  )
}

// Composant pour la visionneuse de photos
function PhotoViewer({ 
  photos, 
  selectedIndex, 
  onClose, 
  onNext, 
  onPrev, 
  onDownload,
  t
}: {
  photos: LoftPhoto[]
  selectedIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  onDownload: (photo: LoftPhoto) => void
  t: (key: string, options?: any) => string
}) {
  const photo = photos[selectedIndex]

  if (!photo) return null

  return (
    <div className="relative w-full h-[80vh] bg-black">
      {/* Image */}
      <div className="relative w-full h-full">
        <Image
          src={photo.url}
          alt={photo.file_name}
          fill
          className="object-contain"
          sizes="100vw"
        />
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button 
          size="sm" 
          variant="secondary"
          onClick={() => onDownload(photo)}
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          variant="secondary"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      {photos.length > 1 && (
        <>
          {selectedIndex > 0 && (
            <Button
              size="sm"
              variant="secondary"
              className="absolute left-4 top-1/2 transform -translate-y-1/2"
              onClick={onPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          {selectedIndex < photos.length - 1 && (
            <Button
              size="sm"
              variant="secondary"
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
              onClick={onNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </>
      )}

      {/* Info */}
      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-2 rounded">
        <div className="text-sm">
          {selectedIndex + 1} / {photos.length}
        </div>
      </div>
    </div>
  )
}