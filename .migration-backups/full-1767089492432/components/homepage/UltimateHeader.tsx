'use client';

import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

interface UltimateHeaderProps {
  locale: string;
}

export default function UltimateHeader({ locale }: UltimateHeaderProps) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = {
    fr: { login: "Connexion", signup: "Inscription" },
    en: { login: "Login", signup: "Sign Up" },
    ar: { login: "تسجيل الدخول", signup: "التسجيل" }
  };

  const t = content[locale as keyof typeof content] || content.fr;

  // Fonction pour créer un menu avec JavaScript pur
  const createMenu = (items: Array<{text: string, href: string}>, x: number, y: number) => {
    // Supprimer les anciens menus
    document.querySelectorAll('.ultimate-menu').forEach(el => el.remove());

    const menu = document.createElement('div');
    menu.className = 'ultimate-menu';
    menu.style.cssText = `
      position: fixed !important;
      top: ${y}px !important;
      left: ${x}px !important;
      z-index: 2147483647 !important;
      background: white !important;
      border: 2px solid red !important;
      border-radius: 8px !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3) !important;
      padding: 8px !important;
      min-width: 150px !important;
      font-family: system-ui !important;
      font-size: 14px !important;
    `;

    items.forEach(item => {
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.text;
      link.style.cssText = `
        display: block !important;
        padding: 8px 12px !important;
        color: black !important;
        text-decoration: none !important;
        border-radius: 4px !important;
      `;
      link.onmouseover = () => link.style.background = '#f0f0f0';
      link.onmouseout = () => link.style.background = 'transparent';
      menu.appendChild(link);
    });

    document.body.appendChild(menu);

    // Fermer en cliquant ailleurs
    const closeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 100);
  };

  const handleLanguageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    createMenu([
      { text: '🇫🇷 Français', href: '/fr/public' },
      { text: '🇺🇸 English', href: '/en/public' },
      { text: '🇩🇿 العربية', href: '/ar/public' }
    ], rect.left, rect.bottom + 5);
  };

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    createMenu([
      { text: '👤 Client Login', href: `/${locale}/login` },
      { text: '🏠 Owner Login', href: `/${locale}/partner/login` },
      { text: '➕ Create Account', href: `/${locale}/register` }
    ], rect.left, rect.bottom + 5);
  };

  if (!mounted) return null;

  return (
    <>
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

            {/* Boutons avec JavaScript Pur */}
            <div className="flex items-center space-x-4">
              
              {/* Sélecteur de Langue avec JS Pur */}
              <button
                onClick={handleLanguageClick}
                className="flex items-center space-x-2 px-3 py-2 border-2 border-red-500 rounded-lg hover:bg-gray-50 bg-yellow-200"
              >
                <Globe className="w-4 h-4" />
                <span>{locale.toUpperCase()}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Menu Connexion avec JS Pur */}
              <button
                onClick={handleLoginClick}
                className="flex items-center space-x-2 px-4 py-2 border-2 border-red-500 rounded-lg hover:bg-gray-50 bg-yellow-200"
              >
                <span>{t.login}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Bouton Inscription Direct */}
              <a 
                href={`/${locale}/register`}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {t.signup}
              </a>
            </div>
          </div>
        </div>

        {/* Debug Ultra-Visible */}
        <div className="bg-red-500 text-white text-center py-2 text-lg font-bold">
          🚨 ULTIMATE HEADER - CLIQUEZ SUR LES BOUTONS JAUNES ! 🚨
        </div>
      </header>

      {/* Test de Visibilité Absolue */}
      <div 
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'lime',
          color: 'black',
          padding: '10px',
          zIndex: 2147483647,
          border: '3px solid red',
          borderRadius: '5px',
          fontWeight: 'bold'
        }}
      >
        TEST VISIBILITÉ OK
      </div>
    </>
  );
}