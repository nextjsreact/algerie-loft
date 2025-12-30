'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedLogo, { HeaderLogo, HeroLogo, FooterLogo } from './AnimatedLogo';

export default function LogoTestPage() {
  const [logoSrc, setLogoSrc] = useState('/logo.jpg');
  const [showGlow, setShowGlow] = useState(true);

  const testSizes = [
    { name: 'Petit', width: 120, height: 36 },
    { name: 'Moyen', width: 200, height: 60 },
    { name: 'Grand', width: 300, height: 90 },
    { name: 'Extra Large', width: 400, height: 120 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            🎨 Test de Logo - Loft Algérie
          </h1>
          <p className="text-gray-300">
            Testez différentes tailles et effets pour votre logo
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Logo Source */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Source du Logo
              </label>
              <select
                value={logoSrc}
                onChange={(e) => setLogoSrc(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30"
              >
                <option value="/logo.jpg">🏆 Votre Logo Loft Algérie</option>
                <option value="/logo-white.jpg">⚪ Version Blanche</option>
                <option value="/logo-dark.jpg">⚫ Version Sombre</option>
                <option value="/logo-temp.svg">🎨 Logo Temporaire SVG</option>
              </select>
            </div>

            {/* Glow Effect */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Effet de Glow
              </label>
              <button
                onClick={() => setShowGlow(!showGlow)}
                className={`w-full p-3 rounded-lg transition-all ${
                  showGlow 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/20 text-gray-300'
                }`}
              >
                {showGlow ? '✨ Activé' : '⚪ Désactivé'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Logo Variants */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Header Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center"
          >
            <h3 className="text-white font-bold mb-4">Header Logo</h3>
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <HeaderLogo 
                src={logoSrc} 
                onLoadError={(error) => console.error('Header logo error:', error)}
              />
            </div>
            <p className="text-gray-300 text-sm">180x54px - Navigation</p>
          </motion.div>

          {/* Hero Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center"
          >
            <h3 className="text-white font-bold mb-4">Hero Logo</h3>
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <HeroLogo 
                src={logoSrc} 
                showGlow={showGlow}
                onLoadError={(error) => console.error('Hero logo error:', error)}
              />
            </div>
            <p className="text-gray-300 text-sm">300x90px - Page d'accueil</p>
          </motion.div>

          {/* Footer Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center"
          >
            <h3 className="text-white font-bold mb-4">Footer Logo</h3>
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <FooterLogo 
                src={logoSrc}
                onLoadError={(error) => console.error('Footer logo error:', error)}
              />
            </div>
            <p className="text-gray-300 text-sm">160x48px - Pied de page</p>
          </motion.div>
        </div>

        {/* Custom Sizes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6"
        >
          <h3 className="text-white font-bold mb-6 text-center">
            Tailles Personnalisées
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {testSizes.map((size, index) => (
              <div key={size.name} className="text-center">
                <h4 className="text-white font-semibold mb-3">{size.name}</h4>
                <div className="bg-white/5 rounded-lg p-4 mb-2">
                  <AnimatedLogo
                    src={logoSrc}
                    width={size.width}
                    height={size.height}
                    showGlow={showGlow}
                    variant="hero"
                  />
                </div>
                <p className="text-gray-400 text-xs">
                  {size.width}x{size.height}px
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 bg-blue-500/20 border border-blue-400/30 rounded-xl p-6"
        >
          <h3 className="text-blue-200 font-bold mb-4">📋 Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-100 text-sm">
            <div>
              <h4 className="font-semibold mb-2">1. Placer votre logo :</h4>
              <ul className="space-y-1 text-blue-200">
                <li>• Copiez votre logo dans <code>public/logo.jpg</code></li>
                <li>• Formats : JPG, PNG recommandés</li>
                <li>• Taille optimale : 400x120px max</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Tester et ajuster :</h4>
              <ul className="space-y-1 text-blue-200">
                <li>• Changez la source dans le menu</li>
                <li>• Activez/désactivez les effets</li>
                <li>• Vérifiez sur différentes tailles</li>
                <li>• <a href="/fr/logo-diagnostic" className="text-blue-300 hover:text-blue-200 underline">🔧 Page de diagnostic avancé</a></li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}