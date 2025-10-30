'use client';

import { motion } from 'framer-motion';
import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';
import { useReducedMotion } from '@/hooks/useAnimationSystem';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ui/ThemeToggle';

// Style "Élégance Urbaine" - Sophistication et modernité avec des tons neutres chics
export default function StyleVariant9() {
  const prefersReducedMotion = useReducedMotion();
  const { theme } = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.8,
        ease: "easeOut"
      }
    }
  };

  const geometricVariants = {
    animate: {
      rotate: prefersReducedMotion ? 0 : [0, 360],
      scale: prefersReducedMotion ? 1 : [1, 1.1, 1],
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-stone-900' 
        : 'bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50'
    }`}>
      {/* Geometric Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Geometric Shapes */}
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 border-2 border-slate-200 rotate-45 opacity-30"
          variants={geometricVariants}
          animate="animate"
        />
        
        <motion.div
          className="absolute bottom-40 right-32 w-24 h-24 bg-gradient-to-br from-slate-300/20 to-gray-400/20 rounded-full"
          animate={{
            y: prefersReducedMotion ? 0 : [0, -20, 0],
            x: prefersReducedMotion ? 0 : [0, 15, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.div
          className="absolute top-1/2 right-20 w-16 h-16 bg-gradient-to-r from-stone-300/30 to-slate-400/30 transform rotate-12"
          animate={{
            rotate: prefersReducedMotion ? 12 : [12, 45, 12],
            scale: prefersReducedMotion ? 1 : [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
          }}
        />

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 h-full">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="border-r border-slate-300" />
            ))}
          </div>
        </div>

        {/* Elegant Gradients */}
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-slate-200/20 to-gray-300/20 rounded-full blur-3xl"
          animate={{
            scale: prefersReducedMotion ? 1 : [1, 1.3, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/50 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: "easeOut" }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <HeaderLogo className="drop-shadow-sm" />
              <div className="hidden md:block">
                <motion.div 
                  className="text-3xl font-bold bg-gradient-to-r from-slate-700 via-gray-800 to-stone-700 bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Loft Algérie
                </motion.div>
                <div className="text-base text-slate-600 font-semibold">Votre Confort Notre Priorité</div>
              </div>
            </div>
            
            <nav className="hidden lg:flex space-x-8">
              {['Accueil', 'Lofts', 'Services', 'À Propos', 'Contact'].map((item, index) => (
                <motion.a
                  key={item}
                  href="#"
                  className="text-slate-700 hover:text-gray-900 font-semibold text-lg transition-colors relative group"
                  whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {item}
                  <motion.div
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-slate-400 to-gray-600 group-hover:w-full transition-all duration-300"
                  />
                </motion.a>
              ))}
            </nav>

            <motion.button
              className="bg-gradient-to-r from-slate-700 to-gray-800 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: prefersReducedMotion ? 1 : 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              Réserver
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="relative z-10 container mx-auto px-6 py-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={itemVariants} className="space-y-8">
            <motion.h1 
              className="text-5xl lg:text-7xl font-light leading-tight"
              variants={itemVariants}
            >
              <span className="bg-gradient-to-r from-slate-800 via-gray-700 to-stone-800 bg-clip-text text-transparent font-extralight">
                Élégance
              </span>
              <br />
              <span className="text-slate-800 font-bold">
                Urbaine
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-slate-600 leading-relaxed font-light"
              variants={itemVariants}
            >
              Découvrez l'art de vivre à l'algérienne dans nos lofts d'exception. 
              Où sophistication urbaine rencontre confort authentique pour créer 
              votre sanctuaire personnel.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              variants={itemVariants}
            >
              <motion.button
                className="bg-gradient-to-r from-slate-700 to-gray-800 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                🏢 Collection Urbaine
              </motion.button>
              
              <motion.button
                className="border-2 border-slate-300 text-slate-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-50 transition-all duration-300"
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📋 Portfolio
              </motion.button>
            </motion.div>

            {/* Luxury Features */}
            <motion.div 
              className="grid grid-cols-2 gap-6 pt-8"
              variants={itemVariants}
            >
              {[
                { icon: '🎨', title: 'Design Signature', desc: 'Architecture d\'exception' },
                { icon: '🏛️', title: 'Prestige Absolu', desc: 'Finitions premium' },
                { icon: '🔑', title: 'Service Concierge', desc: 'Assistance 24/7' },
                { icon: '🌆', title: 'Vue Panoramique', desc: 'Horizons urbains' }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300"
                  variants={itemVariants}
                  whileHover={{ scale: prefersReducedMotion ? 1 : 1.02, y: -2 }}
                >
                  <div className="text-2xl mb-3">{feature.icon}</div>
                  <h3 className="font-semibold text-slate-800 mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            className="relative"
            variants={itemVariants}
          >
            <motion.div
              className="relative bg-gradient-to-br from-white to-slate-100 rounded-2xl p-8 shadow-2xl border border-slate-200/50"
              animate={{
                y: prefersReducedMotion ? 0 : [-3, 3, -3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="aspect-square bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl flex items-center justify-center shadow-inner relative">
                {/* Minimalist Grid */}
                <div className="absolute inset-4 grid grid-cols-3 grid-rows-3 gap-2 opacity-20">
                  {[...Array(9)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="bg-slate-300 rounded-sm"
                      animate={{
                        opacity: prefersReducedMotion ? 0.2 : [0.2, 0.5, 0.2],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
                
                <div className="text-center space-y-4 relative z-10">
                  <motion.div 
                    className="text-6xl"
                    animate={{
                      scale: prefersReducedMotion ? 1 : [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    🏙️
                  </motion.div>
                  <div className="text-2xl font-light text-slate-800">Loft Signature</div>
                  <div className="text-slate-600 font-light">Élégance Moderne</div>
                </div>
              </div>
              
              {/* Floating Minimal Icons */}
              {[
                { icon: '◆', position: 'top-6 right-6' },
                { icon: '◇', position: 'bottom-6 left-6' },
                { icon: '○', position: 'top-6 left-6' },
                { icon: '□', position: 'bottom-6 right-6' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className={`absolute ${item.position} text-xl text-slate-400`}
                  animate={{
                    y: prefersReducedMotion ? 0 : [0, -8, 0],
                    opacity: prefersReducedMotion ? 0.6 : [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 3 + index,
                    repeat: Infinity,
                    delay: index * 0.5,
                  }}
                >
                  {item.icon}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Sophistication Promise Section */}
      <motion.section 
        className="relative z-10 bg-gradient-to-r from-slate-100/80 to-gray-100/80 backdrop-blur-sm py-16 my-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6 text-center">
          <motion.h2 
            className="text-4xl font-light text-slate-800 mb-8"
            variants={itemVariants}
          >
            L'Art du Raffinement
          </motion.h2>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
          >
            {[
              {
                icon: '✨',
                title: 'Sophistication Intemporelle',
                description: 'Des espaces conçus pour traverser les époques avec élégance'
              },
              {
                icon: '🎯',
                title: 'Précision Architecturale',
                description: 'Chaque détail pensé pour votre confort et votre bien-être'
              },
              {
                icon: '🏆',
                title: 'Excellence Reconnue',
                description: 'Un standard de qualité qui définit le luxe moderne'
              }
            ].map((promise, index) => (
              <motion.div
                key={promise.title}
                className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-slate-200/50"
                variants={itemVariants}
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.03, y: -3 }}
              >
                <motion.div 
                  className="text-4xl mb-6"
                  animate={{
                    scale: prefersReducedMotion ? 1 : [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.4,
                  }}
                >
                  {promise.icon}
                </motion.div>
                <h3 className="text-xl font-semibold text-slate-800 mb-4">{promise.title}</h3>
                <p className="text-slate-600 leading-relaxed">{promise.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        className="relative z-10 bg-gradient-to-r from-slate-800 to-gray-900 text-white py-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <HeaderLogo className="brightness-0 invert" />
              <p className="text-slate-300 leading-relaxed">
                L'excellence immobilière redéfinie pour l'élite algérienne.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-200 mb-4">Collections</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Lofts Signature</li>
                <li>Penthouses Urbains</li>
                <li>Studios Design</li>
                <li>Espaces Créatifs</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-200 mb-4">Contact</h4>
              <ul className="space-y-2 text-slate-400">
                <li>🏢 Alger, Algérie</li>
                <li>📞 +213 XX XX XX XX</li>
                <li>✉️ elegance@loft-algerie.com</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-200 mb-4">Réseaux</h4>
              <div className="flex space-x-4">
                {['◆', '◇', '○', '□'].map((social, index) => (
                  <motion.div
                    key={index}
                    className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer text-slate-300"
                    whileHover={{ scale: prefersReducedMotion ? 1 : 1.1, backgroundColor: '#475569' }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {social}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Loft Algérie - Votre Confort Notre Priorité</p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}