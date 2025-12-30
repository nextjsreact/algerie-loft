import SimplePublicHeader from "../../components/public/SimplePublicHeader";
import SimplePublicFooter from "../../components/public/SimplePublicFooter";
import HeroSection from "../../components/public/HeroSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { CONTACT_INFO } from "../../config/contact-info";

export default function PublicPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SimplePublicHeader />
      
      <main className="flex-1">
        <HeroSection />
        
        {/* Section Services */}
        <section id="services" className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Nos Services
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Une gamme complète de services pour rendre votre séjour inoubliable
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-3xl">🏠</span>
                  </div>
                  <CardTitle>Location de Lofts</CardTitle>
                  <CardDescription>
                    Lofts modernes et équipés pour tous vos besoins
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Espaces entièrement meublés</li>
                    <li>• Équipements haut de gamme</li>
                    <li>• Connexion WiFi haut débit</li>
                    <li>• Service de ménage inclus</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <CardTitle>Séjours d'Affaires</CardTitle>
                  <CardDescription>
                    Solutions adaptées aux professionnels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Espaces de travail dédiés</li>
                    <li>• Salles de réunion disponibles</li>
                    <li>• Services de conciergerie</li>
                    <li>• Facturation entreprise</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-3xl">🌟</span>
                  </div>
                  <CardTitle>Séjours de Loisirs</CardTitle>
                  <CardDescription>
                    Détente et confort pour vos vacances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Emplacements touristiques</li>
                    <li>• Activités et excursions</li>
                    <li>• Services de restauration</li>
                    <li>• Guide touristique local</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section Lofts */}
        <section id="lofts" className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Nos Lofts Premium
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Découvrez notre sélection de lofts exceptionnels
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-4xl">🏢</span>
                  </div>
                  <CardHeader>
                    <CardTitle>Loft Premium {i}</CardTitle>
                    <CardDescription>
                      Espace moderne de 80m² avec vue panoramique
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Surface:</span>
                        <span className="font-medium">80m²</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Capacité:</span>
                        <span className="font-medium">4 personnes</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Prix/nuit:</span>
                        <span className="font-medium text-blue-600">À partir de 15,000 DA</span>
                      </div>
                    </div>
                    <Button className="w-full">
                      Voir les détails
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Section Contact */}
        <section id="contact" className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Contactez-nous
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Une question ? Un projet ? Nous sommes là pour vous accompagner !
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <Card>
                <CardHeader>
                  <CardTitle>Informations de Contact</CardTitle>
                  <CardDescription>
                    Plusieurs moyens de nous joindre
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📞</span>
                    </div>
                    <div>
                      <p className="font-medium">{CONTACT_INFO.phone.display}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Disponible 24/7</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <span className="text-xl">💬</span>
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Réponse rapide garantie</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📧</span>
                    </div>
                    <div>
                      <p className="font-medium">{CONTACT_INFO.email.display}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Support par email</p>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button size="lg" className="w-full" asChild>
                      <a href={CONTACT_INFO.phone.whatsapp} target="_blank" rel="noopener noreferrer">
                        Contacter par WhatsApp
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Horaires d'Ouverture</CardTitle>
                  <CardDescription>
                    Nous sommes disponibles pour vous
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Lundi - Vendredi</span>
                    <span className="text-gray-600 dark:text-gray-400">9h00 - 22h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Samedi - Dimanche</span>
                    <span className="text-gray-600 dark:text-gray-400">9h00 - 22h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Support d'urgence</span>
                    <span className="text-green-600 dark:text-green-400">24h/24 - 7j/7</span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      📍 {CONTACT_INFO.address.fr}
                    </p>
                    <Button variant="outline" className="w-full">
                      Voir sur la carte
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      
      <SimplePublicFooter />
    </div>
  );
}