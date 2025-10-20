import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
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
  Mail,
  ArrowLeft,
  Target,
  TrendingUp,
  Shield
} from 'lucide-react';

interface ServiceDetailPageProps {
  params: Promise<{
    locale: string;
    service: string;
  }>;
}

const serviceIcons = {
  'propertyManagement': Building,
  'reservations': Calendar,
  'maintenance': Wrench,
  'consulting': Users,
};

const serviceColors = {
  'propertyManagement': 'blue',
  'reservations': 'green',
  'maintenance': 'orange',
  'consulting': 'purple',
};

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { locale, service } = await params;
  const t = useTranslations();

  // Validate service exists
  const validServices = ['propertyManagement', 'reservations', 'maintenance', 'consulting'];
  if (!validServices.includes(service)) {
    notFound();
  }

  const IconComponent = serviceIcons[service as keyof typeof serviceIcons];
  const colorScheme = serviceColors[service as keyof typeof serviceColors];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-200',
        button: 'bg-green-600 hover:bg-green-700'
      },
      orange: {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-200',
        button: 'bg-orange-600 hover:bg-orange-700'
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
        button: 'bg-purple-600 hover:bg-purple-700'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const colors = getColorClasses(colorScheme);

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <section className="bg-gray-50 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Accueil</Link>
            <span>/</span>
            <Link href="/services" className="hover:text-blue-600">Services</Link>
            <span>/</span>
            <span className="text-gray-900">{t(`services.${service}.title`)}</span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className={`${colors.bg} py-20`}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className={`p-4 ${colors.bg} rounded-2xl ${colors.border} border-2`}>
                <IconComponent className={`h-12 w-12 ${colors.text}`} />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t(`services.${service}.title`)}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t(`services.${service}.description`)}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className={`px-8 py-4 text-lg ${colors.button}`}>
                  <Phone className="h-5 w-5 mr-2" />
                  Demander un devis
                </Button>
              </Link>
              
              <Link href="/services">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Retour aux services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Ce qui est inclus
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {(t.raw(`services.${service}.features`) || []).map((feature: string, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className={`h-6 w-6 ${colors.text} mt-0.5 flex-shrink-0`} />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Pourquoi choisir ce service ?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Target className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <CardTitle>Résultats Mesurables</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Suivi des performances avec des KPIs clairs et des rapports détaillés pour mesurer l'impact de nos services.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <CardTitle>Optimisation Continue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Amélioration constante de nos processus et stratégies basée sur l'analyse des données et les retours clients.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  <CardTitle>Sécurité & Fiabilité</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Processus sécurisés et fiables avec une assurance complète pour protéger vos investissements immobiliers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Notre processus
            </h2>
            
            <div className="space-y-8">
              {[
                {
                  step: '1',
                  title: 'Évaluation initiale',
                  description: 'Analyse complète de votre situation et de vos objectifs pour définir la meilleure stratégie.'
                },
                {
                  step: '2',
                  title: 'Proposition personnalisée',
                  description: 'Élaboration d\'un plan d\'action sur mesure avec des objectifs clairs et mesurables.'
                },
                {
                  step: '3',
                  title: 'Mise en œuvre',
                  description: 'Déploiement des solutions avec un suivi régulier et des ajustements si nécessaire.'
                },
                {
                  step: '4',
                  title: 'Suivi et optimisation',
                  description: 'Monitoring continu des performances et optimisation pour maximiser vos résultats.'
                }
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className={`w-12 h-12 ${colors.button} text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0`}>
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-16 ${colors.bg}`}>
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Commencez dès aujourd'hui
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Contactez-nous pour une consultation gratuite et découvrez comment ce service peut transformer votre investissement immobilier.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/contact">
                  <Button size="lg" className={`px-8 py-4 text-lg ${colors.button}`}>
                    <Phone className="h-5 w-5 mr-2" />
                    Consultation gratuite
                  </Button>
                </Link>
                
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                    <Mail className="h-5 w-5 mr-2" />
                    Demander des informations
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Related Services */}
      <section className="py-16 bg-white border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Services complémentaires
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {validServices
                .filter(s => s !== service)
                .slice(0, 3)
                .map((relatedService) => {
                  const RelatedIcon = serviceIcons[relatedService as keyof typeof serviceIcons];
                  return (
                    <Card key={relatedService} className="hover:shadow-lg transition-shadow duration-300">
                      <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                          <div className="p-3 bg-gray-100 rounded-lg">
                            <RelatedIcon className="h-8 w-8 text-gray-600" />
                          </div>
                        </div>
                        <CardTitle className="text-xl">
                          {t(`services.${relatedService}.title`)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-gray-600 mb-4">
                          {t(`services.${relatedService}.description`)}
                        </p>
                        <Link href={`/services/${relatedService}`}>
                          <Button variant="outline" className="w-full">
                            En savoir plus
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}