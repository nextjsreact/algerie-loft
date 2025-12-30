import { HeaderLogo, CompactLogo } from '@/components/futuristic/AnimatedLogo';

export default function LogoMenuDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Navigation Desktop Standard */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <HeaderLogo />
              <div className="hidden md:flex space-x-6">
                <a href="#" className="text-gray-700 hover:text-blue-600">Accueil</a>
                <a href="#" className="text-gray-700 hover:text-blue-600">Lofts</a>
                <a href="#" className="text-gray-700 hover:text-blue-600">Réservations</a>
                <a href="#" className="text-gray-700 hover:text-blue-600">Contact</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
                Connexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Mobile Compacte */}
      <div className="bg-gray-800 text-white">
        <div className="flex items-center justify-between p-3">
          <CompactLogo />
          <div className="flex items-center space-x-3">
            <span className="text-sm">Menu</span>
            <button className="p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar avec logo compact */}
      <div className="flex">
        <div className="w-64 bg-gray-900 text-white min-h-screen p-4">
          <div className="mb-8">
            <HeaderLogo />
          </div>
          <nav className="space-y-2">
            <a href="#" className="block px-3 py-2 rounded-md bg-gray-800">Dashboard</a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-800">Lofts</a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-800">Clients</a>
            <a href="#" className="block px-3 py-2 rounded-md hover:bg-gray-800">Rapports</a>
          </nav>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Démonstration d'Intégration du Logo
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Comparaison des tailles */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Comparaison des Tailles</h2>
                
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Logo Compact (80x24px)</h3>
                    <div className="flex items-center space-x-4">
                      <CompactLogo />
                      <span className="text-sm text-gray-600">Idéal pour mobile et sidebar</span>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Logo Header (120x36px)</h3>
                    <div className="flex items-center space-x-4">
                      <HeaderLogo />
                      <span className="text-sm text-gray-600">Parfait pour navigation desktop</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommandations d'usage */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Recommandations d'Usage</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h3 className="font-medium">Navigation Desktop</h3>
                      <p className="text-sm text-gray-600">Utilisez HeaderLogo (120x36px) pour les barres de navigation principales</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <h3 className="font-medium">Navigation Mobile</h3>
                      <p className="text-sm text-gray-600">Utilisez CompactLogo (80x24px) pour les écrans étroits</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <h3 className="font-medium">Sidebar Admin</h3>
                      <p className="text-sm text-gray-600">HeaderLogo convient pour les sidebars larges</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <h3 className="font-medium">Responsive</h3>
                      <p className="text-sm text-gray-600">Basculez automatiquement selon la taille d'écran</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Code d'exemple */}
            <div className="mt-8 bg-gray-900 rounded-lg p-6 text-white">
              <h2 className="text-xl font-semibold mb-4">Code d'Exemple</h2>
              <pre className="text-sm overflow-x-auto">
{`// Navigation responsive
import { HeaderLogo, CompactLogo } from '@/components/futuristic/AnimatedLogo';

// Desktop
<HeaderLogo className="hidden md:block" />

// Mobile  
<CompactLogo className="md:hidden" />

// Sidebar
<HeaderLogo className="mb-4" />`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}