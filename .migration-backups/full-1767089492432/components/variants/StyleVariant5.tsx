'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';
import { Palette, Zap, Shield, Award, ArrowRight, Check } from 'lucide-react';

export default function StyleVariant5() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto-detect system theme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen transition-all duration-700 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 text-gray-900'
    }`}>
      
      {/* Header Premium */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-700 ${
        isDark 
          ? 'bg-slate-900/80 border-slate-700' 
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <HeaderLogo />
            <nav className="hidden md:flex space-x-10">
              {['Accueil', 'Collection', 'Services', 'Contact'].map((item) => (
                <a 
                  key={item}
                  href="#" 
                  className={`font-bold text-lg tracking-wide transition-all duration-300 relative group ${
                    isDark 
                      ? 'text-slate-300 hover:text-white' 
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {item}
                  <span className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                    isDark ? 'bg-emerald-400' : 'bg-slate-900'
                  }`} />
                </a>
              ))}
            </nav>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  isDark 
                    ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Palette className="w-5 h-5" />
              </button>
              <button className={`px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                isDark 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600' 
                  : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-900 hover:to-black'
              }`}>
                Réservation
              </button>
            </div>
          </div>
        </div>
      </header>      {/*
 Hero Ultra-Premium */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <div className={`inline-flex items-center px-6 py-3 rounded-full mb-8 ${
                isDark 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                  : 'bg-slate-100 border border-slate-200 text-slate-700'
              }`}>
                <Award className="w-5 h-5 mr-2" />
                <span className="font-semibold">Immobilier de Prestige depuis 2020</span>
              </div>
              
              <h1 className={`text-7xl lg:text-8xl font-black mb-8 leading-tight tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                LOFT
                <span className={`block text-transparent bg-clip-text ${
                  isDark 
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400' 
                    : 'bg-gradient-to-r from-slate-600 via-slate-800 to-slate-900'
                }`}>
                  ALGÉRIE
                </span>
              </h1>
              
              <p className={`text-2xl mb-12 max-w-4xl mx-auto leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Redéfinissez votre art de vivre dans nos lofts d'exception. 
                Chaque espace incarne l'excellence architecturale et le raffinement contemporain.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                <button className={`px-10 py-5 rounded-xl font-bold text-lg transition-all duration-300 flex items-center group ${
                  isDark 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:scale-105' 
                    : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-900 hover:to-black hover:scale-105'
                }`}>
                  Découvrir la Collection
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className={`px-10 py-5 rounded-xl font-bold text-lg transition-all duration-300 border-2 ${
                  isDark 
                    ? 'border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-slate-900' 
                    : 'border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white'
                }`}>
                  Visite Privée
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Premium */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="max-w-5xl mx-auto"
        >
          <div className={`rounded-3xl p-8 backdrop-blur-xl border transition-all duration-700 ${
            isDark 
              ? 'bg-slate-800/50 border-slate-700' 
              : 'bg-white/70 border-slate-200'
          }`}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { value: '100+', label: 'Lofts Premium', icon: Shield },
                { value: '4.9★', label: 'Note Excellence', icon: Award },
                { value: '24/7', label: 'Conciergerie', icon: Zap },
                { value: '15+', label: 'Quartiers Elite', icon: Palette }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  className="text-center group"
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 ${
                    isDark 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    <stat.icon className="w-8 h-8" />
                  </div>
                  <div className={`text-3xl font-black mb-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {stat.value}
                  </div>
                  <div className={`font-semibold ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>      
{/* Section Avantages Premium */}
      <section className={`py-24 px-6 transition-all duration-700 ${
        isDark ? 'bg-slate-800/30' : 'bg-slate-50/50'
      }`}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className={`text-5xl font-black mb-8 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              L'Excellence à Chaque Détail
            </h2>
            <div className={`w-32 h-1 mx-auto mb-8 ${
              isDark ? 'bg-emerald-400' : 'bg-slate-900'
            }`} />
            <p className={`text-xl max-w-3xl mx-auto ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Découvrez pourquoi nos clients choisissent l'excellence Loft Algérie
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {[
              {
                title: "Architecture Signature",
                description: "Chaque loft est une œuvre d'art architectural conçue par les meilleurs designers internationaux",
                features: ["Design contemporain", "Matériaux nobles", "Finitions luxueuses"]
              },
              {
                title: "Emplacements Exclusifs",
                description: "Situés dans les quartiers les plus prestigieux avec vue panoramique et accès privilégié",
                features: ["Quartiers premium", "Vues exceptionnelles", "Transports directs"]
              },
              {
                title: "Services Concierge",
                description: "Un service personnalisé 24h/24 pour anticiper et répondre à tous vos besoins",
                features: ["Disponibilité 24/7", "Service personnalisé", "Confort absolu"]
              }
            ].map((advantage, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`p-8 rounded-3xl backdrop-blur-xl border transition-all duration-700 group hover:scale-105 ${
                  isDark 
                    ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' 
                    : 'bg-white/70 border-slate-200 hover:bg-white'
                }`}
              >
                <h3 className={`text-2xl font-bold mb-6 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {advantage.title}
                </h3>
                <p className={`mb-8 leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {advantage.description}
                </p>
                <ul className="space-y-3">
                  {advantage.features.map((feature, i) => (
                    <li key={i} className={`flex items-center ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      <Check className={`w-5 h-5 mr-3 ${
                        isDark ? 'text-emerald-400' : 'text-slate-700'
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Premium */}
      <section className={`py-24 px-6 transition-all duration-700 ${
        isDark 
          ? 'bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-900' 
          : 'bg-gradient-to-r from-slate-800 via-slate-900 to-black'
      }`}>
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl font-black text-white mb-8">
              Votre Loft d'Exception Vous Attend
            </h2>
            <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto">
              Rejoignez l'élite de nos résidents et découvrez un art de vivre sans compromis
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="bg-white text-slate-900 px-12 py-5 rounded-xl hover:bg-slate-100 transition-all font-bold text-lg hover:scale-105">
                Réserver une Visite VIP
              </button>
              <button className="border-2 border-white text-white px-12 py-5 rounded-xl hover:bg-white hover:text-slate-900 transition-all font-bold text-lg">
                Catalogue Exclusif
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Premium */}
      <footer className={`py-20 px-6 transition-all duration-700 ${
        isDark ? 'bg-slate-900' : 'bg-slate-50'
      }`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className={`font-black text-xl mb-6 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                LOFT ALGÉRIE
              </h3>
              <p className={`leading-relaxed ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                L'excellence immobilière redéfinie. Votre partenaire de confiance pour l'habitat de prestige.
              </p>
            </div>
            {['Collection', 'Services', 'Contact'].map((section) => (
              <div key={section}>
                <h4 className={`font-bold mb-6 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {section}
                </h4>
                <ul className={`space-y-3 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {['Option 1', 'Option 2', 'Option 3'].map((item, i) => (
                    <li key={i}>
                      <a href="#" className={`transition-colors ${
                        isDark ? 'hover:text-white' : 'hover:text-slate-900'
                      }`}>
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className={`border-t pt-8 text-center transition-all duration-700 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <p className={`mb-6 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              © 2024 Loft Algérie. Excellence & Prestige.
            </p>
            <HeaderLogo />
          </div>
        </div>
      </footer>
    </div>
  );
}