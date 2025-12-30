import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';

export default function TestMenuSimple() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Test barre de menu standard */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <HeaderLogo />
              <span className="text-gray-700">Menu</span>
            </div>
            <div className="text-sm text-gray-500">
              Hauteur barre: 64px (h-16)
            </div>
          </div>
        </div>
      </nav>

      {/* Test barre plus petite */}
      <nav className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-4">
              <HeaderLogo />
              <span>Menu Compact</span>
            </div>
            <div className="text-sm opacity-75">
              Hauteur barre: 48px (h-12)
            </div>
          </div>
        </div>
      </nav>

      {/* Test barre très petite */}
      <nav className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center space-x-4">
              <HeaderLogo />
              <span className="text-sm">Menu Mini</span>
            </div>
            <div className="text-xs opacity-75">
              Hauteur barre: 40px (h-10)
            </div>
          </div>
        </div>
      </nav>

      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test du Logo dans les Barres de Menu</h1>
        <p className="text-gray-600 mb-4">
          Vérifiez si le logo dépasse ou s'affiche correctement dans chaque barre.
        </p>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-2">Dimensions actuelles du HeaderLogo :</h2>
          <ul className="text-sm text-gray-600">
            <li>• Largeur : 100px</li>
            <li>• Hauteur : 30px</li>
            <li>• Classe CSS : max-h-8 (32px max)</li>
          </ul>
          
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-sm font-medium mb-2">Test direct du logo :</p>
            <HeaderLogo />
          </div>
        </div>
      </div>
    </div>
  );
}