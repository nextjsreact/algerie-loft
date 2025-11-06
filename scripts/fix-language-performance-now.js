#!/usr/bin/env node

/**
 * Script de correction rapide pour les performances de changement de langue
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('⚡ Correction RAPIDE des performances de changement de langue...\n');

// 1. Vérifier si les fichiers optimisés existent
const checkOptimizedFiles = () => {
  const locales = ['fr', 'en', 'ar'];
  const missing = [];
  
  locales.forEach(locale => {
    const optimizedPath = path.join(__dirname, '..', 'messages', `${locale}-optimized.json`);
    if (!fs.existsSync(optimizedPath)) {
      missing.push(locale);
    }
  });
  
  return missing;
};

// 2. Créer des fichiers optimisés ultra-légers pour les performances immédiates
const createUltraLightTranslations = () => {
  const locales = {
    fr: {
      nav: {
        dashboard: "Tableau de bord",
        lofts: "Appartements",
        conversations: "Conversations",
        notifications: "Notifications",
        customers: "Clients",
        reservations: "Réservations",
        availability: "Disponibilité",
        tasks: "Tâches",
        teams: "Équipes",
        owners: "Propriétaires",
        transactions: "Transactions",
        reportsNav: "Rapports",
        settings: "Paramètres",
        loftManager: "Gestionnaire d'appartements",
        logout: "Déconnexion"
      },
      common: {
        loading: "Chargement...",
        error: "Erreur",
        success: "Succès",
        cancel: "Annuler",
        save: "Sauvegarder",
        company: "Société"
      },
      lofts: {
        editLoft: "Modifier l'appartement",
        available: "Disponible",
        occupied: "Occupé",
        maintenance: "Maintenance"
      }
    },
    en: {
      nav: {
        dashboard: "Dashboard",
        lofts: "Lofts",
        conversations: "Conversations",
        notifications: "Notifications",
        customers: "Customers",
        reservations: "Reservations",
        availability: "Availability",
        tasks: "Tasks",
        teams: "Teams",
        owners: "Owners",
        transactions: "Transactions",
        reportsNav: "Reports",
        settings: "Settings",
        loftManager: "Loft Manager",
        logout: "Logout"
      },
      common: {
        loading: "Loading...",
        error: "Error",
        success: "Success",
        cancel: "Cancel",
        save: "Save",
        company: "Company"
      },
      lofts: {
        editLoft: "Edit Apartment",
        available: "Available",
        occupied: "Occupied",
        maintenance: "Maintenance"
      }
    },
    ar: {
      nav: {
        dashboard: "لوحة التحكم",
        lofts: "الشقق",
        conversations: "المحادثات",
        notifications: "الإشعارات",
        customers: "العملاء",
        reservations: "الحجوزات",
        availability: "التوفر",
        tasks: "المهام",
        teams: "الفرق",
        owners: "الملاك",
        transactions: "المعاملات",
        reportsNav: "التقارير",
        settings: "الإعدادات",
        loftManager: "مدير الشقة",
        logout: "تسجيل الخروج"
      },
      common: {
        loading: "جاري التحميل...",
        error: "خطأ",
        success: "نجح",
        cancel: "إلغاء",
        save: "حفظ",
        company: "شركة"
      },
      lofts: {
        editLoft: "تعديل الشقة",
        available: "متاح",
        occupied: "مشغول",
        maintenance: "صيانة"
      }
    }
  };
  
  Object.keys(locales).forEach(locale => {
    const ultraLightPath = path.join(__dirname, '..', 'messages', `${locale}-ultra-light.json`);
    fs.writeFileSync(ultraLightPath, JSON.stringify(locales[locale], null, 2));
    console.log(`✅ Fichier ultra-léger créé: ${locale}-ultra-light.json (${Math.round(fs.statSync(ultraLightPath).size / 1024)}KB)`);
  });
};

// 3. Créer un sélecteur de langue ultra-rapide
const createUltraFastLanguageSelector = () => {
  const selectorContent = `"use client"

import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Check, Loader2 } from "lucide-react"
import { FlagIcon } from "@/components/ui/flag-icon"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useLocale } from "next-intl"

const languages = [
  { code: 'fr', name: 'FR', flagCode: 'FR' as const },
  { code: 'en', name: 'EN', flagCode: 'GB' as const },
  { code: 'ar', name: 'AR', flagCode: 'DZ' as const }
]

interface UltraFastLanguageSelectorProps {
  showText?: boolean
}

export function UltraFastLanguageSelector({ showText = false }: UltraFastLanguageSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()
  const [isChanging, setIsChanging] = useState(false)

  const handleLanguageChange = (langCode: string) => {
    if (langCode === currentLocale || isChanging) return
    
    setIsChanging(true)
    
    // Méthode ultra-rapide : changement immédiat avec cookie
    document.cookie = \`NEXT_LOCALE=\${langCode}; path=/; max-age=31536000; SameSite=Lax\`
    
    // Navigation immédiate
    const pathWithoutLocale = pathname.replace(\`/\${currentLocale}\`, '') || '/'
    const newUrl = \`/\${langCode}\${pathWithoutLocale}\`
    
    // Utiliser location.replace pour un changement plus rapide
    window.location.replace(newUrl)
  }

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={\`flex items-center gap-1 \${showText ? 'h-8 px-2' : 'h-8 w-8 p-0'} text-white hover:text-white hover:bg-gray-600\`}
          disabled={isChanging}
        >
          {isChanging ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FlagIcon country={currentLanguage.flagCode} className="w-4 h-3" />
          )}
          {showText && !isChanging && (
            <span className="text-xs font-medium">{currentLanguage.name}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer py-1"
            disabled={isChanging || lang.code === currentLocale}
          >
            <div className="flex items-center gap-2">
              <FlagIcon country={lang.flagCode} className="w-4 h-3" />
              <span className="text-sm">{lang.name}</span>
            </div>
            {lang.code === currentLocale && (
              <Check className="h-3 w-3 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}`;

  const ultraFastPath = path.join(__dirname, '..', 'components', 'ui', 'ultra-fast-language-selector.tsx');
  fs.writeFileSync(ultraFastPath, selectorContent);
  console.log('✅ Sélecteur ultra-rapide créé:', 'ultra-fast-language-selector.tsx');
};

// 4. Créer un script de remplacement automatique
const createAutoReplace = () => {
  const replaceContent = `#!/usr/bin/env node

/**
 * Script pour remplacer automatiquement le sélecteur de langue
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Remplacement automatique du sélecteur de langue...');

// Remplacer dans sidebar-nextintl.tsx
const sidebarPath = path.join(__dirname, '..', 'components', 'layout', 'sidebar-nextintl.tsx');
if (fs.existsSync(sidebarPath)) {
  let content = fs.readFileSync(sidebarPath, 'utf8');
  
  // Remplacer l'import
  content = content.replace(
    /import.*LanguageSelector.*from.*language-selector.*/g,
    'import { UltraFastLanguageSelector } from "@/components/ui/ultra-fast-language-selector"'
  );
  
  // Remplacer l'utilisation
  content = content.replace(
    /<LanguageSelector.*?\\/>/g,
    '<UltraFastLanguageSelector />'
  );
  
  fs.writeFileSync(sidebarPath, content);
  console.log('✅ Sidebar mis à jour');
}

