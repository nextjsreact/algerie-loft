#!/usr/bin/env node

import fs from 'fs';

/**
 * Trouver tous les textes en dur dans le fichier loft page
 */
console.log('🔍 Recherche de textes en dur dans le fichier loft page...\n');

const filePath = 'app/[locale]/lofts/[id]/page.tsx';

try {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Patterns pour détecter les textes en dur
  const hardcodedPatterns = [
    { pattern: /"[A-Za-z\s]{3,}"/g, desc: 'Textes anglais/français en dur' },
    { pattern: /"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]{3,}"/g, desc: 'Textes arabes en dur' },
    { pattern: />[A-Za-z\s]{3,}</g, desc: 'Textes dans les balises' },
    { pattern: /TabsTrigger[^>]*>([^<]+)</g, desc: 'Textes dans les onglets' }
  ];
  
  console.log('📋 TEXTES EN DUR DÉTECTÉS:\n');
  
  let totalFound = 0;
  
  hardcodedPatterns.forEach(({ pattern, desc }) => {
    const matches = content.match(pattern) || [];
    
    if (matches.length > 0) {
      console.log(`${desc} (${matches.length}):`);
      
      // Afficher les premiers matches uniques
      const uniqueMatches = [...new Set(matches)].slice(0, 10);
      uniqueMatches.forEach(match => {
        console.log(`   - ${match}`);
      });
      
      if (matches.length > 10) {
        console.log(`   ... et ${matches.length - 10} autres`);
      }
      
      console.log('');
      totalFound += matches.length;
    }
  });
  
  // Recherche spécifique pour les textes problématiques identifiés
  const specificTexts = [
    'Loft Details',
    'Audit History', 
    'Informations sur l\'appartement',
    'Prix par nuit',
    'Propriétaire',
    'Type de propriété',
    'Société',
    'Description',
    'Disponible',
    'Modifier l\'appartement',
    'لا توجد صور متاحة',
    'إدارة الفواتير'
  ];
  
  console.log('🎯 RECHERCHE SPÉCIFIQUE:\n');
  
  specificTexts.forEach(text => {
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const matches = content.match(regex);
    
    if (matches) {
      console.log(`✅ TROUVÉ: "${text}" (${matches.length} occurrences)`);
    } else {
      console.log(`❌ Absent: "${text}"`);
    }
  });
  
  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`   Total textes en dur détectés: ${totalFound}`);
  
  if (totalFound > 0) {
    console.log('\n💡 RECOMMANDATIONS:');
    console.log('   1. Remplacer les textes en dur par des appels de traduction');
    console.log('   2. Vérifier les composants importés pour les textes en dur');
    console.log('   3. Utiliser useTranslations() dans tous les composants');
  } else {
    console.log('\n✅ Aucun texte en dur évident détecté dans ce fichier');
    console.log('   Le problème vient probablement des composants importés');
  }
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}

console.log('\n✨ Recherche terminée !');