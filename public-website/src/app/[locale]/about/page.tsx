import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui';
import { 
  Target, 
  Heart, 
  Shield, 
  Users, 
  Award, 
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Linkedin,
  Calendar,
  CheckCircle,
  Star,
  Building
} from 'lucide-react';

export default function AboutPage() {
  const t = useTranslations();

  const values = [
    {
      icon: <Target className="h-8 w-8 text-blue-600" />,
      title: 'Excellence',
      description: 'Nous visons l\'excellence dans chaque service que nous offrons, avec un souci du détail et une approche professionnelle.'
    },
    {
      icon: <Heart className="h-8 w-8 text-red-600" />,
      title: 'Passion',
      description: 'Notre passion pour l\'immobilier nous pousse à innover constamment et à dépasser les attentes de nos clients.'
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: 'Confiance',
      description: 'La transparence et l\'intégrité sont au cœur de nos relations avec nos clients et partenaires.'
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: 'Collaboration',
      description: 'Nous travaillons en étroite collaboration avec nos clients pour comprendre leurs besoins et objectifs.'
    }
  ];

  const team = [
    {
      name: 'Ahmed Benali',
      role: 'Directeur Général',
      description: 'Expert en gestion immobilière avec plus de 10 ans d\'expérience dans le secteur algérien.',
      image: '/team/ahmed.jpg',
      linkedin: '#'
    },
    {
      name: 'Sarah Meziane',
      role: 'Directrice des Opérations',
      description: 'Spécialisée dans l\'optimisation des processus et la satisfaction client.',
      image: '/team/sarah.jpg',
      linkedin: '#'
    },
    {
      name: 'Karim Ouali',
      role: 'Responsable Technique',
      description: 'Expert en maintenance et rénovation avec un réseau de partenaires qualifiés.',
      image: '/team/karim.jpg',
      linkedin: '#'
    },
    {
      name: 'Amina Hadj',
      role: 'Responsable Marketing',
      description: 'Spécialisée dans la promotion immobilière et les stratégies digitales.',
      image: '/team/amina.jpg',
      linkedin: '#'
    }
  ];

  const timeline = [
    {
      year: '2019',
      title: 'Fondation',
      description: 'Création de LoftAlgérie avec une vision claire : révolutionner la gestion immobilière en Algérie.'
    },
    {
      year: '2020',
      title: 'Premiers Clients',
      description: 'Acquisition des 20 premiers clients et gestion de 50 propriétés avec des résultats exceptionnels.'
    },
    {
      year: '2021',
      title: 'Expansion',
      description: 'Extension des services et développement d\'une plateforme technologique avancée.'
    },
    {
      year: '2022',
      title: 'Reconnaissance',
      description: 'Prix de la meilleure entreprise de gestion immobilière et 100+ propriétés gérées.'
    },
    {
      year: '2023',
      title: 'Innovation',
      description: 'Lancement de nouveaux services et partenariats stratégiques pour une croissance durable.'
    },
    {
      year: '2024',
      title: 'Leadership',
      description: 'Leader du marché avec 200+ propriétés gérées et une satisfaction client de 4.9/5.'
    }
  ];

  const achievements = [
    {
      icon: <Award className="h-8 w-8 text-yellow-600" />,
      title: 'Prix d\'Excellence 2022',
      description: 'Meilleure entreprise de gestion immobilière en Algérie'
    },
    {
      icon: <Star className="h-8 w-8 text-yellow-600" />,
      title: '4.9/5 Satisfaction',
      description: 'Note moyenne de satisfaction client exceptionnelle'
    },
    {
      icon: <Building className="h-8 w-8 text-blue-600" />,
      title: '200+ Propriétés',
      description: 'Plus de 200 propriétés gérées avec succès'
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      title: '40% d\'Augmentation',
      description: 'Augmentation moyenne des revenus locatifs de nos clients'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              À propos de LoftAlgérie
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Nous sommes une entreprise algérienne spécialisée dans la gestion immobilière, 
              dédiée à maximiser vos revenus locatifs avec professionnalisme et innovation.
            </p>
            
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span>Fondée en 2019</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                <span>Basée à Alger</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span>150+ clients satisfaits</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              <Card className="border-l-4 border-l-blue-600">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center">
                    <Target className="h-6 w-6 text-blue-600 mr-3" />
                    Notre Mission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    Transformer la gestion immobilière en Algérie en offrant des services 
                    innovants, transparents et personnalisés qui maximisent les revenus de 
                    nos clients tout en préservant la valeur de leurs investissements.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-600">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center">
                    <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
                    Notre Vision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    Devenir la référence en matière de gestion immobilière en Algérie, 
                    reconnue pour notre expertise, notre innovation technologique et 
                    notre engagement envers l\'excellence du service client.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Nos Valeurs
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Les principes qui guident notre travail quotidien et nos relations avec nos clients
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        {value.icon}
                      </div>
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Notre Parcours
              </h2>
              <p className="text-lg text-gray-600">
                L\'évolution de LoftAlgérie depuis sa création
              </p>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-200"></div>
              
              <div className="space-y-8">
                {timeline.map((item, index) => (
                  <div key={index} className="relative flex items-start">
                    <div className="flex-shrink-0 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg z-10">
                      {item.year.slice(-2)}
                    </div>
                    <div className="ml-6 flex-1">
                      <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                          <span className="text-sm text-gray-500 font-medium">{item.year}</span>
                        </div>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Notre Équipe
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Des professionnels expérimentés et passionnés, dédiés à votre succès
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-12 w-12 text-gray-400" />
                    </div>
                    <CardTitle className="text-xl">{member.name}</CardTitle>
                    <p className="text-blue-600 font-medium">{member.role}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">{member.description}</p>
                    <a 
                      href={member.linkedin} 
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Linkedin className="h-4 w-4 mr-1" />
                      LinkedIn
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Nos Réalisations
              </h2>
              <p className="text-lg text-gray-600">
                Les résultats qui témoignent de notre expertise et de notre engagement
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {achievements.map((achievement, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        {achievement.icon}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{achievement.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">{achievement.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Rejoignez Notre Communauté
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Découvrez comment notre expertise peut transformer votre investissement immobilier. 
                Contactez-nous pour une consultation personnalisée.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/contact">
                  <Button size="lg" className="px-8 py-4 text-lg">
                    <Phone className="h-5 w-5 mr-2" />
                    Nous contacter
                  </Button>
                </Link>
                
                <Link href="/services">
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                    <Building className="h-5 w-5 mr-2" />
                    Découvrir nos services
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}