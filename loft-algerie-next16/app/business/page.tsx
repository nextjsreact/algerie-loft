import { SimpleLoftsList } from "../../components/lofts/SimpleLoftsList";
import { SimpleBookingForm } from "../../components/reservations/SimpleBookingForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

// Données de test pour les lofts
const sampleLofts = [
  {
    id: "1",
    name: "Loft Premium Centre-ville",
    address: "Rue Didouche Mourad, Alger",
    status: "available" as const,
    price_per_night: 15000,
    rooms: 2,
    owner_name: "Ahmed Benali",
    zone_area_name: "Centre-ville"
  },
  {
    id: "2",
    name: "Loft Moderne Hydra",
    address: "Hydra, Alger",
    status: "occupied" as const,
    price_per_night: 25000,
    rooms: 3,
    owner_name: "Fatima Khelifi",
    zone_area_name: "Hydra"
  },
  {
    id: "3",
    name: "Studio Cosy Bab Ezzouar",
    address: "Bab Ezzouar, Alger",
    status: "available" as const,
    price_per_night: 8000,
    rooms: 1,
    owner_name: "Mohamed Saidi",
    zone_area_name: "Bab Ezzouar"
  },
  {
    id: "4",
    name: "Loft Familial Kouba",
    address: "Kouba, Alger",
    status: "maintenance" as const,
    price_per_night: 18000,
    rooms: 4,
    owner_name: "Amina Boudjema",
    zone_area_name: "Kouba"
  },
  {
    id: "5",
    name: "Penthouse Luxury",
    address: "El Biar, Alger",
    status: "available" as const,
    price_per_night: 35000,
    rooms: 3,
    owner_name: "Karim Meziane",
    zone_area_name: "El Biar"
  }
];

export default function BusinessPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🏢 Fonctionnalités Métier
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Gestion des lofts et système de réservation
          </p>
          
          <div className="flex justify-center gap-4 mb-8">
            <Button asChild>
              <a href="#lofts-section">Voir les Lofts</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="#booking-section">Test Réservation</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/">Retour Dashboard</a>
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🏠</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {sampleLofts.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Lofts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {sampleLofts.filter(l => l.status === 'available').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🔧</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {sampleLofts.filter(l => l.status === 'maintenance').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Maintenance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(sampleLofts.reduce((sum, loft) => sum + loft.price_per_night, 0) / sampleLofts.length / 1000)}K
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Prix moyen/nuit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Lofts */}
        <section id="lofts-section" className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle>🏠 Gestion des Lofts</CardTitle>
              <CardDescription>
                Interface de gestion complète avec recherche et filtres
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleLoftsList lofts={sampleLofts} />
            </CardContent>
          </Card>
        </section>

        {/* Section Réservation */}
        <section id="booking-section" className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle>📅 Système de Réservation</CardTitle>
              <CardDescription>
                Formulaire de réservation avec calcul automatique et envoi WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBookingForm 
                loftName="Loft Premium Centre-ville"
                pricePerNight={15000}
              />
            </CardContent>
          </Card>
        </section>

        {/* Fonctionnalités à venir */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Fonctionnalités à Venir</CardTitle>
              <CardDescription>
                Prochaines étapes de développement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold mb-2">🗄️ Base de Données</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Connexion Supabase pour données réelles
                  </p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold mb-2">👥 Gestion Utilisateurs</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Rôles clients, partenaires, admin
                  </p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold mb-2">💳 Paiements</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Intégration système de paiement
                  </p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold mb-2">📊 Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tableaux de bord et rapports
                  </p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold mb-2">🔔 Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Alertes temps réel
                  </p>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold mb-2">📱 Mobile App</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Application mobile native
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}