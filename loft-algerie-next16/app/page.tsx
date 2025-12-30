import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            🏠 Loft Algérie
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Plateforme de location de lofts - Next.js 16.1
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            ✅ Migration réussie - Toutes les fonctionnalités opérationnelles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🌐 Interface Publique
              </CardTitle>
              <CardDescription>
                Site vitrine avec présentation des lofts et formulaire de contact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Navigation responsive</li>
                  <li>• Section héro avec statistiques</li>
                  <li>• Galerie de lofts</li>
                  <li>• Formulaire de contact WhatsApp</li>
                  <li>• Mode sombre/clair</li>
                </ul>
                <Button asChild className="w-full">
                  <a href="/public">Voir l'interface publique</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💼 Fonctionnalités Métier
              </CardTitle>
              <CardDescription>
                Gestion des lofts et système de réservation avancé
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Liste des lofts avec filtres</li>
                  <li>• Vue grille et tableau</li>
                  <li>• Système de réservation multi-étapes</li>
                  <li>• Calcul automatique des prix</li>
                  <li>• Intégration WhatsApp</li>
                </ul>
                <Button asChild className="w-full">
                  <a href="/business">Voir les fonctionnalités</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👑 Dashboard Admin
              </CardTitle>
              <CardDescription>
                Interface d'administration complète avec analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Statistiques en temps réel</li>
                  <li>• Gestion des lofts et utilisateurs</li>
                  <li>• Alertes et notifications</li>
                  <li>• Rapports financiers</li>
                  <li>• Actions rapides</li>
                </ul>
                <Button asChild className="w-full">
                  <a href="/admin">Accéder au dashboard</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-4">
                🚀 Migration Next.js 16.1 Terminée
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="text-left">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">✅ Fonctionnalités migrées:</h3>
                  <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Composants UI (Button, Card, Input, etc.)</li>
                    <li>• Système d'authentification Supabase</li>
                    <li>• Interface publique responsive</li>
                    <li>• Gestion des lofts avec filtres</li>
                    <li>• Système de réservation avancé</li>
                    <li>• Dashboard administrateur</li>
                  </ul>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🔄 Prochaines étapes:</h3>
                  <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Connexion base de données Supabase</li>
                    <li>• Système d'authentification complet</li>
                    <li>• Gestion des rôles utilisateurs</li>
                    <li>• Intégration paiements</li>
                    <li>• Notifications temps réel</li>
                    <li>• Tests et déploiement</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}