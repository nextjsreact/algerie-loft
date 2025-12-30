import FuturisticPublicPage from '@/components/futuristic/FuturisticPublicPage';

export default function TestContrastPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-8">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Page de Test - Améliorations de Contraste</strong><br/>
              Cette page teste les améliorations de contraste appliquées aux composants de la page publique.
              Les corrections incluent :
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
              <li>✅ Texte avec ombres pour meilleur contraste</li>
              <li>✅ Classes CSS adaptatives pour mode sombre/clair</li>
              <li>✅ Couleurs optimisées pour tous les backgrounds</li>
              <li>✅ Contraste amélioré pour les titres et descriptions</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Test avec différentes locales */}
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4 text-center">Version Française</h2>
          <FuturisticPublicPage locale="fr" />
        </div>
        
        <div className="border-t-4 border-gray-300 pt-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Version Arabe (RTL)</h2>
          <FuturisticPublicPage locale="ar" />
        </div>
        
        <div className="border-t-4 border-gray-300 pt-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Version Anglaise</h2>
          <FuturisticPublicPage locale="en" />
        </div>
      </div>
    </div>
  );
}