#!/usr/bin/env node

import fs from 'fs';

/**
 * Correction globale de tous les appels de traduction
 */
console.log('🔧 Correction globale des appels de traduction...\n');

const filePath = 'app/[locale]/lofts/[id]/page.tsx';

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  console.log('🔍 Avant corrections:');
  console.log(`   Taille du fichier: ${content.length} caractères`);
  
  // Remplacements globaux
  const replacements = [
    { from: /commonT/g, to: 'tCommon', desc: 'commonT → tCommon' },
    { from: /billsT/g, to: 'tBills', desc: 'billsT → tBills' },
    { from: /"Société"/g, to: 'tCommon("company")', desc: '"Société" → tCommon("company")' },
    { from: /"Propriétaire"/g, to: 'tDetails("owner")', desc: '"Propriétaire" → tDetails("owner")' },
    { from: /"Description"/g, to: 'tDetails("description")', desc: '"Description" → tDetails("description")' },
    { from: /"Disponible"/g, to: 'tCommon("available")', desc: '"Disponible" → tCommon("available")' }
  ];
  
  let changesMade = 0;
  
  replacements.forEach(replacement => {
    const matches = content.match(replacement.from);
    if (matches) {
      content = content.replace(replacement.from, replacement.to);
      changesMade += matches.length;
      console.log(`   ✅ ${replacement.desc}: ${matches.length} remplacements`);
    }
  });
  
  // Sauvegarder si des changements ont été faits
  if (changesMade > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`\n✅ ${changesMade} corrections appliquées et sauvegardées`);
  } else {
    console.log('\n✅ Aucune correction nécessaire');
  }
  
  console.log('\n🔍 Après corrections:');
  console.log(`   Taille du fichier: ${content.length} caractères`);
  
  // Vérifications finales
  const hasCommonT = content.includes('commonT');
  const hasBillsT = content.includes('billsT');
  const hasHardcodedText = content.includes('"Société"') || content.includes('"Propriétaire"');
  
  console.log('\n📊 Vérifications finales:');
  console.log(`   Références à commonT: ${hasCommonT ? '❌ RESTE' : '✅ CORRIGÉ'}`);
  console.log(`   Références à billsT: ${hasBillsT ? '❌ RESTE' : '✅ CORRIGÉ'}`);
  console.log(`   Textes en dur: ${hasHardcodedText ? '❌ RESTE' : '✅ CORRIGÉ'}`);
  
  if (!hasCommonT && !hasBillsT && !hasHardcodedText) {
    console.log('\n🎉 ✅ TOUTES LES CORRECTIONS APPLIQUÉES !');
    console.log('   Le fichier devrait maintenant fonctionner sans erreurs');
  } else {
    console.log('\n⚠️  Certains problèmes peuvent subsister');
  }
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}

console.log('\n✨ Correction globale terminée !');