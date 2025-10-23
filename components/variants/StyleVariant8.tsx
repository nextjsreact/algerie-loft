'use client';

import { motion } from 'framer-motion';
import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';
import { useReducedMotion } from '@/hooks/useAnimationSystem';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ui/ThemeToggle';

// Style "Oasis Moderne" - Fraîcheur et sérénité avec des tons verts et bleus
export default function StyleVariant8() {
  const prefersReducedMotion = useReducedMotion();
  const { theme } = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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

  const waveVariants = {
    animate: {
      x: prefersReducedMotion ? 0 : [0, 100, 0],
      y: prefersReducedMotion ? 0 : [0, -20, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900' 
        : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50'
    }`}>
      {/* Animated Water Elements */}
      <div className="absolute inset-0">
        {/* Flowing Water Waves */}
        <motion.div
          className="absolute top-0 left-0 w-full h-32 opacity-20"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.3), transparent)',
          }}
          variants={waveVariants}
          animate="animate"
        />
        
        <motion.div
          className="absolute bottom-0 right-0 w-full h-40 opacity-15"
          style={{
            background: 'linear-gradient(-90deg, transparent, rgba(16, 185, 129, 0.3), transparent)',
          }}
          animate={{
            x: prefersReducedMotion ? 0 : [100, -100, 100],
            transition: {
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />

        {/* Floating Bubbles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 bg-gradient-to-br from-cyan-200 to-teal-300 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: prefersReducedMotion ? 0 : [0, -30, 0],
              x: prefersReducedMotion ? 0 : [0, 20, -20, 0],
              scale: prefersReducedMotion ? 1 : [1, 1.3, 1],
              opacity: prefersReducedMotion ? 0.3 : [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 6 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}

        {/* Oasis Circles */}
        <motion.div
          className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-emerald-200/40 to-teal-300/40 rounded-full blur-2xl"
          animate={{
            scale: prefersReducedMotion ? 1 : [1, 1.3, 1],
            rotate: prefersReducedMotion ? 0 : [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 bg-white/90 backdrop-blur-md border-b border-teal-200/50 shadow-lg"
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
                  className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: prefersReducedMotion ? '0%' : ['0%', '100%', '0%'],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                  }}
                >
                  Loft Algérie
                </motion.div>
                <div className={`text-sm font-medium transition-colors duration-500 ${
                  theme === 'dark' ? 'text-teal-300' : 'text-teal-700'
                }`}>
                  Votre Confort Notre Priorité
                </div>
              </div>
            </div>
            
            <nav className="hidden lg:flex space-x-8">
              {['Accueil', 'Lofts', 'Services', 'À Propos', 'Contact'].map((item, index) => (
                <motion.a
                  key={item}
                  href="#"
                  className={`font-medium transition-colors relative group ${
                    theme === 'dark' 
                      ? 'text-teal-200 hover:text-emerald-300' 
                      : 'text-teal-800 hover:text-emerald-600'
                  }`}
                  whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {item}
                  <motion.div
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 group-hover:w-full transition-all duration-300"
                  />
                </motion.a>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <ThemeToggle variant="emerald" />
              <motion.button
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Réserver
              </motion.button>
            </div>
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
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Oasis de
              </span>
              <br />
              <span className="text-teal-800">
                Confort
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-teal-700 leading-relaxed"
              variants={itemVariants}
            >
              Plongez dans un univers de sérénité et de fraîcheur. Nos lofts offrent une évasion 
              parfaite du quotidien, comme une oasis moderne au cœur de l'Algérie.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              variants={itemVariants}
            >
              <motion.button
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                🌊 Explorer l'Oasis
              </motion.button>
              
              <motion.button
                className="border-2 border-teal-400 text-teal-700 px-8 py-4 rounded-full font-semibold text-lg hover:bg-teal-50 transition-all duration-300"
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                💧 Découvrir Plus
              </motion.button>
            </motion.div>

            {/* Wellness Features */}
            <motion.div 
              className="grid grid-cols-2 gap-6 pt-8"
              variants={itemVariants}
            >
              {[
                { icon: '🌿', title: 'Zen Absolu', desc: 'Atmosphère apaisante' },
                { icon: '💨', title: 'Air Pur', desc: 'Ventilation naturelle' },
                { icon: '🏊', title: 'Espace Aqua', desc: 'Détente aquatique' },
                { icon: '🧘', title: 'Méditation', desc: 'Espaces wellness' }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-teal-200/50 shadow-lg"
                  variants={itemVariants}
                  whileHover={{ scale: prefersReducedMotion ? 1 : 1.02, y: -2 }}
                >
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <h3 className="font-semibold text-teal-800">{feature.title}</h3>
                  <p className="text-sm text-teal-600">{feature.desc}</p>
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
              className="relative bg-gradient-to-br from-emerald-100 to-teal-200 rounded-3xl p-8 shadow-2xl"
              animate={{
                y: prefersReducedMotion ? 0 : [-5, 5, -5],
                rotate: prefersReducedMotion ? 0 : [0, 1, -1, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="aspect-square bg-gradient-to-br from-white to-cyan-50 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden">
                {/* Water Ripple Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-200/30 to-transparent rounded-2xl"
                  animate={{
                    scale: prefersReducedMotion ? 1 : [1, 1.2, 1],
                    opacity: prefersReducedMotion ? 0.3 : [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                  }}
                />
                
                <div className="text-center space-y-4 relative z-10">
                  <motion.div 
                    className="text-6xl"
                    animate={{
                      y: prefersReducedMotion ? 0 : [0, -10, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    🏝️
                  </motion.div>
                  <div className="text-2xl font-bold text-teal-800">Loft Oasis</div>
                  <div className="text-teal-600">Sérénité Totale</div>
                </div>
              </div>
              
              {/* Floating Elements */}
              {[
                { icon: '🌊', position: 'top-4 right-4' },
                { icon: '🍃', position: 'bottom-4 left-4' },
                { icon: '☁️', position: 'top-4 left-4' },
                { icon: '💎', position: 'bottom-4 right-4' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className={`absolute ${item.position} text-2xl`}
                  animate={{
                    y: prefersReducedMotion ? 0 : [0, -15, 0],
                    x: prefersReducedMotion ? 0 : [0, 10, -10, 0],
                    rotate: prefersReducedMotion ? 0 : [0, 20, -20, 0],
                  }}
                  transition={{
                    duration: 4 + index,
                    repeat: Infinity,
                    delay: index * 0.7,
                  }}
                >
                  {item.icon}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Wellness Promise Section */}
      <motion.section 
        className="relative z-10 bg-gradient-to-r from-emerald-100/80 to-teal-100/80 backdrop-blur-sm py-16 my-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6 text-center">
          <motion.h2 
            className="text-4xl font-bold text-teal-800 mb-8"
            variants={itemVariants}
          >
            Votre Bien-être, Notre Mission
          </motion.h2>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
          >
            {[
              {
                icon: '🌱',
                title: 'Harmonie Naturelle',
                description: 'Un environnement qui respecte votre équilibre intérieur'
              },
              {
                icon: '💧',
                title: 'Pureté Absolue',
                description: 'Des espaces purifiés pour votre santé et votre sérénité'
              },
              {
                icon: '🌟',
                title: 'Énergie Positive',
                description: 'Des lieux chargés de bonnes vibrations et de paix'
              }
            ].map((promise, index) => (
              <motion.div
                key={promise.title}
                className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-teal-200/50"
                variants={itemVariants}
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.05, y: -5 }}
              >
                <motion.div 
                  className="text-5xl mb-4"
                  animate={{
                    scale: prefersReducedMotion ? 1 : [1, 1.15, 1],
                    rotate: prefersReducedMotion ? 0 : [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5,
                  }}
                >
                  {promise.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-teal-800 mb-4">{promise.title}</h3>
                <p className="text-teal-700">{promise.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        className="relative z-10 bg-gradient-to-r from-teal-800 to-emerald-800 text-white py-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <HeaderLogo className="brightness-0 invert" />
              <p className="text-teal-100">
                Votre oasis de confort et de sérénité au cœur de l'Algérie.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-emerald-300 mb-4">Nos Services</h4>
              <ul className="space-y-2 text-teal-100">
                <li>Lofts Wellness</li>
                <li>Espaces Zen</li>
                <li>Services Spa</li>
                <li>Méditation Guidée</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-emerald-300 mb-4">Contact</h4>
              <ul className="space-y-2 text-teal-100">
                <li>🏝️ Alger, Algérie</li>
                <li>📞 +213 XX XX XX XX</li>
                <li>✉️ oasis@loft-algerie.com</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-emerald-300 mb-4">Suivez-nous</h4>
              <div className="flex space-x-4">
                {['🌊', '🌿', '💧', '🏝️'].map((social, index) => (
                  <motion.div
                    key={index}
                    className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center cursor-pointer"
                    whileHover={{ scale: prefersReducedMotion ? 1 : 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {social}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="border-t border-emerald-700 mt-8 pt-8 text-center text-teal-200">
            <p>&copy; 2024 Loft Algérie - Votre Confort Notre Priorité</p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}