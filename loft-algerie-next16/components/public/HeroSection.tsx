"use client"

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { CONTACT_INFO } from '../../config/contact-info';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Contenu principal */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Lofts Premium
              </span>
              <br />
              en Algérie
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
              Découvrez nos espaces exceptionnels pour vos séjours d'affaires ou de loisirs. 
              Des lofts modernes et équipés dans les meilleures locations d'Algérie.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button size="lg" className="text-lg px-8 py-3">
                Découvrir nos lofts
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3" asChild>
                <a href={CONTACT_INFO.phone.whatsapp} target="_blank" rel="noopener noreferrer">
                  Contacter par WhatsApp
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">50+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Lofts disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Support client</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">100%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Cartes de présentation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="transform hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🏢</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Lofts Modernes</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Espaces contemporains avec tout le confort moderne
                </p>
              </CardContent>
            </Card>

            <Card className="transform hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📍</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Emplacements Premium</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Situés dans les meilleurs quartiers d'Algérie
                </p>
              </CardContent>
            </Card>

            <Card className="transform hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Réservation Rapide</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Processus de réservation simple et sécurisé
                </p>
              </CardContent>
            </Card>

            <Card className="transform hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Service Garanti</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Support client 24/7 et satisfaction garantie
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}