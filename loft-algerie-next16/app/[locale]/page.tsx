import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Loft Algérie</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="#" className="text-gray-500 hover:text-gray-900">
                {t('navigation.home')}
              </Link>
              <Link href="#" className="text-gray-500 hover:text-gray-900">
                {t('navigation.lofts')}
              </Link>
              <Link href="#" className="text-gray-500 hover:text-gray-900">
                {t('navigation.dashboard')}
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                {t('navigation.login')}
              </Button>
              <Button>
                {t('navigation.register')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            {t('lofts.title')}
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Découvrez nos lofts exceptionnels en Algérie. Des espaces uniques pour vos séjours d'affaires ou de loisirs.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <Button size="lg" className="w-full sm:w-auto">
              {t('lofts.search')}
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Lofts Premium</CardTitle>
                <CardDescription>
                  Des espaces modernes et élégants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Nos lofts sont soigneusement sélectionnés pour offrir le meilleur confort et style.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Réservation Simple</CardTitle>
                <CardDescription>
                  Processus de réservation en quelques clics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Interface intuitive pour réserver votre loft idéal rapidement et facilement.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Support 24/7</CardTitle>
                <CardDescription>
                  Assistance disponible à tout moment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Notre équipe est là pour vous accompagner avant, pendant et après votre séjour.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              {t('dashboard.stats')}
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">50+</div>
                <div className="text-gray-600">Lofts disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">1000+</div>
                <div className="text-gray-600">Clients satisfaits</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600">5★</div>
                <div className="text-gray-600">Note moyenne</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Loft Algérie</h3>
            <p className="text-gray-400 mb-8">
              Votre partenaire pour des séjours exceptionnels en Algérie
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="#" className="text-gray-400 hover:text-white">
                Contact
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                À propos
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                Conditions
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}