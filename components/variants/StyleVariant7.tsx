'use client';

import { motion } from 'framer-motion';
import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';
import { useReducedMotion } from '@/hooks/useAnimationSystem';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ui/ThemeToggle';

// Style "Confort Doré" - Luxe et chaleur avec des tons dorés
export default function StyleVariant7() {
  const prefersReducedMotion = useReducedMotion();
  const { theme } = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.8,
        ease: "easeOut"
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: prefersReducedMotion ? 0 : [-10, 10, -10],
      rotate: prefersReducedMotion ? 0 : [0, 2, -2, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-amber-900 via-yellow-900 to-orange-900' 
        : 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Golden Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: prefersReducedMotion ? 0 : [0, -20, 0],
              opacity: prefersReducedMotion ? 0.2 : [0.2, 0.6, 0.2],
              scale: prefersReducedMotion ? 1 : [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Comfort Waves */}
        <motion.div
          className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-r from-yellow-200/30 to-amber-300/30 rounded-full blur-3xl"
          animate={{
            scale: prefersReducedMotion ? 1 : [1, 1.2, 1],
            rotate: prefersReducedMotion ? 0 : [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <motion.div
          className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-l from-orange-200/30 to-yellow-300/30 rounded-full blur-3xl"
          animate={{
            scale: prefersReducedMotion ? 1 : [1.2, 1, 1.2],
            rotate: prefersReducedMotion ? 0 : [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className={`relative z-10 backdrop-blur-md border-b shadow-lg transition-colors duration-500 ${
          theme === 'dark'
            ? 'bg-amber-900/80 border-yellow-700/50'
            : 'bg-white/80 border-yellow-200/50'
        }`}
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
                  className="text-3xl font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent"
                  variants={floatingVariants}
                  animate="animate"
                >
                  Loft Algérie
                </motion.div>
                <div className={`text-base font-semibold transition-colors duration-500 ${
                  theme === 'dark' ? 'text-amber-300' : 'text-amber-700'
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
                  className={`font-bold text-lg transition-colors relative group ${
                    theme === 'dark' 
                      ? 'text-amber-200 hover:text-yellow-300' 
                      : 'text-amber-800 hover:text-yellow-600'
                  }`}
                  whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {item}
                  <motion.div
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 group-hover:w-full transition-all duration-300"
                  />
                </motion.a>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <ThemeToggle variant="golden" />
              <motion.button
                className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
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
              <span className="bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
                Votre Confort
              </span>
              <br />
              <span className={`transition-colors duration-500 ${
                theme === 'dark' ? 'text-amber-200' : 'text-amber-800'
              }`}>
                Notre Priorité
              </span>
            </motion.h1>
            
            <motion.p 
              className={`text-xl leading-relaxed transition-colors duration-500 ${
                theme === 'dark' ? 'text-amber-300' : 'text-amber-700'
              }`}
              variants={itemVariants}
            >
              Découvrez nos lofts d'exception en Algérie, conçus pour votre bien-être et votre épanouissement. 
              Chaque espace est pensé pour créer une harmonie parfaite entre luxe et confort.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              variants={itemVariants}
            >
              <motion.button
                className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                🏠 Découvrir nos Lofts
              </motion.button>
              
              <motion.button
                className="border-2 border-amber-400 text-amber-700 px-8 py-4 rounded-full font-semibold text-lg hover:bg-amber-50 transition-all duration-300"
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📞 Nous Contacter
              </motion.button>
            </motion.div>

            {/* Comfort Features */}
            <motion.div 
              className="grid grid-cols-2 gap-6 pt-8"
              variants={itemVariants}
            >
              {[
                { icon: '🛏️', title: 'Confort Premium', desc: 'Mobilier haut de gamme' },
                { icon: '🌡️', title: 'Climat Optimal', desc: 'Température parfaite' },
                { icon: '🔒', title: 'Sécurité 24/7', desc: 'Tranquillité assurée' },
                { icon: '🌿', title: 'Espaces Verts', desc: 'Nature intégrée' }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className={`backdrop-blur-sm p-4 rounded-2xl border shadow-lg transition-colors duration-500 ${
                    theme === 'dark'
                      ? 'bg-amber-900/60 border-yellow-700/50'
                      : 'bg-white/60 border-yellow-200/50'
                  }`}
                  variants={itemVariants}
                  whileHover={{ scale: prefersReducedMotion ? 1 : 1.02, y: -2 }}
                >
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <h3 className={`font-semibold transition-colors duration-500 ${
                    theme === 'dark' ? 'text-amber-200' : 'text-amber-800'
                  }`}>
                    {feature.title}
                  </h3>
                  <p className={`text-sm transition-colors duration-500 ${
                    theme === 'dark' ? 'text-amber-300' : 'text-amber-600'
                  }`}>
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Image */}
          <motion.div 
            className="relative"
            variants={itemVariants}
          >
            <motion.div
              className="relative bg-gradient-to-br from-yellow-100 to-amber-200 rounded-3xl p-8 shadow-2xl"
              variants={floatingVariants}
              animate="animate"
            >
              <div className="aspect-square bg-gradient-to-br from-white to-yellow-50 rounded-2xl flex items-center justify-center shadow-inner">
                <div className="text-center space-y-4">
                  <motion.div 
                    className="text-6xl"
                    animate={{
                      rotate: prefersReducedMotion ? 0 : [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    🏡
                  </motion.div>
                  <div className="text-2xl font-bold text-amber-800">Loft Premium</div>
                  <div className="text-amber-600">Confort Absolu</div>
                </div>
              </div>
              
              {/* Floating Comfort Icons */}
              {[
                { icon: '☀️', position: 'top-4 right-4' },
                { icon: '🛋️', position: 'bottom-4 left-4' },
                { icon: '🌸', position: 'top-4 left-4' },
                { icon: '💎', position: 'bottom-4 right-4' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className={`absolute ${item.position} text-2xl`}
                  animate={{
                    y: prefersReducedMotion ? 0 : [0, -10, 0],
                    rotate: prefersReducedMotion ? 0 : [0, 15, -15, 0],
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

      {/* Comfort Promise Section */}
      <motion.section 
        className={`relative z-10 backdrop-blur-sm py-16 my-16 transition-colors duration-500 ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-yellow-900/80 to-amber-900/80'
            : 'bg-gradient-to-r from-yellow-100/80 to-amber-100/80'
        }`}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6 text-center">
          <motion.h2 
            className={`text-4xl font-bold mb-8 transition-colors duration-500 ${
              theme === 'dark' ? 'text-amber-200' : 'text-amber-800'
            }`}
            variants={itemVariants}
          >
            Notre Engagement Confort
          </motion.h2>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
          >
            {[
              {
                icon: '🏆',
                title: 'Excellence Garantie',
                description: 'Chaque détail est pensé pour votre satisfaction maximale'
              },
              {
                icon: '🤝',
                title: 'Service Personnalisé',
                description: 'Une équipe dédiée à votre confort et vos besoins'
              },
              {
                icon: '💫',
                title: 'Expérience Unique',
                description: 'Des moments inoubliables dans un cadre exceptionnel'
              }
            ].map((promise, index) => (
              <motion.div
                key={promise.title}
                className={`backdrop-blur-sm p-8 rounded-2xl shadow-lg border transition-colors duration-500 ${
                  theme === 'dark'
                    ? 'bg-amber-900/70 border-yellow-700/50'
                    : 'bg-white/70 border-yellow-200/50'
                }`}
                variants={itemVariants}
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.05, y: -5 }}
              >
                <motion.div 
                  className="text-5xl mb-4"
                  animate={{
                    scale: prefersReducedMotion ? 1 : [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.3,
                  }}
                >
                  {promise.icon}
                </motion.div>
                <h3 className={`text-xl font-bold mb-4 transition-colors duration-500 ${
                  theme === 'dark' ? 'text-amber-200' : 'text-amber-800'
                }`}>
                  {promise.title}
                </h3>
                <p className={`transition-colors duration-500 ${
                  theme === 'dark' ? 'text-amber-300' : 'text-amber-700'
                }`}>
                  {promise.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        className={`relative z-10 py-12 transition-colors duration-500 ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-amber-900 to-yellow-900 text-amber-100'
            : 'bg-gradient-to-r from-amber-800 to-yellow-800 text-white'
        }`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <HeaderLogo className="brightness-0 invert" />
              <p className="text-amber-100">
                Votre partenaire de confiance pour un confort exceptionnel en Algérie.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-yellow-300 mb-4">Nos Services</h4>
              <ul className="space-y-2 text-amber-100">
                <li>Location de Lofts</li>
                <li>Conciergerie</li>
                <li>Maintenance</li>
                <li>Services Premium</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-yellow-300 mb-4">Contact</h4>
              <ul className="space-y-2 text-amber-100">
                <li>📍 Alger, Algérie</li>
                <li>📞 +213 XX XX XX XX</li>
                <li>✉️ contact@loft-algerie.com</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-yellow-300 mb-4">Suivez-nous</h4>
              <div className="flex space-x-4">
                {['📘', '📷', '🐦', '💼'].map((social, index) => (
                  <motion.div
                    key={index}
                    className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center cursor-pointer"
                    whileHover={{ scale: prefersReducedMotion ? 1 : 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {social}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="border-t border-yellow-700 mt-8 pt-8 text-center text-amber-200">
            <p>&copy; 2024 Loft Algérie - Votre Confort Notre Priorité</p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}