import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio - Loft Algérie',
  description: 'Découvrez notre portfolio de propriétés gérées avec succès.',
};

const properties = [
  {
    id: '1',
    title: 'Loft Moderne Centre-Ville',
    type: 'Loft',
    location: 'Alger Centre',
    area: 85,
    bedrooms: 2,
    bathrooms: 1,
    price: '120 000 DZD',
    features: ['WiFi', 'Climatisation', 'Parking'],
    status: 'Occupé',
    rating: 4.8,
    reviews: 24
  },
  {
    id: '2',
    title: 'Villa Familiale Hydra',
    type: 'Villa',
    location: 'Hydra',
    area: 250,
    bedrooms: 4,
    bathrooms: 3,
    price: '350 000 DZD',
    features: ['Jardin', 'Piscine', 'Garage'],
    status: 'Disponible',
    rating: 4.9,
    reviews: 18
  },
  {
    id: '3',
    title: 'Studio Étudiant',
    type: 'Studio',
    location: 'Bab Ezzouar',
    area: 35,
    bedrooms: 1,
    bathrooms: 1,
    price: '45 000 DZD',
    features: ['WiFi', 'Meublé', 'Université'],
    status: 'Occupé',
    rating: 4.5,
    reviews: 12
  }
];

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-6">Notre Portfolio</h1>
          <p className="text-xl text-blue-100 mb-8">
            Découvrez les propriétés que nous gérons avec succès
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-700 bg-opacity-50 p-4 rounded-lg">
              <div className="text-2xl font-bold">{properties.length}</div>
              <div className="text-blue-100 text-sm">Propriétés</div>
            </div>
            <div className="bg-blue-700 bg-opacity-50 p-4 rounded-lg">
              <div className="text-2xl font-bold">92%</div>
              <div className="text-blue-100 text-sm">Occupation</div>
            </div>
            <div className="bg-blue-700 bg-opacity-50 p-4 rounded-lg">
              <div className="text-2xl font-bold">4.7★</div>
              <div className="text-blue-100 text-sm">Note</div>
            </div>
            <div className="bg-blue-700 bg-opacity-50 p-4 rounded-lg">
              <div className="text-2xl font-bold">+35%</div>
              <div className="text-blue-100 text-sm">Revenus</div>
            </div>
          </div>
        </div>
      </section>

      {/* Propriétés */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map(property => (
              <div key={property.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                {/* Image placeholder */}
                <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <div className="text-4xl">
                    {property.type === 'Loft' ? '🏢' : 
                     property.type === 'Villa' ? '🏡' : 
                     property.type === 'Studio' ? '🏠' : '🏘️'}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{property.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      property.status === 'Disponible' ? 'bg-green-100 text-green-800' :
                      property.status === 'Occupé' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {property.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-3">📍 {property.location}</p>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
                    <div>🏠 {property.area}m²</div>
                    <div>🛏️ {property.bedrooms} ch.</div>
                    <div>🚿 {property.bathrooms} SDB</div>
                    <div>⭐ {property.rating} ({property.reviews})</div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {property.features.map((feature, index) => (
                      <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-xl font-bold text-blue-600">{property.price}</div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Voir détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Votre propriété pourrait être ici !</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Rejoignez notre portfolio et maximisez vos revenus locatifs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Ajouter ma propriété
            </a>
            <a href="/services" className="bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-blue-500">
              Nos services
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}