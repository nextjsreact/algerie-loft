'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FlagIcon } from '@/components/ui/flag-icon'
// import { useRouter } from 'next/navigation' // Plus nécessaire

export function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState('fr');
  const [mounted, setMounted] = useState(false);

  // Récupérer la langue actuelle depuis les cookies après le montage
  useEffect(() => {
    const getCurrentLanguage = () => {
      const cookies = document.cookie.split(';');
      const langCookie = cookies.find(cookie => cookie.trim().startsWith('language='));
      if (langCookie) {
        return langCookie.split('=')[1];
      }
      return 'fr'; // défaut
    };

    setCurrentLang(getCurrentLanguage());
    setMounted(true);
  }, []);
  
  const setLanguage = (lng: string) => {
    console.log('🔄 Sélecteur: Changement vers', lng);
    
    // Sauvegarder la langue dans les cookies
    document.cookie = `language=${lng}; path=/; max-age=31536000; SameSite=Lax`;
    
    console.log('🍪 Cookie sauvegardé, rechargement...');
    
    // Recharger la page pour appliquer la nouvelle langue
    window.location.reload();
  };

  const languages = [
    { code: 'ar', name: 'العربية', flagCode: 'DZ' as const },
    { code: 'fr', name: 'Français', flagCode: 'FR' as const },
    { code: 'en', name: 'English', flagCode: 'GB' as const },
  ]

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[1]; // défaut français

  // Afficher le drapeau français par défaut pendant le chargement pour éviter l'hydratation
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 px-0" disabled>
        <FlagIcon country="FR" className="w-5 h-4" />
        <span className="sr-only">Select language</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <FlagIcon country={currentLanguage.flagCode} className="w-5 h-4" />
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
          >
            <FlagIcon country={lang.flagCode} className="w-4 h-3 mr-2" />
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
