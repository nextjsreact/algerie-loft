#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Script de validation finale pour vérifier que le mélange de langues est résolu
 */
console.log('🔍 Validation finale des corrections de traductions...\n');

// 1. Vérifier que les traductions critiques existent
const languages = ['fr', 'en', 'ar'];
const translationFiles = {};

console.log('📂 Vérification des fichiers de traduction...');
languages.forEach(lang => {
  const filePath = path.join('messages', `${lang}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    translationFiles[lang] = JSON.parse(content);
    console.log(`✅ ${lang}.json chargé`);
  } catch (error) {
    console.error(`❌ Erreur ${lang}.json:`, error.message);
    translationFiles[lang] = {};
  }
});

// Fonction pour obtenir une traduction
function getTranslation(lang, key) {
  const keys = key.split('.');
  let current = translationFiles[lang];
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return null;
    }
  }
  
  return current;
}

// 2. Vérifier les clés critiques qui causaient le mélange
const criticalKeys = [
  'lofts.details.title',
  'lofts.details.pricePerNight', 
  'lofts.details.owner',
  'lofts.details.propertyType',
  'lofts.details.description',
  'lofts.details.amenities',
  'lofts.details.gallery',
  'lofts.details.additionalInfo',
  'lofts.details.createdAt',
  'lofts.details.lastUpdated',
  'bills.management.title',
  'bills.management.water',
  'bills.management.electricity',
  'bills.management.gas',
  'bills.management.phone',
  'bills.management.internet',
  'bills.frequency.notSet',
  'bills.frequency.undefined',
  'common.available',
  'common.company',
  'common.percentages'
];

console.log('\n🔍 Vérification des clés critiques...');
let allKeysPresent = true;

criticalKeys.forEach(key => {
  const results = {};
  languages.forEach(lang => {
    results[lang] = getTranslation(lang, key) !== null;
  });
  
  const allLangsPresent = Object.values(results).every(present => present);
  if (allLangsPresent) {
    console.log(`✅ ${key}`);
  } else {
    console.log(`❌ ${key} - Manquant dans: ${Object.entries(results).filter(([lang, present]) => !present).map(([lang]) => lang).join(', ')}`);
    allKeysPresent = false;
  }
});

// 3. Vérifier que le fichier loft page n'a plus de texte en dur
console.log('\n🔍 Vérification du fichier loft page...');
const loftPagePath = 'app/[locale]/lofts/[id]/page.tsx';

try {
  const loftPageContent = fs.readFileSync(loftPagePath, 'utf8');
  
  const hasHardcodedArabic = /['"][\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+['"]/.test(loftPageContent);
  const hasGetStaticTranslation = loftPageContent.includes('getStaticTranslation');
  const hasUseTranslations = loftPageContent.includes('getTranslations');
  
  if (hasHardcodedArabic) {
    console.log('⚠️  Texte arabe en dur encore présent dans le fichier loft page');
  } else {
    console.log('✅ Aucun texte arabe en dur détecté dans le fichier loft page');
  }
  
  if (hasGetStaticTranslation) {
    console.log('⚠️  Fonction getStaticTranslation encore présente');
  } else {
    console.log('✅ Fonction getStaticTranslation supprimée');
  }
  
  if (hasUseTranslations) {
    console.log('✅ Utilise getTranslations pour les traductions côté serveur');
  } else {
    console.log('⚠️  N\'utilise pas getTranslations');
  }
  
} catch (error) {
  console.error('❌ Erreur lors de la vérification du fichier loft page:', error.message);
}

// 4. Compter les textes en dur restants
console.log('\n🔍 Scan rapide des textes en dur restants...');

const problematicTexts = [
  'Disponible',
  'Type de propriété', 
  'Description',
  'Propriétaire',
  'الهاتف',
  'المياه',
  'الكهرباء',
  'الغاز'
];

let totalHardcodedFound = 0;
const directories = ['components', 'app'];

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir, { recursive: true });
    files.forEach(file => {
      if (typeof file === 'string' && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
        const fullPath = path.join(dir, file);
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          problematicTexts.forEach(text => {
            const regex = new RegExp(`["'\`]${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'\`]`, 'g');
            const matches = content.match(regex);
            if (matches) {
              totalHardcodedFound += matches.length;
            }
          });
        } catch (error) {
          // Ignorer les erreurs de lecture
        }
      }
    });
  }
});

console.log(`📊 Textes en dur restants: ${totalHardcodedFound}`);

// 5. Résumé final
console.log('\n📊 RÉSUMÉ DE VALIDATION:');

if (allKeysPresent) {
  console.log('✅ Toutes les traductions critiques sont présentes');
} else {
  console.log('❌ Certaines traductions critiques sont manquantes');
}

if (totalHardcodedFound === 0) {
  console.log('✅ Aucun texte en dur problématique détecté');
} else {
  console.log(`⚠️  ${totalHardcodedFound} textes en dur encore présents`);
}

// Verdict final
if (allKeysPresent && totalHardcodedFound < 5) {
  console.log('\n🎉 ✅ VALIDATION RÉUSSIE !');
  console.log('   Le mélange de langues devrait être largement résolu.');
  console.log('   Redémarrez l\'application pour voir les améliorations.');
} else if (allKeysPresent) {
  console.log('\n⚠️  ✅ VALIDATION PARTIELLE');
  console.log('   Les traductions principales sont présentes mais quelques textes en dur subsistent.');
  console.log('   L\'interface devrait être beaucoup mieux mais peut nécessiter des ajustements mineurs.');
} else {
  console.log('\n❌ VALIDATION ÉCHOUÉE');
  console.log('   Des traductions critiques sont encore manquantes.');
  console.log('   Exécutez à nouveau les scripts de correction.');
}

console.log('\n💡 Recommandations finales:');
console.log('   1. Redémarrez l\'application: npm run dev');
console.log('   2. Testez l\'interface en arabe pour vérifier les améliorations');
console.log('   3. Si des problèmes persistent, utilisez le rapport hardcoded-text-report.json');
console.log('   4. Corrigez manuellement les derniers textes en dur si nécessaire');

console.log('\n✨ Validation terminée !');