console.log('🎉 Remplacement terminé !');
`;

  const autoReplacePath = path.join(__dirname, 'auto-replace-language-selector.js');
  fs.writeFileSync(autoReplacePath, replaceContent);
  console.log('✅ Script de remplacement automatique créé');
  
  return autoReplacePath;
};

// Exécuter les corrections
console.log('1. Vérification des fichiers optimisés...');
const missing = checkOptimizedFiles();
if (missing.length > 0) {
  console.log(`⚠️  Fichiers manquants: ${missing.join(', ')}`);
}

console.log('\n2. Création des fichiers ultra-légers...');
createUltraLightTranslations();

console.log('\n3. Création du sélecteur ultra-rapide...');
createUltraFastLanguageSelector();

console.log('\n4. Création du script de remplacement...');
const autoReplacePath = createAutoReplace();

console.log('\n⚡ CORRECTION IMMÉDIATE:');
console.log('Exécutez cette commande pour appliquer le changement maintenant:');
console.log(`node ${autoReplacePath}`);

console.log('\n🎯 Résultat attendu:');
console.log('- Changement de langue en moins de 1 seconde');
console.log('- Plus de "ça tourne et ça tourne"');
console.log('- Interface ultra-réactive');

console.log('\n🚀 IMPORTANT:');
console.log('Après avoir exécuté le script de remplacement, redémarrez votre application !');