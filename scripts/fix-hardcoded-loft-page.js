#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Script pour corriger le fichier loft page qui contient du texte en dur
 */
console.log('🔧 Correction du fichier loft page avec texte en dur...\n');

const filePath = 'app/[locale]/lofts/[id]/page.tsx';

// Lire le fichier actuel
let content;
try {
  content = fs.readFileSync(filePath, 'utf8');
  console.log('✅ Fichier lu avec succès');
} catch (error) {
  console.error('❌ Erreur lors de la lecture du fichier:', error.message);
  process.exit(1);
}

// Vérifier s'il y a une fonction de traduction en dur
if (content.includes('switch (locale)') && content.includes('case \'ar\':')) {
  console.log('🚨 Fonction de traduction en dur détectée');
  
  // Remplacer la fonction de traduction en dur par useTranslations
  const correctedContent = content.replace(
    /\/\/ Fonction de traduction locale[\s\S]*?return key;\s*}\s*}\s*}/,
    `// Utiliser les traductions Next.js
  const t = useTranslations('lofts.details');
  const commonT = useTranslations('common');
  const billsT = useTranslations('bills');
  
  // Fonction helper pour obtenir les traductions
  const getLocalizedText = (key: string): string => {
    // Essayer d'abord dans le namespace lofts.details
    try {
      return t(key);
    } catch {
      // Essayer dans common
      try {
        return commonT(key);
      } catch {
        // Essayer dans bills
        try {
          return billsT(key);
        } catch {
          // Retourner la clé si aucune traduction trouvée
          return key;
        }
      }
    }
  };`
  );

  // Remplacer les appels à la fonction de traduction
  const finalContent = correctedContent.replace(
    /getLocalizedText\(/g,
    't('
  );

  // Sauvegarder le fichier corrigé
  try {
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log('✅ Fichier corrigé et sauvegardé');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error.message);
    process.exit(1);
  }

} else {
  console.log('ℹ️  Aucune fonction de traduction en dur détectée dans ce fichier');
}

console.log('\n✨ Correction terminée !');
console.log('\n💡 Prochaines étapes:');
console.log('   1. Vérifier que le fichier utilise maintenant useTranslations()');
console.log('   2. Redémarrer l\'application');
console.log('   3. Tester l\'interface pour vérifier que le mélange de langues est résolu');