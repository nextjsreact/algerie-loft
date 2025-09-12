#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 UNIFICATION: Imports de traduction\n');

// Fonction pour scanner et corriger les imports
function scanAndFixImports(dir, basePath = '') {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) return;
    
    const items = fs.readdirSync(fullPath);
    
    items.forEach(item => {
        const itemPath = path.join(fullPath, item);
        const relativePath = path.join(basePath, dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory() && !item.includes('node_modules')) {
            scanAndFixImports(path.join(dir, item), basePath);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
            fixFileImports(itemPath, relativePath);
        }
    });
}

function fixFileImports(filePath, relativePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Détecter les imports multiples
    const hasReactI18next = content.includes("from 'react-i18next'");
    const hasCustomHook = content.includes("from '@/lib/i18n/hooks/useTranslation'");
    const hasContext = content.includes("from '@/lib/i18n/context'");
    
    const importCount = [hasReactI18next, hasCustomHook, hasContext].filter(Boolean).length;
    
    if (importCount > 1) {
        console.log(`🔄 Correction des imports multiples: ${relativePath}`);
        
        // Supprimer tous les imports de traduction existants
        content = content.replace(/import\s+\{[^}]*useTranslation[^}]*\}\s+from\s+['"]react-i18next['"];?\n?/g, '');
        content = content.replace(/import\s+\{[^}]*useTranslation[^}]*\}\s+from\s+['"]@\/lib\/i18n\/hooks\/useTranslation['"];?\n?/g, '');
        content = content.replace(/import\s+\{[^}]*useTranslation[^}]*\}\s+from\s+['"]@\/lib\/i18n\/context['"];?\n?/g, '');
        
        // Ajouter l'import unifié au début du fichier (après les imports React)
        const lines = content.split('\n');
        let insertIndex = 0;
        
        // Trouver où insérer l'import (après les imports React/Next)
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('import') && (lines[i].includes('react') || lines[i].includes('next'))) {
                insertIndex = i + 1;
            } else if (lines[i].includes('import') && !lines[i].includes('react') && !lines[i].includes('next')) {
                break;
            }
        }
        
        // Insérer l'import unifié
        lines.splice(insertIndex, 0, "import { useTranslation } from 'react-i18next';");
        content = lines.join('\n');
        
        modified = true;
    }
    
    // Corriger les références de namespace incorrectes
    const namespaceMatches = content.match(/t\(['"]([^'"]+)\.([^'"]+)['"]\)/g);
    if (namespaceMatches) {
        namespaceMatches.forEach(match => {
            const keyMatch = match.match(/t\(['"]([^'"]+)\.([^'"]+)['"]\)/);
            if (keyMatch) {
                const [fullMatch, namespace, key] = keyMatch;
                
                // Vérifier si le namespace est utilisé correctement
                if (!content.includes(`useTranslation('${namespace}')`)) {
                    console.log(`🔄 Correction de la référence namespace: ${namespace}.${key} dans ${relativePath}`);
                    
                    // Remplacer par la syntaxe correcte
                    const correctedRef = `t('${key}', { ns: '${namespace}' })`;
                    content = content.replace(fullMatch, correctedRef);
                    modified = true;
                }
            }
        });
    }
    
    // Sauvegarder si modifié
    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ ${relativePath} corrigé`);
    }
}

// Corriger le fichier spécifique mentionné dans le diagnostic
console.log('📋 1. Correction du fichier problématique:');
const problematicFile = path.join(__dirname, 'components/reservations/availability-manager.tsx');
if (fs.existsSync(problematicFile)) {
    fixFileImports(problematicFile, 'components/reservations/availability-manager.tsx');
} else {
    console.log('⚠️  Fichier components/reservations/availability-manager.tsx non trouvé');
}

// Scanner tous les composants
console.log('\n📋 2. Scan complet des composants:');
scanAndFixImports('app');
scanAndFixImports('components');

// Créer un hook unifié recommandé
console.log('\n📋 3. Création d\'un hook unifié recommandé:');

const unifiedHook = `"use client";

import { useTranslation as useBaseTranslation } from 'react-i18next';

/**
 * Hook de traduction unifié compatible Vercel
 * Utilise react-i18next standard avec des améliorations
 */
export function useTranslation(namespaces?: string | string[]) {
  const { t: baseT, i18n, ready } = useBaseTranslation(namespaces);
  
  // Fonction de traduction améliorée
  const t = (key: string, options?: any): string => {
    try {
      const result = baseT(key, options);
      
      // Si la traduction n'est pas trouvée et qu'on a des namespaces
      if (result === key && namespaces) {
        const nsArray = Array.isArray(namespaces) ? namespaces : [namespaces];
        
        // Essayer avec chaque namespace
        for (const ns of nsArray) {
          const namespacedKey = key.includes(':') ? key : \`\${ns}:\${key}\`;
          const nsResult = baseT(namespacedKey, options);
          
          if (nsResult !== namespacedKey) {
            return nsResult;
          }
        }
      }
      
      return result;
    } catch (error) {
      console.warn('Translation error:', error);
      return key;
    }
  };
  
  return {
    t,
    i18n,
    ready,
    changeLanguage: i18n.changeLanguage,
    language: i18n.language,
  };
}

export default useTranslation;
`;

const unifiedHookPath = path.join(__dirname, 'lib/hooks/useTranslation.ts');
const hookDir = path.dirname(unifiedHookPath);

if (!fs.existsSync(hookDir)) {
    fs.mkdirSync(hookDir, { recursive: true });
}

fs.writeFileSync(unifiedHookPath, unifiedHook);
console.log('✅ Hook unifié créé: lib/hooks/useTranslation.ts');

console.log('\n🎉 UNIFICATION TERMINÉE !');
console.log('\n📋 Résumé des corrections:');
console.log('✅ Imports multiples supprimés');
console.log('✅ Import unifié react-i18next utilisé partout');
console.log('✅ Références de namespace corrigées');
console.log('✅ Hook unifié recommandé créé');

console.log('\n🚀 Prochaines étapes:');
console.log('1. Tester: npm run dev');
console.log('2. Vérifier: node verify-lofts-component.cjs');
console.log('3. Optionnel: Migrer vers lib/hooks/useTranslation.ts');