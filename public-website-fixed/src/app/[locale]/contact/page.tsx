import { useTranslations } from 'next-intl';
import { ContactForm } from '@/components/forms/contact-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact - Loft Algérie',
  description: 'Contactez-nous pour vos projets de gestion immobilière en Algérie. Devis gratuit et réponse rapide.',
  keywords: ['contact loft algérie', 'devis gestion propriété', 'consultation immobilière'],
};

export default function ContactPage() {
  const t = useTranslations('contact');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Contactez-nous
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Prêt à optimiser vos revenus locatifs ? Parlons de votre projet !
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-lg">
              <div className="flex items-center bg-blue-700 bg-opacity-50 px-4 py-2 rounded-lg">
                <span className="mr-2">📞</span>
                <span>Réponse sous 24h</span>
              </div>
              <div className="flex items-center bg-blue-700 bg-opacity-50 px-4 py-2 rounded-lg">
                <span className="mr-2">💬</span>
                <span>Consultation gratuite</span>
              </div>
              <div className="flex items-center bg-blue-700 bg-opacity-50 px-4 py-2 rounded-lg">
                <span className="mr-2">🎯</span>
                <span>Solutions sur mesure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Téléphone */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📞</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Téléphone</h3>
              <p className="text-gray-600 mb-4">Appelez-nous directement</p>
              <a 
                href="tel:+213123456789" 
                className="text-blue-600 hover:text-blue-800 font-semibold text-lg"
              >
                +213 1 23 45 67 89
              </a>
              <p className="text-sm text-gray-500 mt-2">
                Lun-Ven: 9h-18h<br />
                Sam: 9h-13h
              </p>
            </div>

            {/* Email */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✉️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600 mb-4">Écrivez-nous</p>
              <a 
                href="mailto:contact@loft-algerie.com" 
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                contact@loft-algerie.com
              </a>
              <p className="text-sm text-gray-500 mt-2">
                Réponse sous 24h<br />
                7j/7
              </p>
            </div>

            {/* Bureau */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Bureau</h3>
              <p className="text-gray-600 mb-4">Visitez-nous</p>
              <address className="text-gray-700 not-italic">
                123 Rue Didouche Mourad<br />
                Alger Centre, 16000<br />
                Algérie
              </address>
              <p className="text-sm text-gray-500 mt-2">
                Sur rendez-vous<br />
                uniquement
              </p>
            </div>
          </div>

          {/* Formulaire de contact */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <ContactForm variant="default" />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Questions Fréquentes
            </h2>
            
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Combien coûtent vos services de gestion ?
                </h3>
                <p className="text-gray-600">
                  Nos tarifs varient selon le type de propriété et les services choisis. 
                  Nous proposons une consultation gratuite pour établir un devis personnalisé 
                  adapté à vos besoins et votre budget.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Dans quelles villes intervenez-vous ?
                </h3>
                <p className="text-gray-600">
                  Nous intervenons principalement à Alger et sa région. Pour les autres villes, 
                  contactez-nous pour étudier la faisabilité selon votre projet.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Quel est le délai pour commencer la gestion ?
                </h3>
                <p className="text-gray-600">
                  Après signature du contrat, nous pouvons commencer la gestion de votre propriété 
                  sous 7 à 14 jours, le temps de mettre en place tous les outils nécessaires.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Proposez-vous un contrat d'essai ?
                </h3>
                <p className="text-gray-600">
                  Oui, nous proposons une période d'essai de 3 mois pour que vous puissiez 
                  évaluer la qualité de nos services sans engagement à long terme.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Rejoignez plus de 150 propriétaires qui nous font confiance pour 
            maximiser leurs revenus locatifs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+213123456789"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              📞 Appelez maintenant
            </a>
            <a 
              href="#contact-form"
              className="bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-blue-500"
            >
              ✉️ Envoyer un message
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}