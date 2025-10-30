'use client';

import { motion } from 'framer-motion';
import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';
import { useReducedMotion } from '@/hooks/useAnimationSystem';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ui/ThemeToggle';

// Style "Chaleur Méditerranéenne" - Ambiance chaleureuse avec des tons terre et orange
export default function StyleVariant10() {
  const prefersReducedMotion = useReducedMotion();
  const { theme } = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.8,
        ease: "easeOut"
      }
    }
  };

  const sunVariants = {
    animate: {
      rotate: prefersReducedMotion ? 0 : [0, 360],
      scale: prefersReducedMotion ? 1 : [1, 1.1, 1],
      transition: {
        duration: 25,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-orange-900 via-amber-900 to-red-900' 
        : 'bg-gradient-to-br from-orange-50 via-amber-50 to-red-50'
    }`}>
      {/* Mediterranean Sun Elements */}
      <div className="absolute inset-0">
        {/* Warm Sun Rays */}
        <motion.div
          className="absolute top-10 right-10 w-40 h-40 opacity-20"
          variants={sunVariants}
          animate="animate"
        >
          <div className="relative w-full h-full">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-20 bg-gradient-to-t from-orange-300 to-yellow-400 origin-bottom"
                style={{
                  left: '50%',
                  bottom: '50%',
                  transform: `translateX(-50%) rotate(${i * 30}deg)`,
                }}
                animate={{
                  opacity: prefersReducedMotion ? 0.2 : [0.2, 0.6, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
            <div className="absolute inset-4 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full opacity-30" />
          </div>
        </motion.div>

        {/* Floating Warm Particles */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-gradient-to-br from-orange-300 to-red-400 rounded-full opacity-25"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: prefersReducedMotion ? 0 : [0, -25, 0],
              x: prefersReducedMotion ? 0 : [0, 15, -15, 0],
              scale: prefersReducedMotion ? 1 : [1, 1.4, 1],
              opacity: prefersReducedMotion ? 0.25 : [0.25, 0.7, 0.25],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Mediterranean Waves */}
        <motion.div
          className="absolute bottom-0 left-0 w-full h-32 opacity-15"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(251, 146, 60, 0.4), rgba(239, 68, 68, 0.3), transparent)',
          }}
          animate={{
            x: prefersReducedMotion ? 0 : [0, 50, -50, 0],
            transition: {
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />

        {/* Warm Gradient Orbs */}
        <motion.div
          className="absolute top-1/3 left-10 w-72 h-72 bg-gradient-to-br from-orange-200/30 to-red-300/30 rounded-full blur-3xl"
          animate={{
            scale: prefersReducedMotion ? 1 : [1, 1.2, 1],
            x: prefersReducedMotion ? 0 : [0, 30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 bg-white/90 backdrop-blur-md border-b border-orange-200/50 shadow-lg"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: "easeOut" }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <HeaderLogo className="drop-shadow-lg" />
              <div className="hidden md:block">
                <motion.div 
                  className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: prefersReducedMotion ? '0%' : ['0%', '100%', '0%'],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                  }}
                >
                  Loft Algérie
                </motion.div>
                <div className="text-base text-orange-700 font-semibold">Votre Confort Notre Priorité</div>
              </div>
            </div>
            
            <nav className="hidden lg:flex space-x-8">
              {['Accueil', 'Lofts', 'Services', 'À Propos', 'Contact'].map((item, index) => (
                <motion.a
                  key={item}
                  href="#"
                  className="text-orange-800 hover:text-red-600 font-bold text-lg transition-colors relative group"
                  whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {item}
                  <motion.div
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-400 to-red-500 group-hover:w-full transition-all duration-300"
                  />
                </motion.a>
              ))}
            </nav>

            <motion.button
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: prefersReducedMotion ? 1 : 1.05, y: -2 }}
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
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={itemVariants} className="space-y-8">
            <motion.h1 
              className="text-5xl lg:text-7xl font-bold leading-tight"
              variants={itemVariants}
            >
              <span className="bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent">
                Chaleur
              </span>
              <br />
              <span className="text-orange-800">
                Méditerranéenne
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-orange-700 leading-relaxed"
              variants={itemVariants}
            >
              Ressentez la douceur de vivre méditerranéenne dans nos lofts baignés de soleil. 
              Chaque espace respire la convivialité et la chaleur humaine, comme un éternel été algérien.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              variants={itemVariants}
            >
              <motion.button
                className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                ☀️ Découvrir la Chaleur
              </motion.button>
              
              <motion.button
                className="border-2 border-orange-400 text-orange-700 px-8 py-4 rounded-full font-semibold text-lg hover:bg-orange-50 transition-all duration-300"
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🌅 Visite Virtuelle
              </motion.button>
            </motion.div>

            {/* Mediterranean Features */}
            <motion.div 
              className="grid grid-cols-2 gap-6 pt-8"
              variants={itemVariants}
            >
              {[
                { icon: '🌞', title: 'Lumière Naturelle', desc: 'Baigné de soleil' },
                { icon: '🏺', title: 'Artisanat Local', desc: 'Décoration authentique' },
                { icon: '🌿', title: 'Terrasses Privées', desc: 'Espaces extérieurs' },
                { icon: '🍊', title: 'Ambiance Chaleureuse', desc: 'Convivialité assurée' }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-orange-200/50 shadow-lg"
                  variants={itemVariants}
                  whileHover={{ scale: prefersReducedMotion ? 1 : 1.02, y: -2 }}
                >
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <h3 className="font-semibold text-orange-800">{feature.title}</h3>
                  <p className="text-sm text-orange-600">{feature.desc}</p>
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
              className="relative bg-gradient-to-br from-orange-100 to-red-200 rounded-3xl p-8 shadow-2xl"
              animate={{
                y: prefersReducedMotion ? 0 : [-8, 8, -8],
                rotate: prefersReducedMotion ? 0 : [0, 2, -2, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="aspect-square bg-gradient-to-br from-white to-orange-50 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden">
                {/* Sun Rays Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 via-orange-300/20 to-red-400/20 rounded-2xl"
                  animate={{
                    rotate: prefersReducedMotion ? 0 : [0, 360],
                  }}
                  transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                
                <div className="text-center space-y-4 relative z-10">
                  <motion.div 
                    className="text-6xl"
                    animate={{
                      scale: prefersReducedMotion ? 1 : [1, 1.1, 1],
                      rotate: prefersReducedMotion ? 0 : [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    🏖️
                  </motion.div>
                  <div className="text-2xl font-bold text-orange-800">Loft Soleil</div>
                  <div className="text-orange-600">Douceur de Vivre</div>
                </div>
              </div>
              
              {/* Floating Mediterranean Elements */}
              {[
                { icon: '🌺', position: 'top-4 right-4' },
                { icon: '🐚', position: 'bottom-4 left-4' },
                { icon: '🌴', position: 'top-4 left-4' },
                { icon: '🦋', position: 'bottom-4 right-4' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className={`absolute ${item.position} text-2xl`}
                  animate={{
                    y: prefersReducedMotion ? 0 : [0, -12, 0],
                    x: prefersReducedMotion ? 0 : [0, 8, -8, 0],
                    rotate: prefersReducedMotion ? 0 : [0, 25, -25, 0],
                  }}
                  transition={{
                    duration: 4 + index * 0.5,
                    repeat: Infinity,
                    delay: index * 0.8,
                  }}
                >
                  {item.icon}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Mediterranean Promise Section */}
      <motion.section 
        className="relative z-10 bg-gradient-to-r from-orange-100/80 to-red-100/80 backdrop-blur-sm py-16 my-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6 text-center">
          <motion.h2 
            className="text-4xl font-bold text-orange-800 mb-8"
            variants={itemVariants}
          >
            L'Esprit Méditerranéen
          </motion.h2>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
          >
            {[
              {
                icon: '🌅',
                title: 'Lever de Soleil Quotidien',
                description: 'Chaque matin apporte sa dose de bonheur et de lumière dorée'
              },
              {
                icon: '🤗',
                title: 'Hospitalité Authentique',
                description: 'L\'accueil chaleureux qui fait la réputation de l\'Algérie'
              },
              {
                icon: '🎨',
                title: 'Art de Vivre Unique',
                description: 'Une culture riche qui inspire chaque détail de nos espaces'
              }
            ].map((promise, index) => (
              <motion.div
                key={promise.title}
                className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-orange-200/50"
                variants={itemVariants}
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.05, y: -5 }}
              >
                <motion.div 
                  className="text-5xl mb-4"
                  animate={{
                    scale: prefersReducedMotion ? 1 : [1, 1.2, 1],
                    rotate: prefersReducedMotion ? 0 : [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: index * 0.6,
                  }}
                >
                  {promise.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-orange-800 mb-4">{promise.title}</h3>
                <p className="text-orange-700">{promise.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        className="relative z-10 bg-gradient-to-r from-orange-800 to-red-800 text-white py-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <HeaderLogo className="brightness-0 invert" />
              <p className="text-orange-100">
                La chaleur méditerranéenne au cœur de vos vacances algériennes.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-orange-300 mb-4">Nos Espaces</h4>
              <ul className="space-y-2 text-orange-100">
                <li>Lofts Soleil</li>
                <li>Terrasses Privées</li>
                <li>Jardins Méditerranéens</li>
                <li>Espaces Détente</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-orange-300 mb-4">Contact</h4>
              <ul className="space-y-2 text-orange-100">
                <li>🌅 Alger, Algérie</li>
                <li>📞 +213 XX XX XX XX</li>
                <li>✉️ soleil@loft-algerie.com</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-orange-300 mb-4">Suivez-nous</h4>
              <div className="flex space-x-4">
                {['🌞', '🌺', '🏖️', '🎨'].map((social, index) => (
                  <motion.div
                    key={index}
                    className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center cursor-pointer"
                    whileHover={{ scale: prefersReducedMotion ? 1 : 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {social}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="border-t border-orange-700 mt-8 pt-8 text-center text-orange-200">
            <p>&copy; 2024 Loft Algérie - Votre Confort Notre Priorité</p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}