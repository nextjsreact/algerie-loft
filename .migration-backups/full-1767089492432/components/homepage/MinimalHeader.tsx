'use client';

import React from 'react';

interface MinimalHeaderProps {
  locale: string;
}

export default function MinimalHeader({ locale }: MinimalHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Loft Algérie</h1>
            </div>
          </div>

          {/* Navigation Simple */}
          <div className="flex items-center space-x-4">
            <a href="/fr/public" className="text-sm px-3 py-2 border rounded hover:bg-gray-50">FR</a>
            <a href="/en/public" className="text-sm px-3 py-2 border rounded hover:bg-gray-50">EN</a>
            <a href="/ar/public" className="text-sm px-3 py-2 border rounded hover:bg-gray-50">AR</a>
            <a href={`/${locale}/login`} className="text-sm px-3 py-2 border rounded hover:bg-gray-50 text-blue-600">Client</a>
            <a href={`/${locale}/partner/login`} className="text-sm px-3 py-2 border rounded hover:bg-gray-50 text-green-600">Propriétaire</a>
            <a href={`/${locale}/register`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Inscription</a>
          </div>
        </div>
      </div>
      
      <div className="bg-green-200 text-center py-1 text-sm">
        ✅ Header Minimal - Résolution 404 - FONCTIONNEL
      </div>
    </header>
  );
}