'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';
import { Sun, Moon, Sparkles, Zap, Globe, Crown, ArrowUpRight } from 'lucide-react';

export default function StyleVariant6() {
  const [isDark, setIsDark] = useState(true);
  const [activeCard, setActiveCard] = useState(0);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className={`min-h-screen transition-all duration-1000 ${
      isDark 
        ? 'bg-black text-white' 
        : 'bg-white text-black'
    }`}>
      
      {/* Header Futuriste */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 w-full z-50 backdrop-blur-2xl border-b transition-all duration-1000 ${
          isDark 
            ? 'bg-black/50 border-zinc-800' 
            : 'bg-white/50 border-zinc-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <HeaderLogo />
            <nav className="hidden md:flex space-x-12">
              {['HOME', 'LOFTS', 'EXPERIENCE', 'CONTACT'].map((item, index) => (
                <motion.a 
                  key={item}
                  href="#" 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`font-bold text-sm tracking-[0.2em] transition-all duration-300 relative group ${
                    isDark 
                      ? 'text-zinc-400 hover:text-white' 
                      : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  {item}
                  <motion.span 
                    className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r ${
                      isDark ? 'from-cyan-400 to-blue-400' : 'from-blue-600 to-purple-600'
                    }`}
                    initial={{ width: 0 }}
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.a>
              ))}
            </nav>
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-3 rounded-full transition-all duration-500 ${
                  isDark 
                    ? 'bg-zinc-900 text-cyan-400 hover:bg-zinc-800' 
                    : 'bg-zinc-100 text-blue-600 hover:bg-zinc-200'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isDark ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Sun className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Moon className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-8 py-3 rounded-full font-bold text-sm tracking-wide transition-all duration-500 ${
                  isDark 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black hover:from-cyan-400 hover:to-blue-400' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                BOOK NOW
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Cinématique */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <motion.div 
                className={`inline-flex items-center px-6 py-3 rounded-full mb-8 border ${
                  isDark 
                    ? 'bg-zinc-900/50 border-zinc-800 text-cyan-400' 
                    : 'bg-zinc-50 border-zinc-200 text-blue-600'
                }`}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Crown className="w-5 h-5 mr-2" />
                <span className="font-bold text-sm tracking-wide">LUXURY REDEFINED</span>
              </motion.div>
              
              <motion.h1 
                className={`text-8xl lg:text-9xl font-black mb-8 leading-none tracking-tighter ${
                  isDark ? 'text-white' : 'text-black'
                }`}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                LOFT
                <motion.span 
                  className={`block text-transparent bg-clip-text ${
                    isDark 
                      ? 'bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400' 
                      : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'
                  }`}
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 1 }}
                >
                  ALGÉRIE
                </motion.span>
              </motion.h1>
              
              <motion.p 
                className={`text-2xl mb-12 max-w-4xl mx-auto leading-relaxed ${
                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                Experience the future of luxury living. Our architectural masterpieces 
                redefine elegance in Algeria's most prestigious locations.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-6 justify-center"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
              >
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-12 py-5 rounded-full font-bold text-lg transition-all duration-500 flex items-center group ${
                    isDark 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black hover:from-cyan-400 hover:to-blue-400' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                  }`}
                >
                  EXPLORE COLLECTION
                  <ArrowUpRight className="ml-3 w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-12 py-5 rounded-full font-bold text-lg transition-all duration-500 border-2 ${
                    isDark 
                      ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black' 
                      : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  PRIVATE TOUR
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Éléments décoratifs animés */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 rounded-full ${
                isDark ? 'bg-cyan-400/20' : 'bg-blue-400/20'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-30, 30],
                opacity: [0, 1, 0],
                scale: [0, 2, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>
      </section>

      {/* Section Interactive Cards */}
      <section className={`py-24 px-6 transition-all duration-1000 ${
        isDark ? 'bg-zinc-900/50' : 'bg-zinc-50'
      }`}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className={`text-6xl font-black mb-8 ${
              isDark ? 'text-white' : 'text-black'
            }`}>
              BEYOND LUXURY
            </h2>
            <div className={`w-32 h-1 mx-auto mb-8 ${
              isDark ? 'bg-gradient-to-r from-cyan-400 to-blue-400' : 'bg-gradient-to-r from-blue-600 to-purple-600'
            }`} />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: "ARCHITECTURAL EXCELLENCE",
                description: "Award-winning designs by world-renowned architects",
                gradient: isDark ? "from-cyan-500 to-blue-500" : "from-blue-600 to-indigo-600"
              },
              {
                icon: Globe,
                title: "PRIME LOCATIONS",
                description: "Exclusive addresses in Algeria's most coveted districts",
                gradient: isDark ? "from-blue-500 to-purple-500" : "from-purple-600 to-pink-600"
              },
              {
                icon: Zap,
                title: "SMART LIVING",
                description: "Cutting-edge technology integrated seamlessly",
                gradient: isDark ? "from-purple-500 to-pink-500" : "from-pink-600 to-red-600"
              }
            ].map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                whileHover={{ y: -10, scale: 1.02 }}
                onHoverStart={() => setActiveCard(index)}
                className={`p-8 rounded-3xl backdrop-blur-xl border transition-all duration-700 cursor-pointer ${
                  isDark 
                    ? 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800' 
                    : 'bg-white/70 border-zinc-200 hover:bg-white'
                } ${activeCard === index ? 'ring-2 ring-cyan-400' : ''}`}
              >
                <motion.div 
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${card.gradient}`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8 }}
                >
                  <card.icon className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className={`text-xl font-black mb-4 tracking-wide ${
                  isDark ? 'text-white' : 'text-black'
                }`}>
                  {card.title}
                </h3>
                <p className={`leading-relaxed ${
                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                  {card.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>  
    {/* CTA Futuriste */}
      <section className={`py-24 px-6 relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-zinc-900 via-black to-zinc-900' 
          : 'bg-gradient-to-br from-zinc-100 via-white to-zinc-100'
      }`}>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <motion.h2 
              className={`text-6xl font-black mb-8 ${
                isDark ? 'text-white' : 'text-black'
              }`}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              THE FUTURE IS NOW
            </motion.h2>
            <motion.p 
              className={`text-xl mb-12 max-w-3xl mx-auto ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Join the elite. Experience tomorrow's luxury today. Your extraordinary life awaits.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                whileTap={{ scale: 0.95 }}
                className={`px-12 py-5 rounded-full font-black text-lg transition-all duration-500 ${
                  isDark 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black hover:from-cyan-400 hover:to-blue-400' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                RESERVE YOUR LOFT
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-12 py-5 rounded-full font-black text-lg transition-all duration-500 border-2 ${
                  isDark 
                    ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black' 
                    : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                }`}
              >
                EXCLUSIVE PREVIEW
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Grille animée en arrière-plan */}
        <div className="absolute inset-0 opacity-10">
          <div className={`w-full h-full ${
            isDark 
              ? 'bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)]' 
              : 'bg-[linear-gradient(rgba(37,99,235,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.1)_1px,transparent_1px)]'
          } bg-[size:50px_50px]`} />
        </div>
      </section>

      {/* Footer Futuriste */}
      <footer className={`py-20 px-6 border-t transition-all duration-1000 ${
        isDark ? 'bg-black border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h3 className={`font-black text-xl mb-6 tracking-wide ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                LOFT ALGÉRIE
              </h3>
              <p className={`leading-relaxed ${
                isDark ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                Redefining luxury living through architectural excellence and uncompromising quality.
              </p>
            </motion.div>
            {['COLLECTION', 'SERVICES', 'CONNECT'].map((section, index) => (
              <motion.div 
                key={section}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <h4 className={`font-bold mb-6 tracking-wide ${
                  isDark ? 'text-white' : 'text-black'
                }`}>
                  {section}
                </h4>
                <ul className={`space-y-3 ${
                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                  {['Premium Lofts', 'Exclusive Suites', 'Penthouse Collection'].map((item, i) => (
                    <li key={i}>
                      <motion.a 
                        href="#" 
                        className={`transition-colors hover:${isDark ? 'text-cyan-400' : 'text-blue-600'}`}
                        whileHover={{ x: 5 }}
                      >
                        {item}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <motion.div 
            className={`border-t pt-8 text-center transition-all duration-1000 ${
              isDark ? 'border-zinc-800' : 'border-zinc-200'
            }`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className={`mb-6 ${
              isDark ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              © 2024 LOFT ALGÉRIE. LUXURY REDEFINED.
            </p>
            <HeaderLogo />
          </motion.div>
        </div>
      </footer>
    </div>
  );
}