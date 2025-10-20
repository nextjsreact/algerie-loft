import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À Propos - Loft Algérie',
  description: 'Découvrez l\'équipe Loft Algérie, notre expertise et notre mission dans la gestion professionnelle de propriétés.',
};

const teamMembers = [
  {
    name: 'Ahmed Benali',
    role: 'Directeur Général',
    experience: '15 ans d\'expérience',
    description: 'Expert en gestion immobilière et investissement locatif.',
    image: '👨‍💼'
  },
  {
    name: 'Sarah Meziane',
    role: 'Responsable Opérations',
    experience: '10 ans d\'expérience',
    description: 'Spécialiste en optimisation des revenus locatifs.',
    image: '👩‍💼'
  },
  {
    name: 'Karim Ouali',
    role: 'Chef de Projet',
    experience: '8 ans d\'expérience',
    description: 'Expert en maintenance et relation client.',
    image: '👨‍🔧'
  }
];

const values = [
  {
    icon: '🎯',
    title: 'Excellence',
    description: 'Nous visons l\'excellence dans chaque service pour maximiser vos revenus.'
  },
  {
    icon: '🤝',
    title: 'Transparence',
    description: 'Communication claire et rapports détaillés sur la gestion de vos biens.'
  },
  {
    icon: '⚡',
    title: 'Réactivité',
    description: 'Réponse rapide à vos demandes et gestion proactive des situations.'
  },
  {
    icon: '🔒',
    title: 'Confiance',
    description: 'Relation de confiance basée sur des résultats concrets et mesurables.'
  }
];

const milestones = [
  {
    year: '2019',
    title: 'Création de Loft Algérie',
    description: 'Lancement avec 5 propriétés gérées'
  },
  {
    year: '2020',
    title: 'Expansion des services',
    description: '50 propriétés et équipe de 10 personnes'
  },
  {
    year: '2022',
    title: 'Digitalisation complète',
    description: 'Plateforme de gestion en ligne et 100 propriétés'
  },
  {
    year: '2024',
    title: 'Leader du marché',
    description: '150+ propriétés et expansion régionale'
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              À Propos de Loft Algérie
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Votre partenaire de confiance pour la gestion immobilière depuis 2019
            </p>
            <div className="bg-blue-700 bg-opacity-50 p-6 rounded-lg inline-block">
              <div className="text-3xl font-bold mb-2">5 ans d\'expertise</div>
              <div className="text-blue-100">Au service de vos investissements</div>
            </div>
          </div>
        </div>
      </section>

      {/* Notre Mission */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre Mission</h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Chez Loft Algérie, nous transformons la gestion immobilière en une expérience 
                simple et rentable. Notre mission est de maximiser vos revenus locatifs tout 
                en préservant la valeur de vos biens, grâce à une approche professionnelle 
                et des technologies innovantes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Pourquoi nous choisir ?</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <div>
                      <strong>Expertise locale :</strong> Connaissance approfondie du marché algérien
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <div>
                      <strong>Technologie avancée :</strong> Plateforme de gestion digitale complète
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <div>
                      <strong>Résultats prouvés :</strong> +40% de revenus en moyenne pour nos clients
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <div>
                      <strong>Service 24/7 :</strong> Support client disponible en permanence
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    Leader en Gestion Immobilière
                  </h4>
                  <p className="text-gray-600">
                    Reconnu pour notre excellence et notre innovation dans le secteur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nos Valeurs */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Nos Valeurs</h2>
              <p className="text-xl text-gray-600">
                Les principes qui guident notre action au quotidien
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow">
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notre Équipe */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre Équipe</h2>
              <p className="text-xl text-gray-600">
                Des professionnels passionnés à votre service
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow">
                  <div className="text-6xl mb-4">{member.image}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <div className="text-blue-600 font-semibold mb-2">{member.role}</div>
                  <div className="text-sm text-gray-500 mb-4">{member.experience}</div>
                  <p className="text-gray-600">{member.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notre Histoire */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre Histoire</h2>
              <p className="text-xl text-gray-600">
                5 années de croissance et d\'innovation
              </p>
            </div>

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start">
                  <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-sm mr-6 flex-shrink-0">
                    {milestone.year}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12">Nos Résultats en Chiffres</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="bg-blue-700 bg-opacity-50 p-6 rounded-lg">
                <div className="text-3xl font-bold mb-2">150+</div>
                <div className="text-blue-100">Propriétés gérées</div>
              </div>
              <div className="bg-blue-700 bg-opacity-50 p-6 rounded-lg">
                <div className="text-3xl font-bold mb-2">95%</div>
                <div className="text-blue-100">Taux d\'occupation</div>
              </div>
              <div className="bg-blue-700 bg-opacity-50 p-6 rounded-lg">
                <div className="text-3xl font-bold mb-2">4.9/5</div>
                <div className="text-blue-100">Satisfaction client</div>
              </div>
              <div className="bg-blue-700 bg-opacity-50 p-6 rounded-lg">
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="text-blue-100">Support disponible</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Prêt à nous faire confiance ?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Rejoignez les 150+ propriétaires qui ont choisi Loft Algérie 
              pour maximiser leurs revenus immobiliers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/contact"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Nous contacter
              </a>
              <a 
                href="/portfolio"
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Voir notre portfolio
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}