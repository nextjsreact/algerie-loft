import MobileBurgerTest from '@/components/debug/MobileBurgerTest'

export default function TestMobilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Test du Menu Burger Mobile</h1>
          <p className="text-gray-600">
            Testez le menu burger sur mobile pour vous assurer qu'il fonctionne correctement
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Composant de test */}
          <MobileBurgerTest />
          
          {/* Instructions détaillées */}
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">
                🔧 Comment tester sur mobile
              </h2>
              <ol className="space-y-2 text-blue-700">
                <li><strong>1. Ouvrir les outils développeur :</strong> F12 ou clic droit → Inspecter</li>
                <li><strong>2. Activer le mode mobile :</strong> Ctrl+Shift+M ou cliquer sur l'icône mobile</li>
                <li><strong>3. Choisir un appareil :</strong> iPhone, Samsung, etc.</li>
                <li><strong>4. Chercher le menu burger :</strong> 3 barres horizontales (☰) en haut à droite</li>
                <li><strong>5. Tester :</strong> Cliquer pour ouvrir la sidebar</li>
              </ol>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-green-800 mb-4">
                ✅ Ce qui devrait fonctionner
              </h2>
              <ul className="space-y-2 text-green-700">
                <li>• <strong>Menu burger visible</strong> en haut à droite</li>
                <li>• <strong>Clic ouvre la sidebar</strong> depuis la gauche</li>
                <li>• <strong>Navigation complète</strong> dans la sidebar</li>
                <li>• <strong>Fermeture</strong> en cliquant à côté ou sur X</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-yellow-800 mb-4">
                ⚠️ Si ça ne marche pas
              </h2>
              <ul className="space-y-2 text-yellow-700">
                <li>• <strong>Rafraîchir :</strong> Ctrl+F5 pour vider le cache</li>
                <li>• <strong>Console :</strong> Vérifier les erreurs JavaScript</li>
                <li>• <strong>Connexion :</strong> Assurez-vous d'être connecté</li>
                <li>• <strong>Responsive :</strong> Bien être en mode mobile</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📱 Test sur vrai mobile
              </h2>
              <p className="text-gray-700 mb-3">
                Pour tester sur votre téléphone :
              </p>
              <ol className="space-y-1 text-gray-700">
                <li>1. Connectez-vous au même réseau WiFi</li>
                <li>2. Trouvez l'IP de votre PC (ipconfig)</li>
                <li>3. Ouvrez http://[IP]:3000 sur votre téléphone</li>
                <li>4. Testez le menu burger</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}