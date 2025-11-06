#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Script pour corriger les traductions en dur dans la page loft
 */
console.log('🔧 Correction des traductions en dur dans la page loft...\n');

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

// Vérifier s'il y a la fonction getStaticTranslation
if (content.includes('getStaticTranslation') && content.includes('switch (locale)')) {
  console.log('🚨 Fonction getStaticTranslation avec texte en dur détectée');
  
  // Remplacer la fonction getStaticTranslation par une version qui utilise les vraies traductions
  let correctedContent = content;
  
  // Supprimer l'ancienne fonction getStaticTranslation
  correctedContent = correctedContent.replace(
    /\/\/ Fonction pour obtenir les traductions statiques selon la langue[\s\S]*?}\s*}/,
    `// Fonction pour obtenir les traductions avec fallback
const getTranslationWithFallback = (key: string, t: any, commonT: any, billsT: any) => {
  try {
    // Essayer d'abord dans le namespace principal
    return t(key);
  } catch {
    try {
      // Essayer dans common
      return commonT(key);
    } catch {
      try {
        // Essayer dans bills
        return billsT(key);
      } catch {
        // Retourner la clé si aucune traduction trouvée
        console.warn(\`Translation missing for key: \${key}\`);
        return key;
      }
    }
  }
};`
  );

  // Remplacer les appels à getStaticTranslation
  correctedContent = correctedContent.replace(
    /getStaticTranslation\(/g,
    'getTranslationWithFallback('
  );

  // Ajouter les imports de traductions nécessaires dans le composant
  // Chercher où les traductions sont utilisées et ajouter les hooks
  if (correctedContent.includes('getTranslationWithFallback')) {
    // Ajouter les hooks de traduction au début du composant
    correctedContent = correctedContent.replace(
      /(export default async function LoftDetailPage[\s\S]*?{)/,
      `$1
  
  // Obtenir les traductions côté serveur
  const t = await getTranslations('lofts.details');
  const commonT = await getTranslations('common');
  const billsT = await getTranslations('bills');`
    );
    
    // Mettre à jour les appels pour passer les traductions
    correctedContent = correctedContent.replace(
      /getTranslationWithFallback\(([^,]+),\s*t,/g,
      'getTranslationWithFallback($1, t, commonT, billsT,'
    );
  }

  // Sauvegarder le fichier corrigé
  try {
    fs.writeFileSync(filePath, correctedContent, 'utf8');
    console.log('✅ Fichier corrigé et sauvegardé');
    
    // Afficher un résumé des changements
    const oldLines = content.split('\n').length;
    const newLines = correctedContent.split('\n').length;
    console.log(`📊 Lignes avant: ${oldLines}, après: ${newLines}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error.message);
    process.exit(1);
  }

} else {
  console.log('ℹ️  Aucune fonction getStaticTranslation détectée dans ce fichier');
}

// Créer également un script pour corriger les autres fichiers avec du texte en dur
console.log('\n🔧 Création d\'un script de correction globale...');

const globalFixScript = `#!/usr/bin/env node

// Script pour corriger automatiquement les textes en dur les plus courants

import fs from 'fs';
import path from 'path';

const replacements = {
  '"Disponible"': 't("available")',
  '"Type de propriété"': 't("propertyType")',
  '"Description"': 't("description")',
  '"Propriétaire"': 't("owner")',
  '"الهاتف"': 't("phone")',
  '"المياه"': 't("water")',
  '"الكهرباء"': 't("electricity")',
  '"الغاز"': 't("gas")',
  '"الإنترنت"': 't("internet")',
  '"معرض الصور"': 't("photoGallery")',
  '"معلومات إضافية"': 't("additionalInfo")',
  '"تم الإنشاء في"': 't("createdOn")',
  '"آخر تحديث"': 't("lastUpdated")',
  '"إدارة الفواتير"': 't("billManagement")',
  '"غير محدد"': 't("undefined")',
  '"الفواتير القادمة"': 't("upcomingBills")'
};

// Cette fonction pourrait être utilisée pour corriger automatiquement les fichiers
// Mais il faut faire attention au contexte et aux namespaces
console.log('Remplacements suggérés:');
Object.entries(replacements).forEach(([old, new_]) => {
  console.log(\`  \${old} → \${new_}\`);
});
`;

fs.writeFileSync('scripts/global-text-replacements.js', globalFixScript);

console.log('\n✨ Correction terminée !');
console.log('\n💡 Prochaines étapes:');
console.log('   1. Redémarrer l\'application pour voir les changements');
console.log('   2. Vérifier que l\'interface utilise maintenant les vraies traductions');
console.log('   3. Si le problème persiste, corriger les autres fichiers détectés');
console.log('   4. Utiliser le rapport hardcoded-text-report.json pour identifier les autres fichiers');