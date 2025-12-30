'use client';

import React from 'react';
import { Globe } from 'lucide-react';

interface DirectLinksHeaderProps {
  locale: string;
}

export default function DirectLinksHeader({ locale }: DirectLinksHeaderProps) {
  const content = {
    fr: { login: "Connexion", signup: "Inscription", client: "Client", owner: "Propriétaire" },
    en: { login: "Login", signup: "Sign Up", client: "Client", owner: "Owner" },
    ar: { login: "تسجيل الدخول", signup: "التسجيل", client: "عميل", owner: "مالك" }
  };

  const t = content[locale as keyof typeof content] || content.fr;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
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

          {/* Navigation Directe - Pas de Menus Déroulants */}
          <div className="flex items-center space-x-2 md:space-x-4">
            
            {/* Langues - Liens Directs */}
            <div className="flex items-center space-x-1 border rounded-lg px-2 py-1">
              <Globe className="w-4 h-4 text-gray-600" />
              <a href="/fr/public" className="text-sm px-2 py-1 rounded hover:bg-gray-100">FR</a>
              <a href="/en/public" className="text-sm px-2 py-1 rounded hover:bg-gray-100">EN</a>
              <a href="/ar/public" className="text-sm px-2 py-1 rounded hover:bg-gray-100">AR</a>
            </div>

            {/* Connexions - Liens Directs */}
            <div className="flex items-center space-x-1">
              <a 
                href={`/${locale}/login`}
                className="text-sm px-3 py-2 border rounded-lg hover:bg-gray-50 text-blue-600"
              >
                {t.client}
              </a>
              <a 
                href={`/${locale}/partner/login`}
                className="text-sm px-3 py-2 border rounded-lg hover:bg-gray-50 text-green-600"
              >
                {t.owner}
              </a>
            </div>

            {/* Inscription */}
            <a 
              href={`/${locale}/register`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              {t.signup}
            </a>
          </div>
        </div>
      </div>

      {/* Status - Fonctionnel */}
      <div className="bg-blue-100 text-blue-800 text-center py-1 text-sm">
        ✅ Header avec Liens Directs - Pas de Menus Déroulants - FONCTIONNEL
      </div>
    </header>
  );
}