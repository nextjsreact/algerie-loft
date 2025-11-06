#!/usr/bin/env node

/**
 * Script pour optimiser les performances des traductions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Optimisation des performances de traduction...\n');

// Analyser la taille des fichiers de traduction
const analyzeTranslationFiles = () => {
  const locales = ['fr', 'en', 'ar'];
  const results = {};
  
  locales.forEach(locale => {
    const filePath = path.join(__dirname, '..', 'messages', `${locale}.json`);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      results[locale] = {
        size: stats.size,
        sizeKB: Math.round(stats.size / 1024),
        keyCount: countKeys(data),
        filePath
      };
    }
  });
  
  return results;
};

// Compter récursivement les clés
const countKeys = (obj) => {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
};

// Créer des fichiers de traduction optimisés (plus petits)
const createOptimizedTranslations = (results) => {
  console.log('📦 Création de fichiers de traduction optimisés...\n');
  
  Object.keys(results).forEach(locale => {
    const originalPath = results[locale].filePath;
    const optimizedPath = path.join(__dirname, '..', 'messages', `${locale}-optimized.json`);
    
    try {
      const content = fs.readFileSync(originalPath, 'utf8');
      const data = JSON.parse(content);
      
      // Extraire seulement les traductions essentielles pour la navigation et les pages principales
      const essentialTranslations = {
        nav: data.nav || {},
        common: data.common || {},
        auth: data.auth || {},
        lofts: {
          editLoft: data.lofts?.editLoft,
          linkToAirbnb: data.lofts?.linkToAirbnb,
          loftInfoTitle: data.lofts?.loftInfoTitle,
          pricePerNight: data.lofts?.pricePerNight,
          owner: data.lofts?.owner,
          description: data.lofts?.description,
          available: data.lofts?.available,
          occupied: data.lofts?.occupied,
          maintenance: data.lofts?.maintenance,
          details: data.lofts?.details || {},
          additionalInfo: data.lofts?.additionalInfo || {},
          billManagement: data.lofts?.billManagement || {},
          photos: data.lofts?.photos || {}
        },
        roles: data.roles || {},
        dashboard: data.dashboard || {}
      };
      
      // Sauvegarder la version optimisée
      fs.writeFileSync(optimizedPath, JSON.stringify(essentialTranslations, null, 2));
      
      const optimizedStats = fs.statSync(optimizedPath);
      const reduction = Math.round(((results[locale].size - optimizedStats.size) / results[locale].size) * 100);
      
      console.log(`✅ ${locale.toUpperCase()}: ${results[locale].sizeKB}KB → ${Math.round(optimizedStats.size / 1024)}KB (${reduction}% réduction)`);
      
    } catch (error) {
      console.error(`❌ Erreur lors de l'optimisation de ${locale}:`, error.message);
    }
  });
};

// Créer un composant de chargement lazy pour les traductions
const createLazyTranslationLoader = () => {
  const loaderContent = `'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'

// Cache pour les traductions chargées
const translationCache = new Map()

export function useLazyTranslations(namespace?: string) {
  const locale = useLocale()
  const [translations, setTranslations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadTranslations = async () => {
      const cacheKey = \`\${locale}-\${namespace || 'main'}\`
      
      // Vérifier le cache d'abord
      if (translationCache.has(cacheKey)) {
        setTranslations(translationCache.get(cacheKey))
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Charger les traductions optimisées
        const response = await fetch(\`/api/translations/\${locale}\${namespace ? \`/\${namespace}\` : ''}\`)
        
        if (!response.ok) {
          throw new Error(\`Failed to load translations: \${response.status}\`)
        }
        
        const data = await response.json()
        
        // Mettre en cache
        translationCache.set(cacheKey, data)
        setTranslations(data)
        
      } catch (err) {
        console.error('Translation loading error:', err)
        setError(err.message)
        
        // Fallback vers les traductions par défaut
        try {
          const fallback = await import(\`@/messages/\${locale}-optimized.json\`)
          setTranslations(fallback.default)
          translationCache.set(cacheKey, fallback.default)
        } catch (fallbackErr) {
          console.error('Fallback translation loading failed:', fallbackErr)
        }
        
      } finally {
        setLoading(false)
      }
    }

    loadTranslations()
  }, [locale, namespace])

  return { translations, loading, error }
}

// Hook pour précharger les traductions
export function usePreloadTranslations() {
  const preload = async (locale: string, namespace?: string) => {
    const cacheKey = \`\${locale}-\${namespace || 'main'}\`
    
    if (!translationCache.has(cacheKey)) {
      try {
        const response = await fetch(\`/api/translations/\${locale}\${namespace ? \`/\${namespace}\` : ''}\`)
        if (response.ok) {
          const data = await response.json()
          translationCache.set(cacheKey, data)
        }
      } catch (error) {
        console.warn('Preload failed:', error)
      }
    }
  }

  return { preload }
}
`;

  const loaderPath = path.join(__dirname, '..', 'hooks', 'use-lazy-translations.ts');
  const hooksDir = path.join(__dirname, '..', 'hooks');
  
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }
  
  fs.writeFileSync(loaderPath, loaderContent);
  console.log('✅ Hook de chargement lazy créé:', loaderPath);
};

// Créer une API route pour servir les traductions
const createTranslationAPI = () => {
  const apiContent = `import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { locale: string; namespace?: string } }
) {
  try {
    const { locale, namespace } = params
    
    // Valider la locale
    const validLocales = ['fr', 'en', 'ar']
    if (!validLocales.includes(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
    }
    
    // Charger les traductions optimisées
    const filePath = path.join(process.cwd(), 'messages', \`\${locale}-optimized.json\`)
    
    if (!fs.existsSync(filePath)) {
      // Fallback vers le fichier original
      const originalPath = path.join(process.cwd(), 'messages', \`\${locale}.json\`)
      if (!fs.existsSync(originalPath)) {
        return NextResponse.json({ error: 'Translations not found' }, { status: 404 })
      }
      
      const content = fs.readFileSync(originalPath, 'utf8')
      const data = JSON.parse(content)
      
      // Retourner seulement le namespace demandé si spécifié
      if (namespace && data[namespace]) {
        return NextResponse.json(data[namespace])
      }
      
      return NextResponse.json(data)
    }
    
    const content = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(content)
    
    // Retourner seulement le namespace demandé si spécifié
    if (namespace && data[namespace]) {
      return NextResponse.json(data[namespace])
    }
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Translation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
`;

  const apiDir = path.join(__dirname, '..', 'app', 'api', 'translations', '[locale]');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  
  const apiPath = path.join(apiDir, 'route.ts');
  fs.writeFileSync(apiPath, apiContent);
  console.log('✅ API de traductions créée:', apiPath);
};

// Exécuter l'optimisation
const results = analyzeTranslationFiles();

console.log('📊 Analyse des fichiers de traduction:');
Object.keys(results).forEach(locale => {
  const data = results[locale];
  console.log(`${locale.toUpperCase()}: ${data.sizeKB}KB (${data.keyCount} clés)`);
});

console.log('');

// Identifier les fichiers volumineux
const largeFiles = Object.keys(results).filter(locale => results[locale].sizeKB > 100);
if (largeFiles.length > 0) {
  console.log('⚠️  Fichiers volumineux détectés:', largeFiles.map(l => `${l.toUpperCase()}: ${results[l].sizeKB}KB`).join(', '));
  console.log('   Cela peut causer des problèmes de performance lors du changement de langue.\n');
}

createOptimizedTranslations(results);
console.log('');
createLazyTranslationLoader();
createTranslationAPI();

console.log('\n🎯 Optimisations appliquées:');
console.log('1. Fichiers de traduction optimisés créés');
console.log('2. Hook de chargement lazy créé');
console.log('3. API de traductions créée');

console.log('\n🚀 Prochaines étapes:');
console.log('1. Remplacer LanguageSelector par LanguageSelectorOptimized');
console.log('2. Utiliser les fichiers *-optimized.json pour les traductions critiques');
console.log('3. Redémarrer l\'application pour tester les performances');

console.log('\n💡 Résultat attendu:');
console.log('- Changement de langue beaucoup plus rapide');
console.log('- Moins de temps de chargement');
console.log('- Interface plus réactive');