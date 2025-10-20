import { useTranslations } from 'next-intl';
import { ContactForm } from '@/components/forms/contact-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nos Services - Loft Algérie',
  description: 'Services complets de gestion immobilière en Algérie : gestion locative, maintenance, réservations et conseil en investissement.',
  keywords: ['gestion immobilière algérie', 'services location', 'maintenance propriété', 'conseil investissement'],
};

export default function ServicesPage() {
  const t = useTranslations('services');

  const services = [
    {
      id: 'gestion-proprietes',
      icon: '🏢',
      title: 'Gestion de Propriétés',
      subtitle: 'Gestion complète et professionnelle',
      description: 'Confiez-nous la gestion intégrale de vos biens immobiliers. Nous nous occupons de tout : location, maintenance, comptabilité et relation locataires.',
      features: [
        'Recherche et sélection de locataires qualifiés',
        'Rédaction et gestion des contrats de bail',
        'Encaissement des loyers et charges',
        'Suivi comptable et fiscal détaillé',
        'Gestion des états des lieux',
        'Relation locataires 24/7',
        'Rapports mensuels détaillés',
        'Optimisation des revenus locatifs'
      ],
      pricing: 'À partir de 8% des revenus locatifs',
      popular: true
    },
    {
      id: 'reservations',
      icon: '📅',
      title: 'Gestion des Réservations',
      subtitle: 'Maximisez votre taux d\'occupation',
      description: 'Système intelligent de gestion des réservations pour optimiser vos revenus. Calendrier unifié, tarification dynamique et gestion multi-plateformes.',
      features: [
        'Calendrier unifié toutes plateformes',
        'Tarification dynamique intelligente',
        'Gestion Airbnb, Booking.com, etc.',
        'Check-in/check-out automatisé',
        'Communication automatique avec les hôtes',
        'Nettoyage et préparation coordonnés',
        'Analytics et reporting avancés',
        'Support client multilingue'
      ],
      pricing: 'À partir de 12% des revenus de réservation',
      popular: false
    },
    {
      id: 'maintenance',
      icon: '🔧',
      title: 'Maintenance & Entretien',
      subtitle: 'Préservez la valeur de vos biens',
      description: 'Service complet de maintenance préventive et corrective. Réseau de partenaires qualifiés pour tous types d\'interventions.',
      features: [
        'Maintenance préventive programmée',
        'Interventions d\'urgence 24/7',
        'Réseau d\'artisans certifiés',
        'Devis transparents et compétitifs',
        'Suivi photo des interventions',
        'Garantie sur tous les travaux',
        'Planification intelligente',
        'Facturation directe propriétaire'
      ],
      pricing: 'Tarifs négociés -20% vs marché',
      popular: false
    },
    {
      id: 'conseil',
      icon: '👥',
      title: 'Conseil & Expertise',
      subtitle: 'Optimisez vos investissements',
      description: 'Accompagnement personnalisé pour maximiser votre retour sur investissement. Analyse de marché, stratégie d\'acquisition et optimisation fiscale.',
      features: [
        'Analyse de marché approfondie',
        'Stratégie d\'investissement personnalisée',
        'Recherche de biens rentables',
        'Négociation d\'achat',
        'Optimisation fiscale',
        'Formation propriétaire-bailleur',
        'Veille réglementaire',
        'Accompagnement long terme'
      ],
      pricing: 'Consultation 150€/h - Forfaits disponibles',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Nos Services
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Solutions complètes pour maximiser vos revenus immobiliers
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-blue-700 bg-opacity-50 p-6 rounded-lg">
                <div className="text-3xl mb-2">150+</div>
                <div className="text-blue-100">Propriétés gérées</div>
              </div>
              <div className="bg-blue-700 bg-opacity-50 p-6 rounded-lg">
                <div className="text-3xl mb-2">95%</div>
                <div className="text-blue-100">Taux d'occupation</div>
              </div>
              <div className="bg-blue-700 bg-opacity-50 p-6 rounded-lg">
                <div className="text-3xl mb-2">+40%</div>
                <div className="text-blue-100">Revenus en moyenne</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services détaillés */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="space-y-20">
            {services.map((service, index) => (
              <div key={service.id} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}>
                {/* Contenu */}
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <span className="text-4xl mr-4">{service.icon}</span>
                    {service.popular && (
                      <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                        ⭐ Plus populaire
                      </span>
                    )}
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {service.title}
                  </h2>
                  
                  <p className="text-xl text-blue-600 font-semibold mb-4">
                    {service.subtitle}
                  </p>
                  
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    {service.description}
                  </p>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Ce qui est inclus :
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start">
                          <span className="text-green-500 mr-2 mt-1">✓</span>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <div className="text-sm text-blue-600 font-semibold">TARIFICATION</div>
                    <div className="text-lg font-bold text-blue-800">{service.pricing}</div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a 
                      href={`/contact?service=${service.id}`}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                    >
                      Demander un devis
                    </a>
                    <a 
                      href="tel:+213123456789"
                      className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center"
                    >
                      Appeler maintenant
                    </a>
                  </div>
                </div>

                {/* Image/Illustration */}
                <div className="flex-1">
                  <div className="bg-white p-8 rounded-xl shadow-lg">
                    <div className="text-center">
                      <div className="text-8xl mb-4">{service.icon}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {service.title}
                      </h3>
                      <p className="text-gray-600">
                        Service professionnel et personnalisé
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Processus de travail */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Comment nous travaillons
            </h2>
            <p className="text-xl text-gray-600">
              Un processus simple et transparent pour commencer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📞</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Contact</h3>
              <p className="text-gray-600">
                Appelez-nous ou remplissez notre formulaire pour une première consultation gratuite.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Analyse</h3>
              <p className="text-gray-600">
                Nous analysons votre propriété et vos objectifs pour proposer la meilleure stratégie.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Proposition</h3>
              <p className="text-gray-600">
                Nous vous présentons un plan détaillé avec tarification transparente.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Lancement</h3>
              <p className="text-gray-600">
                Mise en place rapide et début de la gestion sous 7 jours maximum.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Ce que disent nos clients
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold text-blue-600">AB</span>
                </div>
                <div>
                  <div className="font-semibold">Ahmed Benali</div>
                  <div className="text-sm text-gray-500">Propriétaire de 3 lofts</div>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Mes revenus ont augmenté de 40% en un an. L'équipe est professionnelle et réactive. Je recommande vivement !"
              </p>
              <div className="flex text-yellow-400">
                ⭐⭐⭐⭐⭐
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold text-green-600">SM</span>
                </div>
                <div>
                  <div className="font-semibold">Sarah Meziane</div>
                  <div className="text-sm text-gray-500">Investisseuse immobilière</div>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Enfin une équipe qui gère mes propriétés comme si c'étaient les leurs. Transparence totale et résultats au rendez-vous."
              </p>
              <div className="flex text-yellow-400">
                ⭐⭐⭐⭐⭐
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold text-yellow-600">KO</span>
                </div>
                <div>
                  <div className="font-semibold">Karim Ouali</div>
                  <div className="text-sm text-gray-500">Propriétaire Airbnb</div>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Plus de stress avec la gestion ! Tout est automatisé et optimisé. Je peux enfin me concentrer sur mes autres projets."
              </p>
              <div className="flex text-yellow-400">
                ⭐⭐⭐⭐⭐
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à maximiser vos revenus ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Rejoignez plus de 150 propriétaires qui nous font confiance. 
            Consultation gratuite et devis personnalisé sous 24h.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Demander un devis gratuit
            </a>
            <a 
              href="tel:+213123456789"
              className="bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-blue-500"
            >
              📞 +213 1 23 45 67 89
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}