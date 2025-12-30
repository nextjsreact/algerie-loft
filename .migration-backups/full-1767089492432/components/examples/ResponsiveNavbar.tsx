'use client';

import { useState } from 'react';
import { HeaderLogo, CompactLogo } from '@/components/futuristic/AnimatedLogo';

export default function ResponsiveNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Navigation Desktop */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo et navigation principale */}
            <div className="flex items-center space-x-8">
              {/* Logo responsive */}
              <div className="flex-shrink-0">
                <HeaderLogo 
                  className="hidden sm:block"
                  onLoadError={(error) => console.error('Desktop logo error:', error)}
                />
                <CompactLogo 
                  className="sm:hidden"
                  onLoadError={(error) => console.error('Mobile logo error:', error)}
                />
              </div>
              
              {/* Menu desktop */}
              <div className="hidden md:flex space-x-6">
                <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                  Accueil
                </a>
                <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                  Lofts
                </a>
                <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                  Réservations
                </a>
                <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                  Contact
                </a>
              </div>
            </div>

            {/* Actions utilisateur */}
            <div className="flex items-center space-x-4">
              {/* Boutons desktop */}
              <div className="hidden md:flex items-center space-x-3">
                <button className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Connexion
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Inscription
                </button>
              </div>

              {/* Bouton menu mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#" className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md text-base font-medium">
                Accueil
              </a>
              <a href="#" className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md text-base font-medium">
                Lofts
              </a>
              <a href="#" className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md text-base font-medium">
                Réservations
              </a>
              <a href="#" className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md text-base font-medium">
                Contact
              </a>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <a href="#" className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md text-base font-medium">
                  Connexion
                </a>
                <a href="#" className="block px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-base font-medium mt-2">
                  Inscription
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Barre d'information avec logo compact */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center space-x-3">
              <CompactLogo />
              <span className="text-blue-800 text-sm">
                🎉 Nouvelle promotion : -20% sur tous les lofts ce mois-ci !
              </span>
            </div>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              En savoir plus →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Exemple d'utilisation dans une page
export function NavbarExample() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsiveNavbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Exemple d'Intégration du Logo
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Le logo s'adapte automatiquement à la taille de l'écran et s'intègre parfaitement dans la navigation.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Desktop (768px et plus)</h2>
              <ul className="text-left space-y-2 text-gray-600">
                <li>✅ HeaderLogo (120x36px)</li>
                <li>✅ Menu horizontal complet</li>
                <li>✅ Boutons d'action visibles</li>
                <li>✅ Hauteur de navigation : 64px</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Mobile (moins de 768px)</h2>
              <ul className="text-left space-y-2 text-gray-600">
                <li>✅ CompactLogo (80x24px)</li>
                <li>✅ Menu hamburger</li>
                <li>✅ Navigation pliable</li>
                <li>✅ Optimisé pour le touch</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}