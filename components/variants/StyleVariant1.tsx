'use client';

import { motion } from 'framer-motion';
import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';
import { ArrowRight, Building2, Users, Award, TrendingUp } from 'lucide-react';

export default function StyleVariant1() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      
      {/* Header Moderne */}
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <HeaderLogo />
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-300 hover:text-white transition-colors font-semibold text-lg">Accueil</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors font-semibold text-lg">Services</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors font-semibold text-lg">Portfolio</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors font-semibold text-lg">Contact</a>
            </nav>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all text-lg font-bold">
              Connexion
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section Élégante */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Contenu Principal */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Loft Algérie
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Excellence Immobilière
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Découvrez nos lofts d'exception dans les plus beaux quartiers d'Algérie. 
                Une expérience unique alliant confort moderne et authenticité locale.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center group">
                  Découvrir nos Lofts
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="border border-white/20 text-white px-8 py-4 rounded-full hover:bg-white/10 transition-all">
                  Voir le Portfolio
                </button>
              </div>
            </motion.div>

            {/* Visuel Moderne */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl p-8 backdrop-blur-sm border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <Building2 className="w-8 h-8 text-blue-400 mb-4" />
                    <h3 className="text-white font-semibold mb-2">50+ Lofts</h3>
                    <p className="text-gray-300 text-sm">Propriétés d'exception</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <Users className="w-8 h-8 text-purple-400 mb-4" />
                    <h3 className="text-white font-semibold mb-2">1000+ Clients</h3>
                    <p className="text-gray-300 text-sm">Satisfaits</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <Award className="w-8 h-8 text-green-400 mb-4" />
                    <h3 className="text-white font-semibold mb-2">5 Étoiles</h3>
                    <p className="text-gray-300 text-sm">Note moyenne</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <TrendingUp className="w-8 h-8 text-yellow-400 mb-4" />
                    <h3 className="text-white font-semibold mb-2">98%</h3>
                    <p className="text-gray-300 text-sm">Taux de satisfaction</p>
                  </div>
                </div>
              </div>
              
              {/* Éléments décoratifs */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full opacity-20 blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-20 blur-xl"></div>
            </motion.div>
          </div>
        </div>

        {/* Particules flottantes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, 20],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </section>

      {/* Section Services */}
      <section className="py-20 px-6 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-6">Nos Services Premium</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Une gamme complète de services pour répondre à tous vos besoins immobiliers
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Location Premium",
                description: "Lofts meublés haut de gamme avec services inclus",
                icon: "🏠"
              },
              {
                title: "Gestion Complète",
                description: "Prise en charge totale de votre propriété",
                icon: "🔧"
              },
              {
                title: "Conseil Expert",
                description: "Accompagnement personnalisé par nos experts",
                icon: "💡"
              }
            ].map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/15 transition-all group"
              >
                <div className="text-4xl mb-6">{service.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-4">{service.title}</h3>
                <p className="text-gray-300 leading-relaxed">{service.description}</p>
                <button className="mt-6 text-blue-400 hover:text-blue-300 transition-all flex items-center group-hover:translate-x-2">
                  En savoir plus <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Moderne */}
      <footer className="bg-black/50 backdrop-blur-lg border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Loft Algérie</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Votre partenaire de confiance pour l'immobilier de prestige en Algérie.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Location</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Vente</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gestion</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Aide</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition-colors">CGU</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-gray-400 text-sm">© 2024 Loft Algérie. Tous droits réservés.</p>
            <HeaderLogo />
          </div>
        </div>
      </footer>
    </div>
  );
}