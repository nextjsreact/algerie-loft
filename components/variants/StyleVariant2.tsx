'use client';

import { motion } from 'framer-motion';
import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';
import { Play, Star, MapPin, Phone, Mail } from 'lucide-react';

export default function StyleVariant2() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Header Minimaliste */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <HeaderLogo />
            <nav className="hidden md:flex space-x-12">
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium tracking-wide">ACCUEIL</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium tracking-wide">LOFTS</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium tracking-wide">SERVICES</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium tracking-wide">CONTACT</a>
            </nav>
            <button className="bg-blue-600 text-white px-8 py-3 hover:bg-blue-700 transition-colors font-medium tracking-wide">
              RÉSERVER
            </button>
          </div>
        </div>
      </header>

      {/* Hero Minimaliste */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl lg:text-7xl font-light text-gray-900 mb-8 leading-tight">
                LOFT
                <span className="block font-bold text-blue-600">ALGÉRIE</span>
              </h1>
              <p className="text-xl text-gray-600 mb-12 leading-relaxed font-light">
                L'excellence immobilière redéfinie. Découvrez nos lofts contemporains 
                dans les quartiers les plus prisés d'Algérie.
              </p>
              <div className="flex items-center space-x-8">
                <button className="bg-blue-600 text-white px-10 py-4 hover:bg-blue-700 transition-colors font-medium tracking-wide">
                  EXPLORER
                </button>
                <button className="flex items-center text-gray-700 hover:text-blue-600 transition-colors group">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                    <Play className="w-5 h-5 text-blue-600 ml-1" />
                  </div>
                  <span className="font-medium">Voir la vidéo</span>
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-lg shadow-2xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">150+</div>
                    <div className="text-gray-600 font-medium">Lofts Premium</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">5.0</div>
                    <div className="flex justify-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <div className="text-gray-600 font-medium">Note Client</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
                    <div className="text-gray-600 font-medium">Support</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">10+</div>
                    <div className="text-gray-600 font-medium">Villes</div>
                  </div>
                </div>
              </div>
              
              {/* Éléments décoratifs */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-100 rounded-full opacity-50"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-200 rounded-full opacity-30"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Caractéristiques */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-light text-gray-900 mb-6">POURQUOI NOUS CHOISIR</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
              Une approche unique de l'immobilier de prestige
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "DESIGN CONTEMPORAIN",
                description: "Chaque loft est conçu par des architectes renommés avec une attention particulière aux détails et aux finitions haut de gamme.",
                number: "01"
              },
              {
                title: "EMPLACEMENTS PREMIUM",
                description: "Situés dans les quartiers les plus recherchés, nos lofts offrent un accès privilégié aux commodités urbaines.",
                number: "02"
              },
              {
                title: "SERVICE CONCIERGE",
                description: "Un service personnalisé 24h/24 pour répondre à tous vos besoins et garantir votre confort absolu.",
                number: "03"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="text-center group"
              >
                <div className="text-6xl font-light text-blue-100 mb-6 group-hover:text-blue-200 transition-colors">
                  {feature.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 tracking-wide">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed font-light">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section CTA */}
      <section className="py-24 px-6 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl font-light text-white mb-8">PRÊT À DÉCOUVRIR ?</h2>
            <p className="text-xl text-blue-100 mb-12 font-light">
              Contactez-nous dès aujourd'hui pour une visite personnalisée
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="bg-white text-blue-600 px-10 py-4 hover:bg-gray-100 transition-colors font-medium tracking-wide">
                PLANIFIER UNE VISITE
              </button>
              <button className="border-2 border-white text-white px-10 py-4 hover:bg-white hover:text-blue-600 transition-colors font-medium tracking-wide">
                TÉLÉCHARGER LA BROCHURE
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Élégant */}
      <footer className="bg-gray-900 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-white font-bold text-lg mb-6 tracking-wide">LOFT ALGÉRIE</h3>
              <p className="text-gray-400 leading-relaxed font-light">
                Excellence immobilière et service personnalisé depuis 2020.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6 tracking-wide">SERVICES</h4>
              <ul className="space-y-3 text-gray-400 font-light">
                <li><a href="#" className="hover:text-white transition-colors">Location Premium</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Vente Exclusive</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gestion Complète</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Conseil Expert</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6 tracking-wide">CONTACT</h4>
              <ul className="space-y-3 text-gray-400 font-light">
                <li className="flex items-center">
                  <MapPin className="w-4 h-4 mr-3" />
                  Alger, Algérie
                </li>
                <li className="flex items-center">
                  <Phone className="w-4 h-4 mr-3" />
                  +213 XX XX XX XX
                </li>
                <li className="flex items-center">
                  <Mail className="w-4 h-4 mr-3" />
                  contact@loftalgerie.com
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6 tracking-wide">SUIVEZ-NOUS</h4>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <span className="text-white text-sm">f</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <span className="text-white text-sm">in</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <span className="text-white text-sm">ig</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 font-light">© 2024 Loft Algérie. Tous droits réservés.</p>
            <div className="mt-4">
              <HeaderLogo />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}