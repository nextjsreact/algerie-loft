export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white p-4 mb-8">
        <h1 className="text-2xl font-bold">🎉 LOFT ALGÉRIE - ÇA MARCHE ENFIN!</h1>
      </header>
      
      <main className="container mx-auto px-4">
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 p-12 text-center rounded-lg mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏠 Loft Algérie
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Services professionnels de gestion de lofts et hébergements en Algérie. 
            Maximisez vos revenus locatifs avec notre expertise.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <a 
              href="/contact" 
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
            >
              Nous contacter →
            </a>
            <a 
              href="/portfolio" 
              className="bg-white text-blue-600 px-6 py-3 rounded-md border-2 border-blue-600 hover:bg-blue-50 font-medium"
            >
              ▶ Voir nos réalisations
            </a>
          </div>
        </section>

        {/* Services Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Nos Services
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-3xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold mb-2">Gestion de Propriétés</h3>
              <p className="text-gray-600">
                Gestion complète de vos biens immobiliers avec suivi personnalisé.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-3xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">Réservations</h3>
              <p className="text-gray-600">
                Système de réservation optimisé pour maximiser votre taux d'occupation.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-3xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold mb-2">Maintenance</h3>
              <p className="text-gray-600">
                Service de maintenance préventive et corrective pour vos propriétés.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">Conseil</h3>
              <p className="text-gray-600">
                Expertise et conseils pour optimiser vos investissements immobiliers.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gray-100 p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-8 text-gray-900">
            Nos Résultats
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-blue-600">150+</div>
              <div className="text-gray-600">Clients Satisfaits</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">95%</div>
              <div className="text-gray-600">Taux d'Occupation</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-600">4.9/5</div>
              <div className="text-gray-600">Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="mt-12 p-4 bg-gray-100 text-center">
        <p>&copy; 2024 Loft Algérie - Site Web Fonctionnel!</p>
      </footer>
    </div>
  );
}