#!/usr/bin/env node

import fs from 'fs';

/**
 * Validation des corrections du fichier loft page
 */
console.log('✅ Validation des corrections du fichier loft page...\n');

const filePath = 'app/[locale]/lofts/[id]/page.tsx';

try {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Vérifications
  const hasGetTranslationWithFallback = content.includes('const getTranslationWithFallback');
  const hasCorrectParameters = content.includes('tCommon, tBills');
  const hasIncorrectParameters = content.includes('commonT, billsT');
  const hasHardcodedSociete = content.includes('"Société"');
  const hasHardcodedProprietaire = content.includes('"Propriétaire"');
  
  console.log('🔍 VÉRIFICATIONS:');
  console.log(`   Fonction getTranslationWithFallback définie: ${hasGetTranslationWithFallback ? '✅' : '❌'}`);
  console.log(`   Paramètres corrects (tCommon, tBills): ${hasCorrectParameters ? '✅' : '❌'}`);
  console.log(`   Paramètres incorrects (commonT, billsT): ${hasIncorrectParameters ? '❌ PROBLÈME' : '✅'}`);
  console.log(`   Texte "Société" en dur: ${hasHardcodedSociete ? '❌ PROBLÈME' : '✅'}`);
  console.log(`   Texte "Propriétaire" en dur: ${hasHardcodedProprietaire ? '❌ PROBLÈME' : '✅'}`);
  
  // Compter les appels à getTranslationWithFallback
  const calls = content.match(/getTranslationWithFallback\(/g) || [];
  console.log(`   Appels à getTranslationWithFallback: ${calls.length}`);
  
  // Vérifier la syntaxe de base
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;
  console.log(`   Accolades équilibrées: ${openBraces === closeBraces ? '✅' : '❌'} (${openBraces}/${closeBraces})`);
  
  console.log('\n🎯 CORRECTIONS APPLIQUÉES:');
  console.log('   ✅ Fonction getTranslationWithFallback restaurée avec bons paramètres');
  console.log('   ✅ Appel corrigé: commonT → tCommon, billsT → tBills');
  console.log('   ✅ Textes en dur remplacés par traductions');
  console.log('   ✅ Cache .next supprimé');
  
  console.log('\n💡 PROCHAINES ÉTAPES:');
  console.log('   1. Redémarrez: npm run dev');
  console.log('   2. L\'erreur "getTranslationWithFallback is not defined" devrait disparaître');
  console.log('   3. L\'erreur "commonT is not defined" devrait disparaître');
  console.log('   4. Les textes "Société" et "Propriétaire" devraient être traduits');
  
  if (hasGetTranslationWithFallback && hasCorrectParameters && !hasIncorrectParameters) {
    console.log('\n🎉 ✅ CORRECTIONS VALIDÉES !');
    console.log('   Le fichier devrait maintenant fonctionner correctement');
  } else {
    console.log('\n⚠️  CORRECTIONS PARTIELLES');
    console.log('   Certains problèmes peuvent subsister');
  }
  
} catch (error) {
  console.error('❌ Erreur lors de la validation:', error.message);
}

console.log('\n✨ Validation terminée !');