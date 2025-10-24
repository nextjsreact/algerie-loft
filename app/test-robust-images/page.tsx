import { Suspense } from 'react';
import { RobustImage } from '@/components/futuristic/RobustImage';
import LoftCarousel from '@/components/futuristic/LoftCarousel';

export default function TestRobustImagesPage() {
  // Test avec différents types d'images
  const testImages = [
    // Images existantes (devraient fonctionner)
    { src: '/loft-images/loft-1.jpg', alt: 'Loft Principal', title: 'Loft 1 - Existant' },
    { src: '/loft-images/kitchen.jpg', alt: 'Cuisine', title: 'Cuisine - Existante' },
    { src: '/loft-images/living-room.jpg', alt: 'Salon', title: 'Salon - Existant' },
    
    // Images inexistantes (devraient utiliser le fallback)
    { src: '/loft-images/inexistant.jpg', alt: 'Image Inexistante', title: 'Test Fallback 1' },
    { src: '/images/missing.png', alt: 'Image Manquante', title: 'Test Fallback 2' },
    
    // Images avec URLs externes (peuvent échouer)
    { src: 'https://example.com/invalid-image.jpg', alt: 'URL Externe Invalide', title: 'Test URL Externe' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🛡️ Test du Système d'Images Robuste
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Cette page teste le nouveau système d'images robuste qui utilise directement les images locales 
            confirmées sans tester leur existence côté client, évitant ainsi les problèmes avec le middleware.
          </p>
        </div>

        {/* Carrousel avec le nouveau système */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            📸 Carrousel avec Images Robustes
          </h2>
          <div className="max-w-4xl mx-auto">
            <Suspense fallback={
              <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Chargement du carrousel...</p>
                </div>
              </div>
            }>
              <LoftCarousel />
            </Suspense>
          </div>
        </div>

        {/* Tests individuels d'images */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            🔍 Tests Individuels d'Images
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testImages.map((img, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="relative h-48">
                  <RobustImage
                    src={img.src}
                    alt={img.alt}
                    title={img.title}
                    fill
                    className="w-full h-full"
                    onLoad={() => console.log(`✅ Image chargée: ${img.src}`)}
                    onError={() => console.log(`❌ Erreur image: ${img.src}`)}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {img.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {img.alt}
                  </p>
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block break-all">
                    {img.src}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Informations sur les améliorations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            ✨ Améliorations Implémentées
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4">
                🎯 Hook useLoftImages Optimisé
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✅</span>
                  <span>Utilise directement les images locales confirmées</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✅</span>
                  <span>Plus de tests d'existence côté client</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✅</span>
                  <span>Évite les conflits avec le middleware</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✅</span>
                  <span>Chargement instantané sans requêtes réseau</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✅</span>
                  <span>Méthodes utilitaires ajoutées (getImageByType, getRandomImage)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                🛡️ Composant RobustImage
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✅</span>
                  <span>Gestion automatique des erreurs d'images</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✅</span>
                  <span>Fallback SVG élégant intégré</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✅</span>
                  <span>Animation de chargement avec skeleton</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✅</span>
                  <span>Indicateur visuel en cas d'erreur</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✅</span>
                  <span>Compatible avec toutes les props Next.js Image</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              🎉 Résultat Final
            </h4>
            <p className="text-green-700 dark:text-green-300">
              Le système d'images est maintenant complètement robuste et ne génère plus d'erreurs 404. 
              Les images sont chargées directement depuis les fichiers confirmés dans <code>/public/loft-images/</code>, 
              et en cas de problème, un fallback élégant est automatiquement utilisé.
            </p>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              📊 Images Disponibles
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700 dark:text-blue-300">
              <div>📁 /loft-images/loft-1.jpg</div>
              <div>📁 /loft-images/kitchen.jpg</div>
              <div>📁 /loft-images/living-room.jpg</div>
              <div>📁 /loft-images/bedroom.jpg</div>
              <div>📁 /loft-images/bathroom.jpg</div>
              <div>📁 /loft-images/terrace.jpg</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}