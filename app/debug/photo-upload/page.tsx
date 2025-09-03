import { PhotoUploadDebug } from '@/components/lofts/photo-upload-debug'
import { requireAuth } from '@/lib/auth'

export default async function PhotoUploadDebugPage() {
  // Vérifier l'authentification
  await requireAuth()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Debug Upload Photos</h1>
        <p className="text-gray-600">
          Page de diagnostic pour résoudre les problèmes d'upload de photos des lofts.
        </p>
      </div>
      
      <PhotoUploadDebug />
    </div>
  )
}