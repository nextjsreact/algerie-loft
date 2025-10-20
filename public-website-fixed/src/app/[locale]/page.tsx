import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('HomePage');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white p-4 mb-8">
        <h1 className="text-2xl font-bold">🎉 {t('title')}</h1>
      </header>
      
      <main className="container mx-auto px-4">
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 p-12 text-center rounded-lg mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏠 {t('companyName')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('description')}
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <a 
              href="/contact" 
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
            >
              {t('contactButton')} →
            </a>
            <a 
              href="/portfolio" 
              className="bg-white text-blue-600 px-6 py-3 rounded-md border-2 border-blue-600 hover:bg-blue-50 font-medium"
            >
              ▶ {t('portfolioButton')}
            </a>
          </div>
        </section>

        {/* Services Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            {t('servicesTitle')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-3xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold mb-2">{t('services.management.title')}</h3>
              <p className="text-gray-600">
                {t('services.management.description')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-3xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">{t('services.booking.title')}</h3>
              <p className="text-gray-600">
                {t('services.booking.description')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-3xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold mb-2">{t('services.maintenance.title')}</h3>
              <p className="text-gray-600">
                {t('services.maintenance.description')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">{t('services.consulting.title')}</h3>
              <p className="text-gray-600">
                {t('services.consulting.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gray-100 p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-8 text-gray-900">
            {t('statsTitle')}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-blue-600">150+</div>
              <div className="text-gray-600">{t('stats.clients')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">95%</div>
              <div className="text-gray-600">{t('stats.occupancy')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-600">4.9/5</div>
              <div className="text-gray-600">{t('stats.satisfaction')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">24/7</div>
              <div className="text-gray-600">{t('stats.support')}</div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="mt-12 p-4 bg-gray-100 text-center">
        <p>&copy; 2024 {t('companyName')} - {t('footer')}</p>
      </footer>
    </div>
  );
}