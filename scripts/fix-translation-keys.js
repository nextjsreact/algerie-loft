#!/usr/bin/env node

import fs from 'fs';

/**
 * Correction des clés de traduction incorrectes
 */
console.log('🔧 Correction des clés de traduction incorrectes...\n');

const filePath = 'app/[locale]/lofts/[id]/page.tsx';

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Mapping des clés incorrectes vers les bonnes clés
  const keyMappings = {
    "'percentages'": "'additionalInfo.percentages'",
    "'utilityInfo.title'": "'additionalInfo.title'",
    "'utilityInfo.nextBills'": "'billManagement.nextBills'",
    "'photos.photoGallery'": "'additionalInfo.photoGallery'",
    "'billManagement.title'": "'billManagement.title'", // Déjà correct
    "'additionalInfo.createdOn'": "'additionalInfo.createdOn'", // Déjà correct
    "'additionalInfo.lastUpdated'": "'additionalInfo.lastUpdated'", // Déjà correct
    "'notSet'": "'billManagement.notSet'",
    "'photosAvailable'": "'additionalInfo.photosAvailable'"
  };
  
  console.log('🔍 Recherche et correction des clés incorrectes...');
  
  let changesMade = 0;
  
  Object.entries(keyMappings).forEach(([oldKey, newKey]) => {
    if (oldKey !== newKey) { // Seulement si la clé doit changer
      const regex = new RegExp(oldKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      
      if (matches) {
        content = content.replace(regex, newKey);
        changesMade += matches.length;
        console.log(`   ✅ ${oldKey} → ${newKey}: ${matches.length} remplacements`);
      }
    }
  });
  
  // Vérifier les clés communes qui pourraient être mal placées
  const commonKeys = [
    { pattern: /'water'/, correct: "'billManagement.water'" },
    { pattern: /'electricity'/, correct: "'billManagement.electricity'" },
    { pattern: /'gas'/, correct: "'billManagement.gas'" },
    { pattern: /'phone'/, correct: "'billManagement.phone'" },
    { pattern: /'internet'/, correct: "'billManagement.internet'" }
  ];
  
  commonKeys.forEach(({ pattern, correct }) => {
    const matches = content.match(pattern);
    if (matches) {
      // Vérifier si c'est dans un contexte de getTranslationWithFallback
      const contextRegex = new RegExp(`getTranslationWithFallback\\(${pattern.source}`, 'g');
      const contextMatches = content.match(contextRegex);
      
      if (contextMatches) {
        content = content.replace(contextRegex, `getTranslationWithFallback(${correct}`);
        changesMade += contextMatches.length;
        console.log(`   ✅ ${pattern.source} → ${correct}: ${contextMatches.length} remplacements`);
      }
    }
  });
  
  // Sauvegarder si des changements ont été faits
  if (changesMade > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`\n✅ ${changesMade} corrections de clés appliquées`);
  } else {
    console.log('\n✅ Aucune correction de clé nécessaire');
  }
  
  // Vérifier les traductions manquantes potentielles
  console.log('\n🔍 Vérification des traductions dans les fichiers JSON...');
  
  const languages = ['fr', 'en', 'ar'];
  const keysToCheck = [
    'lofts.additionalInfo.percentages',
    'lofts.billManagement.title',
    'lofts.additionalInfo.title',
    'common.company',
    'lofts.details.owner'
  ];
  
  languages.forEach(lang => {
    console.log(`\n📋 ${lang.toUpperCase()}:`);
    
    try {
      const translationContent = fs.readFileSync(`messages/${lang}.json`, 'utf8');
      const translations = JSON.parse(translationContent);
      
      keysToCheck.forEach(key => {
        const keyParts = key.split('.');
        let current = translations;
        let exists = true;
        
        for (const part of keyParts) {
          if (current && typeof current === 'object' && part in current) {
            current = current[part];
          } else {
            exists = false;
            break;
          }
        }
        
        console.log(`   ${key}: ${exists ? '✅' : '❌'}`);
      });
      
    } catch (error) {
      console.log(`   ❌ Erreur lecture ${lang}.json`);
    }
  });
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}

console.log('\n✨ Correction des clés terminée !');