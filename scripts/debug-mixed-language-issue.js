#!/usr/bin/env node

/**
 * Script pour déboguer le problème de mélange de langues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Débogage du problème de mélange de langues...\n');

// Analyser le texte problématique fourni par l'utilisateur
const problematicText = `مدير الشقةتبديل المظهرلوحة التحكمالمحادثاتالإشعاراتالشققالعملاءالحجوزاتالتوفرالمهامالفرقالملاكالمعاملاتالتقاريرالإعداداتHAHabibo Adminمسؤولتسجيل الخروجStudio Cosy HydraDisponible42 Chemin des Glycines, Hydra, AlgerModifier l'appartementDétails du LoftHistorique d'auditInformations sur l'appartementPrix par nuit6 000 DAPropriétaireLoft AlgerieType de propriétéSociétéDescriptionStudio élégant dans le quartier résidentiel d'HydraPourcentages50%Société50%PropriétaireInformations supplémentairesEauÉlectricitéGazProchaines factures📸Galerie de photosلا توجد صور متاحةلم تتم إضافة صور لهذه الشقة بعد.Informations supplémentairesCréé le29/10/2025Dernière mise à jour29/10/2025Gestion des facturesإدارة الفواتيرالمياهلم يتم تعيين ترددغير محددالطاقةلم يتم تعيين ترددغير محددالهاتفلم يتم تعيين ترددغير محددالإنترنتلم يتم تعيين ترددغير محددلم يتم تعيين تواريخ استحقاق الفواتيرقم بتعديل الشقة لإضافة ترددات الفواتير وتواريخ الاستحقاق`;

console.log('📝 Analyse du texte problématique:');
console.log('Longueur totale:', problematicText.length, 'caractères\n');

// Identifier les segments de texte
const segments = [];
let currentSegment = '';
let currentLang = null;

for (let i = 0; i < problematicText.length; i++) {
  const char = problematicText[i];
  const charCode = char.charCodeAt(0);
  
  let lang = null;
  if (charCode >= 0x0600 && charCode <= 0x06FF) {
    lang = 'arabic';
  } else if (charCode >= 0x0041 && charCode <= 0x007A) {
    lang = 'latin';
  } else if (charCode >= 0x0030 && charCode <= 0x0039) {
    lang = 'number';
  } else {
    lang = 'other';
  }
  
  if (lang !== currentLang && currentSegment) {
    segments.push({ text: currentSegment, lang: currentLang });
    currentSegment = '';
  }
  
  currentSegment += char;
  currentLang = lang;
}

if (currentSegment) {
  segments.push({ text: currentSegment, lang: currentLang });
}

console.log('🔤 Segments identifiés:');
segments.forEach((segment, index) => {
  console.log(`${index + 1}. [${segment.lang.toUpperCase()}] "${segment.text}"`);
});

console.log('\n🎯 Analyse des problèmes:');

// Identifier les textes arabes
const arabicSegments = segments.filter(s => s.lang === 'arabic');
console.log('\n📱 Textes arabes trouvés:');
arabicSegments.forEach((segment, index) => {
  console.log(`${index + 1}. "${segment.text}"`);
});

// Identifier les textes français
const frenchSegments = segments.filter(s => s.lang === 'latin').filter(s => 
  s.text.includes('Modifier') || 
  s.text.includes('Détails') || 
  s.text.includes('Informations') ||
  s.text.includes('Gestion') ||
  s.text.includes('Galerie') ||
  s.text.includes('Créé') ||
  s.text.includes('Dernière')
);

console.log('\n🇫🇷 Textes français trouvés:');
frenchSegments.forEach((segment, index) => {
  console.log(`${index + 1}. "${segment.text}"`);
});

console.log('\n🔍 Diagnostic:');
console.log('1. Le texte contient un mélange d\'arabe, français et anglais');
console.log('2. Les textes semblent être concaténés sans espaces');
console.log('3. Cela suggère un problème de CSS ou de rendu HTML');

console.log('\n💡 Solutions possibles:');
console.log('1. Vérifier les styles CSS pour les espaces entre éléments');
console.log('2. Vérifier si les composants ont des marges/padding appropriés');
console.log('3. Vérifier la direction du texte (RTL/LTR) pour l\'arabe');
console.log('4. Vérifier si les traductions sont correctement appliquées');

console.log('\n🚀 Actions recommandées:');
console.log('1. Inspecter l\'élément dans le navigateur pour voir la structure HTML');
console.log('2. Vérifier les styles CSS appliqués');
console.log('3. Tester avec différentes langues pour isoler le problème');
console.log('4. Vérifier la configuration next-intl');

// Sauvegarder l'analyse
const analysis = {
  timestamp: new Date().toISOString(),
  originalText: problematicText,
  segments,
  arabicSegments: arabicSegments.map(s => s.text),
  frenchSegments: frenchSegments.map(s => s.text),
  totalLength: problematicText.length,
  segmentCount: segments.length
};

const reportPath = path.join(__dirname, '..', 'mixed-language-debug-report.json');
fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));

console.log(`\n📄 Rapport d'analyse sauvegardé: ${reportPath}`);