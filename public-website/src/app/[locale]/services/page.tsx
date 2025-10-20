import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { 
  ServiceCard, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui';
import { 
  Building, 
  Calendar, 
  Wrench, 
  Users, 
  ArrowRight, 
  CheckCircle,
  Star,
  Phone,
  Mail
} from 'lucide-react';

export default function ServicesPage() {
  const t = useTranslations();

  const services = [
    {
      key: 'propertyManagement',
      icon: <Building className="h-8 w-8 text-blue-600" />,
      category: 'Gestion',
      popular: true
    },
    {
      key: 'reservations',
      icon: <Calendar className="h-8 w-8 text-blue-600" />,
      category: 'Réservations',
      popular: true
    },
    {
      key: 'maintenance',
      icon: <Wrench className="h-8 w-8 text-blue-600" />,
      category: 'Maintenance',
      popular: false
    },
    {
      key: 'consulting',
      icon: <Users className="h-8 w-8 text-blue-600" />,
      category: 'Conseil',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t('services.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t('services.subtitle')}
            </p>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Services certifiés</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>Satisfaction garantie</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span>Support dédié</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          {/* Filter tabs (simplified for now) */}
          <div className="flex justify-center mb-12">
            <div className="flex space-x-4 bg-gray-100 rounded-lg p-1">
              <button className="px-4 py-2 bg-white text-blue-600 rounded-md font-medium shadow-sm">
                Tous les services
              </button>
              <button className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium">
                Populaires
              </button>
              <button className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium">
                Gestion
              </button>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
            {services.map((service) => (
              <div key={service.key} className="relative">
                {service.popular && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                      Populaire
                    </span>
                  </div>
                )}
                <ServiceCard
                  serviceKey={service.key}
                  icon={service.icon}
                  href={`/services/${service.key}`}
                />
              </div>
            ))}
          </div>

          {/* Service Comparison */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Pourquoi choisir nos services ?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Expertise Prouvée</h3>
                <p className="text-gray-600">
                  Plus de 5 ans d'expérience dans la gestion immobilière avec des résultats mesurables.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Satisfaction Client</h3>
                <p className="text-gray-600">
                  4.9/5 de satisfaction client avec un support disponible 24/7 pour tous nos services.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Technologie Avancée</h3>
                <p className="text-gray-600">
                  Outils et plateformes modernes pour une gestion optimisée et transparente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-white border-t">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Un processus simple et transparent pour commencer avec nos services
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Consultation',
                description: 'Évaluation gratuite de vos besoins et de votre propriété'
              },
              {
                step: '2',
                title: 'Proposition',
                description: 'Stratégie personnalisée et devis détaillé'
              },
              {
                step: '3',
                title: 'Mise en œuvre',
                description: 'Déploiement des services avec suivi en temps réel'
              },
              {
                step: '4',
                title: 'Optimisation',
                description: 'Amélioration continue basée sur les performances'
              }
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
                
                {index < 3 && (
                  <div className="hidden md:block absolute top-6 left-full w-full">
                    <ArrowRight className="h-6 w-6 text-gray-300 mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Prêt à optimiser vos revenus ?
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Contactez-nous pour une consultation gratuite et découvrez comment nos services peuvent transformer votre investissement immobilier.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/contact">
                  <Button size="lg" className="px-8 py-4 text-lg">
                    <Phone className="h-5 w-5 mr-2" />
                    Consultation gratuite
                  </Button>
                </Link>
                
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                    <Mail className="h-5 w-5 mr-2" />
                    Demander un devis
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