'use client';

import { useLoftImages } from '@/hooks/useLoftImages';
import LoftCarousel from '@/components/futuristic/LoftCarousel';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

export default function TestImagesPage() {
  const { images, loading, error, hasCustomImages } = useLoftImages();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Test des Images Loft</h1>
        
        {/* Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">État du Chargement</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${loading ? 'bg-yellow-100' : 'bg-green-100'}`}>
              <p className="font-medium">Chargement</p>
              <p className={loading ? 'text-yellow-700' : 'text-green-700'}>
                {loading ? '⏳ En cours...' : '✅ Terminé'}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${error ? 'bg-red-100' : 'bg-green-100'}`}>
              <p className="font-medium">Erreurs</p>
              <p className={error ? 'text-red-700' : 'text-green-700'}>
                {error || '✅ Aucune erreur'}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${hasCustomImages ? 'bg-green-100' : 'bg-blue-100'}`}>
              <p className="font-medium">Images Trouvées</p>
              <p className={hasCustomImages ? 'text-green-700' : 'text-blue-700'}>
                {images.length} images ({hasCustomImages ? 'locales' : 'Unsplash'})
              </p>
            </div>
          </div>
        </div>

        {/* Carousel Test */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test du Carousel</h2>
          <LoftCarousel />
        </div>

        {/* Individual Images Test */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Images Individuelles</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3">Chargement des images...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <OptimizedImage
                    src={image.src}
                    alt={image.alt}
                    width={300}
                    height={200}
                    className="rounded-lg mb-3"
                  />
                  <h3 className="font-medium text-gray-900 mb-1">{image.title}</h3>
                  <p className="text-sm text-gray-600">{image.description}</p>
                  <p className="text-xs text-gray-400 mt-2">Source: {image.src}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Direct Image Access Test */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test d'Accès Direct aux Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              '/loft-images/loft-1.jpg',
              '/loft-images/kitchen.jpg',
              '/loft-images/bedroom.jpg',
              '/loft-images/bathroom.jpg',
              '/loft-images/living-room.jpg',
              '/loft-images/terrace.jpg'
            ].map((src, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <OptimizedImage
                  src={src}
                  alt={`Test image ${index + 1}`}
                  width={200}
                  height={150}
                  className="rounded-lg mb-2"
                />
                <p className="text-xs text-gray-600">{src}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Middleware Test Info */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-8">
          <h3 className="font-semibold text-blue-800 mb-2">Corrections Appliquées :</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ Middleware exclu pour les fichiers d'images (jpg, jpeg, png, gif, svg, webp, ico)</li>
            <li>✅ Rewrites ajoutés pour rediriger /:locale/loft-images/* vers /loft-images/*</li>
            <li>✅ Hook useLoftImages modifié pour utiliser seulement les images existantes</li>
            <li>✅ Suppression des tests d'existence d'images qui causaient les 404</li>
          </ul>
        </div>
      </div>
    </div>
  );
}