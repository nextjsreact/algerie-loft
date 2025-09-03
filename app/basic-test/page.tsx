import { BasicUploadTest } from '@/components/lofts/basic-upload-test'
import { requireAuth } from '@/lib/auth'

export default async function BasicTestPage() {
  // Vérifier l'authentification
  await requireAuth()

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🔧 Test Upload Photos - Version Basique</h1>
        <p className="text-gray-600">
          Test simplifié sans complexité pour diagnostiquer rapidement les problèmes d'upload.
        </p>
      </div>
      
      <BasicUploadTest />
      
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
        <h2 className="font-bold mb-3 text-green-900 flex items-center gap-2">
          🎯 Instructions Simples
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-green-800 mb-2">1️⃣ Test de Configuration</h3>
            <p className="text-sm text-green-700">
              Cliquez sur "Test Configuration" pour vérifier l'état de votre base de données et storage.
              Si vous voyez des ❌, suivez les instructions affichées.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-green-800 mb-2">2️⃣ Test d'Upload</h3>
            <p className="text-sm text-green-700">
              Une fois la configuration OK, cliquez sur "Test avec Fichier" et sélectionnez une image.
            </p>
          </div>
          
          <div className="bg-white p-3 rounded border border-green-300">
            <h4 className="font-semibold text-green-800 mb-1">🚨 Problèmes Courants:</h4>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• <strong>Table loft_photos manquante:</strong> Exécutez <code className="bg-green-100 px-1 rounded">supabase db push</code></li>
              <li>• <strong>Bucket loft-photos manquant:</strong> Créez-le dans l'interface Supabase Storage</li>
              <li>• <strong>Base de données non connectée:</strong> Vérifiez vos variables d'environnement</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Une fois tous les tests ✅, l'upload de photos fonctionnera dans l'application principale.
        </p>
      </div>
    </div>
  )
}