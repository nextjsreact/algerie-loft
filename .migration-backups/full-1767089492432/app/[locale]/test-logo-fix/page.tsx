import { HeaderLogo, HeroLogo, FooterLogo, CompactLogo } from '@/components/futuristic/AnimatedLogo';

export default function TestLogoFix() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🔧 Test de Correction du Logo
        </h1>
        
        <div className="space-y-8">
          {/* Simulation barre de menu */}
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <HeaderLogo onLoadError={(error) => console.error('Header error:', error)} />
                <span className="text-white text-sm">Navigation Menu</span>
              </div>
              <div className="text-gray-400 text-sm">120x36px - Taille optimisée</div>
            </div>
          </div>

          {/* Simulation barre de menu compacte */}
          <div className="bg-gray-800 border-b border-gray-700 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CompactLogo onLoadError={(error) => console.error('Compact error:', error)} />
                <span className="text-white text-xs">Menu Compact</span>
              </div>
              <div className="text-gray-400 text-xs">80x24px - Version ultra-compacte</div>
            </div>
          </div>

          {/* Header Logo Test */}
          <div className="bg-white/10 rounded-lg p-6">
            <h2 className="text-white font-bold mb-4">Header Logo (Navigation Standard)</h2>
            <div className="flex items-center space-x-4">
              <HeaderLogo onLoadError={(error) => console.error('Header error:', error)} />
              <div className="text-gray-300">
                <div>Dimensions: 120x36px</div>
                <div>Usage: Barre de navigation principale</div>
              </div>
            </div>
          </div>

          {/* Compact Logo Test */}
          <div className="bg-white/10 rounded-lg p-6">
            <h2 className="text-white font-bold mb-4">Compact Logo (Navigation Mobile)</h2>
            <div className="flex items-center space-x-4">
              <CompactLogo onLoadError={(error) => console.error('Compact error:', error)} />
              <div className="text-gray-300">
                <div>Dimensions: 80x24px</div>
                <div>Usage: Navigation mobile ou sidebar</div>
              </div>
            </div>
          </div>

          {/* Hero Logo Test */}
          <div className="bg-white/10 rounded-lg p-6">
            <h2 className="text-white font-bold mb-4">Hero Logo (Page d'accueil)</h2>
            <div className="text-center">
              <HeroLogo onLoadError={(error) => console.error('Hero error:', error)} />
              <div className="text-gray-300 mt-4">
                <div>Dimensions: 350x140px</div>
                <div>Usage: Section hero, landing page</div>
              </div>
            </div>
          </div>

          {/* Footer Logo Test */}
          <div className="bg-white/10 rounded-lg p-6">
            <h2 className="text-white font-bold mb-4">Footer Logo</h2>
            <div className="flex items-center space-x-4">
              <FooterLogo onLoadError={(error) => console.error('Footer error:', error)} />
              <div className="text-gray-300">
                <div>Dimensions: 160x48px</div>
                <div>Usage: Pied de page</div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-6">
            <h3 className="text-blue-200 font-bold mb-4">📋 Instructions</h3>
            <p className="text-blue-100">
              Ouvrez la console du navigateur (F12) pour voir les logs de diagnostic.
              Les logos devraient maintenant se charger correctement sans erreur 404.
            </p>
            <div className="mt-4">
              <p className="text-blue-200 text-sm">
                ✅ Si vous voyez les logos : La correction fonctionne !<br/>
                ❌ Si vous voyez "chargement..." : Vérifiez la console pour les erreurs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}