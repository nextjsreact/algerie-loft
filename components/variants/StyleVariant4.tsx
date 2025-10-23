'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';
import { Sun, Moon, ArrowRight, Star, MapPin, Calendar, Users } from 'lucide-react';

export default function StyleVariant4() {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900'
    }`}>
      
      {/* Header avec Toggle */}
      <header className={`backdrop-blur-lg border-b transition-all duration-500 ${
        isDark 
          ? 'bg-gray-900/50 border-gray-700' 
          : 'bg-white/70 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <HeaderLogo />
            <nav className="hidden md:flex space-x-8">
              {['Accueil', 'Lofts', 'Services', 'Contact'].map((item) => (
                <a 
                  key={item}
                  href="#" 
                  className={`font-medium transition-colors ${
                    isDark 
                      ? 'text-gray-300 hover:text-white' 
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  {item}
                </a>
              ))}
            </nav>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-full transition-all duration-300 ${
                  isDark 
                    ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className={`px-6 py-3 rounded-full font-medium transition-all ${
                isDark 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
              }`}>
                Réserver
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Adaptatif */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className={`text-6xl font-bold mb-6 leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Loft Algérie
                <span className={`block text-transparent bg-clip-text ${
                  isDark 
                    ? 'bg-gradient-to-r from-purple-400 to-pink-400' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600'
                }`}>
                  Expérience Premium
                </span>
              </h1>
              <p className={`text-xl mb-8 leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Découvrez l'art de vivre dans nos lofts d'exception. 
                Chaque espace est conçu pour offrir le parfait équilibre entre luxe moderne et confort authentique.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className={`px-8 py-4 rounded-full font-medium transition-all flex items-center group ${
                  isDark 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                }`}>
                  Explorer nos Lofts
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className={`px-8 py-4 rounded-full font-medium transition-all border-2 ${
                  isDark 
                    ? 'border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-gray-900' 
                    : 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                }`}>
                  Planifier une Visite
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className={`rounded-3xl p-8 backdrop-blur-sm border transition-all duration-500 ${
                isDark 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-white/70 border-gray-200'
              }`}>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: Star, value: '4.9/5', label: 'Satisfaction Client' },
                    { icon: MapPin, value: '25+', label: 'Emplacements Premium' },
                    { icon: Calendar, value: '2020', label: 'Depuis' },
                    { icon: Users, value: '500+', label: 'Clients Satisfaits' }
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                      className={`text-center p-4 rounded-2xl transition-all duration-500 ${
                        isDark 
                          ? 'bg-gray-700/50 hover:bg-gray-700' 
                          : 'bg-white/50 hover:bg-white'
                      }`}
                    >
                      <stat.icon className={`w-8 h-8 mx-auto mb-3 ${
                        isDark ? 'text-purple-400' : 'text-indigo-600'
                      }`} />
                      <div className={`text-2xl font-bold mb-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {stat.value}
                      </div>
                      <div className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Éléments décoratifs animés */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${
                isDark ? 'bg-purple-400/20' : 'bg-indigo-400/20'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, 20],
                opacity: [0.2, 0.8, 0.2],
                scale: [0.5, 1.5, 0.5],
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
      <section className={`py-20 px-6 transition-all duration-500 ${
        isDark ? 'bg-gray-800/30' : 'bg-white/50'
      }`}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className={`text-4xl font-bold mb-6 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Services d'Excellence
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Une gamme complète de services premium pour une expérience immobilière sans égal
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Lofts de Luxe",
                description: "Espaces d'exception avec finitions haut de gamme et équipements modernes",
                emoji: "🏢"
              },
              {
                title: "Conciergerie 24/7",
                description: "Service personnalisé disponible à tout moment pour votre confort",
                emoji: "🛎️"
              },
              {
                title: "Gestion Complète",
                description: "Prise en charge totale de votre propriété par nos experts",
                emoji: "⚙️"
              }
            ].map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`p-8 rounded-2xl backdrop-blur-sm border transition-all duration-500 group hover:scale-105 ${
                  isDark 
                    ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' 
                    : 'bg-white/70 border-gray-200 hover:bg-white'
                }`}
              >
                <div className="text-5xl mb-6">{service.emoji}</div>
                <h3 className={`text-xl font-bold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {service.title}
                </h3>
                <p className={`leading-relaxed ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {service.description}
                </p>
                <button className={`mt-6 font-medium transition-all flex items-center group-hover:translate-x-2 ${
                  isDark 
                    ? 'text-purple-400 hover:text-purple-300' 
                    : 'text-indigo-600 hover:text-indigo-700'
                }`}>
                  En savoir plus <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section CTA */}
      <section className={`py-20 px-6 transition-all duration-500 ${
        isDark 
          ? 'bg-gradient-to-r from-purple-900 to-pink-900' 
          : 'bg-gradient-to-r from-indigo-600 to-purple-600'
      }`}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-8">
              Votre Nouveau Chez-Vous Vous Attend
            </h2>
            <p className="text-xl text-white/90 mb-12">
              Découvrez dès maintenant nos lofts d'exception et trouvez l'espace parfait pour votre style de vie
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="bg-white text-gray-900 px-10 py-4 rounded-full hover:bg-gray-100 transition-colors font-bold">
                Voir nos Lofts
              </button>
              <button className="border-2 border-white text-white px-10 py-4 rounded-full hover:bg-white hover:text-gray-900 transition-colors font-bold">
                Contactez-nous
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-16 px-6 transition-all duration-500 ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className={`font-bold text-lg mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Loft Algérie
              </h3>
              <p className={`leading-relaxed ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Votre partenaire de confiance pour l'immobilier de prestige en Algérie.
              </p>
            </div>
            {['Services', 'Support', 'Légal'].map((section) => (
              <div key={section}>
                <h4 className={`font-semibold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {section}
                </h4>
                <ul className={`space-y-2 text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <li><a href="#" className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-gray-900'
                  }`}>Lien 1</a></li>
                  <li><a href="#" className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-gray-900'
                  }`}>Lien 2</a></li>
                  <li><a href="#" className={`transition-colors ${
                    isDark ? 'hover:text-white' : 'hover:text-gray-900'
                  }`}>Lien 3</a></li>
                </ul>
              </div>
            ))}
          </div>
          <div className={`border-t pt-8 text-center transition-all duration-500 ${
            isDark ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <p className={`mb-4 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              © 2024 Loft Algérie. Tous droits réservés.
            </p>
            <HeaderLogo />
          </div>
        </div>
      </footer>
    </div>
  );
}