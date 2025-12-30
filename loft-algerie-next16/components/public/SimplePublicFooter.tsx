"use client"

import { CONTACT_INFO } from '../../config/contact-info';
import { Button } from '../ui/button';

export default function SimplePublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🏠</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Loft Algérie</h3>
                <p className="text-gray-400 text-sm">Location de lofts premium</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Découvrez nos lofts exceptionnels en Algérie. 
              Des espaces uniques pour vos séjours d'affaires ou de loisirs.
            </p>
            <div className="flex space-x-4">
              <Button size="sm" asChild>
                <a href={CONTACT_INFO.phone.whatsapp} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${CONTACT_INFO.email.display}`}>
                  Email
                </a>
              </Button>
            </div>
          </div>

          {/* Navigation rapide */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Accueil
                </a>
              </li>
              <li>
                <a href="#services" className="text-gray-400 hover:text-white transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#lofts" className="text-gray-400 hover:text-white transition-colors">
                  Nos Lofts
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <span>📞</span>
                <a 
                  href={CONTACT_INFO.phone.link} 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {CONTACT_INFO.phone.display}
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <span>📧</span>
                <a 
                  href={CONTACT_INFO.email.link} 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {CONTACT_INFO.email.display}
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <span>📍</span>
                <span className="text-gray-400">
                  {CONTACT_INFO.address.fr}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <span>🕒</span>
                <span className="text-gray-400">
                  {CONTACT_INFO.hours.fr}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} Loft Algérie. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Conditions d'utilisation
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}