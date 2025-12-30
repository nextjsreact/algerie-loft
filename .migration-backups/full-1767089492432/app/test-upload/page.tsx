import { SimpleUploadTest } from '@/components/lofts/simple-upload-test'
import { DbStatusChecker } from '@/components/lofts/db-status-checker'
import { requireAuth } from '@/lib/auth'

export default async function TestUploadPage() {
  // Vérifier l'authentification
  await requireAuth()

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Upload Photos - Debug Simple</h1>
        <p className="text-gray-600">
          Page de test simple pour diagnostiquer le problème d'upload de photos.
        </p>
      </div>
      
      {/* Vérificateur de statut de la DB */}
      <DbStatusChecker />
      
      {/* Test d'upload */}
      <SimpleUploadTest />
      
      <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="font-semibold mb-3 text-blue-900">📋 Guide de Résolution</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li><strong>Vérifiez l'état de la configuration</strong> dans la section ci-dessus</li>
          <li><strong>Résolvez les problèmes</strong> selon les recommandations affichées</li>
          <li><strong>Testez l'upload</strong> avec les boutons de test</li>
          <li><strong>Consultez la console</strong> du navigateur (F12) pour les détails</li>
        </ol>
        
        <div className="mt-4 p-3 bg-white rounded border border-blue-300">
          <p className="text-xs text-blue-700">
            <strong>💡 Astuce:</strong> Si la table 'loft_photos' n'existe pas, exécutez la migration avec: 
            <code className="bg-blue-100 px-1 rounded">supabase db push</code>
          </p>
        </div>
      </div>
    </div>
  )
}