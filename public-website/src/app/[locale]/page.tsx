interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  const content = {
    fr: {
      title: "Gestion Professionnelle de Lofts",
      subtitle: "Services professionnels de gestion de lofts et hébergements en Algérie. Maximisez vos revenus locatifs avec notre expertise.",
      contact: "Nous contacter",
      portfolio: "Voir nos réalisations"
    },
    en: {
      title: "Professional Loft Management",
      subtitle: "Professional loft and accommodation management services in Algeria. Maximize your rental income with our expertise.",
      contact: "Contact us",
      portfolio: "View our work"
    },
    ar: {
      title: "إدارة احترافية للشقق المفروشة",
      subtitle: "خدمات إدارة احترافية للشقق المفروشة والإقامة في الجزائر. اعظم عوائدك الإيجارية مع خبرتنا.",
      contact: "اتصل بنا",
      portfolio: "اطلع على أعمالنا"
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  return (
    <div style={{ padding: '1rem' }}>
      {/* Hero Section */}
      <section style={{ 
        background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', 
        padding: '2rem', 
        textAlign: 'center',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#166534', marginBottom: '1rem' }}>
          🏠 {text.title}
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#15803d', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          {text.subtitle}
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a 
            href={`/${locale}/contact`}
            style={{ 
              backgroundColor: '#16a34a', 
              color: 'white', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '6px', 
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            {text.contact} →
          </a>
          <a 
            href={`/${locale}/portfolio`}
            style={{ 
              backgroundColor: 'white', 
              color: '#16a34a', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '6px', 
              textDecoration: 'none',
              border: '2px solid #16a34a',
              fontWeight: '500'
            }}
          >
            ▶ {text.portfolio}
          </a>
        </div>
      </section>

      {/* Services Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Nos Services
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="text-3xl mb-4">🏢</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Gestion de Propriétés
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Gestion complète de vos biens immobiliers avec suivi personnalisé.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="text-3xl mb-4">📅</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Réservations
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Système de réservation optimisé pour maximiser votre taux d'occupation.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="text-3xl mb-4">🔧</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Maintenance
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Service de maintenance préventive et corrective pour vos propriétés.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Conseil
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Expertise et conseils pour optimiser vos investissements immobiliers.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center transition-colors duration-300">
        <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">
          Nos Résultats
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">150+</div>
            <div className="text-gray-600 dark:text-gray-300">Clients Satisfaits</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">95%</div>
            <div className="text-gray-600 dark:text-gray-300">Taux d'Occupation</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">4.9/5</div>
            <div className="text-gray-600 dark:text-gray-300">Satisfaction</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">24/7</div>
            <div className="text-gray-600 dark:text-gray-300">Support</div>
          </div>
        </div>
      </section>
    </div>
  );
}