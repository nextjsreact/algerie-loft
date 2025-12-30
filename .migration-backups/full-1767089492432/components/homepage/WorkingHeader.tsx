'use client';

import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

interface WorkingHeaderProps {
  locale: string;
}

export default function WorkingHeader({ locale }: WorkingHeaderProps) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);

  const content = {
    fr: { login: "Connexion", signup: "Inscription" },
    en: { login: "Login", signup: "Sign Up" },
    ar: { login: "تسجيل الدخول", signup: "التسجيل" }
  };

  const t = content[locale as keyof typeof content] || content.fr;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0" style={{ zIndex: 1000 }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Loft Algérie</h1>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex items-center space-x-4">
            
            {/* Sélecteur de Langue */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center space-x-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Globe className="w-4 h-4" />
                <span>{locale.toUpperCase()}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg" style={{ zIndex: 1001 }}>
                  <a 
                    href="/fr/public" 
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setShowLanguageMenu(false)}
                  >
                    🇫🇷 Français
                  </a>
                  <a 
                    href="/en/public" 
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setShowLanguageMenu(false)}
                  >
                    🇺🇸 English
                  </a>
                  <a 
                    href="/ar/public" 
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setShowLanguageMenu(false)}
                  >
                    🇩🇿 العربية
                  </a>
                </div>
              )}
            </div>

            {/* Menu Connexion */}
            <div className="relative">
              <button
                onClick={() => setShowLoginMenu(!showLoginMenu)}
                className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <span>{t.login}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showLoginMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg" style={{ zIndex: 1001 }}>
                  <a 
                    href={`/${locale}/login`}
                    className="block px-4 py-3 hover:bg-gray-100"
                    onClick={() => setShowLoginMenu(false)}
                  >
                    <div className="font-medium">Client</div>
                    <div className="text-xs text-gray-500">Réserver un loft</div>
                  </a>
                  <a 
                    href={`/${locale}/partner/login`}
                    className="block px-4 py-3 hover:bg-gray-100"
                    onClick={() => setShowLoginMenu(false)}
                  >
                    <div className="font-medium">Propriétaire</div>
                    <div className="text-xs text-gray-500">Gérer vos biens</div>
                  </a>
                  <div className="border-t"></div>
                  <a 
                    href={`/${locale}/register`}
                    className="block px-4 py-3 hover:bg-blue-50 text-blue-600 font-medium"
                    onClick={() => setShowLoginMenu(false)}
                  >
                    Créer un compte
                  </a>
                </div>
              )}
            </div>

            {/* Bouton Inscription */}
            <a 
              href={`/${locale}/register`}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {t.signup}
            </a>
          </div>
        </div>
      </div>

      {/* Debug */}
      <div className="bg-green-200 text-center py-1 text-sm">
        ✅ Header Sans Overflow-X Hidden - Langue: {showLanguageMenu ? 'OUVERT' : 'FERMÉ'} | Connexion: {showLoginMenu ? 'OUVERT' : 'FERMÉ'}
      </div>
    </header>
  );
}