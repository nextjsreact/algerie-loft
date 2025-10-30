'use client';

import { motion } from 'framer-motion';
import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';
import { Sparkles, Shield, Clock, Heart } from 'lucide-react';

export default function StyleVariant3() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      
      {/* Header Chaleureux */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <HeaderLogo />
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-amber-800 hover:text-amber-600 transition-colors font-bold text-lg">Accueil</a>
              <a href="#" className="text-amber-800 hover:text-amber-600 transition-colors font-bold text-lg">Nos Lofts</a>
              <a href="#" className="text-amber-800 hover:text-amber-600 transition-colors font-bold text-lg">Services</a>
              <a href="#" className="text-amber-800 hover:text-amber-600 transition-colors font-bold text-lg">À Propos</a>
            </nav>
            <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-full hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg font-bold text-lg">
              Nous Contacter
            </button>
          </div>
        </div>
      </header>

      {/* Hero Chaleureux */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl lg:text-7xl font-bold text-amber-900 mb-8 leading-tight">
                Votre Confort,
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                  Notre Priorité
                </span>
              </h1>
              <p className="text-2xl text-amber-700 mb-12 max-w-4xl mx-auto leading-relaxed">
                Découvrez l'art de vivre à l'algérienne dans nos lofts exceptionnels. 
                Chaque espace raconte une histoire, chaque détail exprime notre passion.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-10 py-4 rounded-full hover:from-amber-600 hover:to-orange-600 transition-all shadow-xl text-lg font-semibold">
                  Découvrir Nos Lofts
                </button>
                <button className="border-2 border-amber-500 text-amber-700 px-10 py-4 rounded-full hover:bg-amber-500 hover:text-white transition-all text-lg font-semibold">
                  Planifier une Visite
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Éléments décoratifs flottants */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-10, 10],
                rotate: [0, 360],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <Sparkles className="w-6 h-6 text-amber-400/30" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section Valeurs */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-amber-900 mb-6">Nos Valeurs</h2>
            <p className="text-xl text-amber-700 max-w-3xl mx-auto">
              Ce qui nous guide dans chaque projet, chaque relation, chaque moment partagé
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Heart,
                title: "Passion",
                description: "L'amour du beau et de l'authentique guide chacune de nos créations",
                color: "from-red-400 to-pink-400"
              },
              {
                icon: Shield,
                title: "Confiance",
                description: "Votre sérénité est notre engagement, votre satisfaction notre récompense",
                color: "from-blue-400 to-indigo-400"
              },
              {
                icon: Sparkles,
                title: "Excellence",
                description: "Chaque détail compte, chaque finition reflète notre exigence",
                color: "from-amber-400 to-yellow-400"
              },
              {
                icon: Clock,
                title: "Disponibilité",
                description: "À votre écoute 24h/24 pour répondre à tous vos besoins",
                color: "from-green-400 to-emerald-400"
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="text-center group"
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${value.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <value.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-amber-900 mb-4">{value.title}</h3>
                <p className="text-amber-700 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="py-20 px-6 bg-gradient-to-r from-amber-100 to-orange-100">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-amber-900 mb-6">Ils Nous Font Confiance</h2>
            <p className="text-xl text-amber-700">Les mots de nos clients sont notre plus belle récompense</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah M.",
                text: "Un service exceptionnel et un loft qui dépasse toutes mes attentes. L'équipe de Loft Algérie a su comprendre mes besoins.",
                rating: 5
              },
              {
                name: "Ahmed K.",
                text: "Professionnalisme et qualité au rendez-vous. Je recommande vivement pour tous vos projets immobiliers.",
                rating: 5
              },
              {
                name: "Fatima B.",
                text: "Une expérience unique ! Chaque détail a été pensé pour notre confort. Merci à toute l'équipe.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-2xl text-amber-400">★</span>
                  ))}
                </div>
                <p className="text-amber-800 mb-6 leading-relaxed italic">"{testimonial.text}"</p>
                <div className="font-bold text-amber-900">— {testimonial.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Contact */}
      <section className="py-20 px-6 bg-gradient-to-br from-amber-600 to-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl font-bold text-white mb-8">Commençons Ensemble</h2>
            <p className="text-xl text-amber-100 mb-12">
              Votre rêve immobilier commence par une conversation. Parlons-en !
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="bg-white text-amber-600 px-10 py-4 rounded-full hover:bg-amber-50 transition-colors font-bold text-lg shadow-xl">
                Appelez-nous Maintenant
              </button>
              <button className="border-2 border-white text-white px-10 py-4 rounded-full hover:bg-white hover:text-amber-600 transition-colors font-bold text-lg">
                Demander un Rappel
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Chaleureux */}
      <footer className="bg-amber-900 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-amber-100 font-bold text-xl mb-6">Loft Algérie</h3>
              <p className="text-amber-200 leading-relaxed">
                Votre partenaire de confiance pour un habitat d'exception en Algérie.
              </p>
            </div>
            <div>
              <h4 className="text-amber-100 font-semibold mb-6">Nos Services</h4>
              <ul className="space-y-3 text-amber-200">
                <li><a href="#" className="hover:text-white transition-colors">Location Premium</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Vente Exclusive</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Conseil Personnalisé</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gestion Complète</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-amber-100 font-semibold mb-6">Contact</h4>
              <ul className="space-y-3 text-amber-200">
                <li>📍 Alger, Algérie</li>
                <li>📞 +213 XX XX XX XX</li>
                <li>✉️ contact@loftalgerie.com</li>
                <li>🕒 Lun-Sam: 9h-18h</li>
              </ul>
            </div>
            <div>
              <h4 className="text-amber-100 font-semibold mb-6">Newsletter</h4>
              <p className="text-amber-200 mb-4">Restez informé de nos nouveautés</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Votre email"
                  className="flex-1 px-4 py-2 rounded-l-full text-amber-900"
                />
                <button className="bg-amber-500 text-white px-6 py-2 rounded-r-full hover:bg-amber-400 transition-colors">
                  OK
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-amber-800 pt-8 text-center">
            <p className="text-amber-200 mb-4">© 2024 Loft Algérie. Fait avec ❤️ en Algérie.</p>
            <HeaderLogo />
          </div>
        </div>
      </footer>
    </div>
  );
}