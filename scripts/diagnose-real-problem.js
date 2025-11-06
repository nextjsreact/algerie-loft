#!/usr/bin/env node

/**
 * Script de diagnostic pour identifier la vraie cause du problème
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 DIAGNOSTIC COMPLET DU PROBLÈME DE MÉLANGE DE LANGUES\n');

// Analyser le texte problématique
const problematicText = `مدير الشقةتبديل المظهرلوحة التحكمالمحادثاتالإشعاراتالشققالعملاءالحجوزاتالتوفرالمهامالفرقالملاكالمعاملاتالتقاريرالإعداداتHabibo Adminمسؤولتسجيل الخروجStudio Cosy HydraDisponible42 Chemin des Glycines, Hydra, AlgerModifier l'appartementDétails du LoftHistorique d'auditInformations sur l'appartementPrix par nuit6 000 DAPropriétaireLoft AlgerieType de propriétéSociétéDescriptionStudio élégant dans le quartier résidentiel d'HydraPourcentages50%Société50%PropriétaireInformations supplémentairesEauÉlectricitéGazProchaines factures📸Galerie de photosInformations supplémentairesCréé le29/10/2025Dernière mise à jour29/10/2025Gestion des facturesإدارة الفواتيرالمياهلم يتم تعيين ترددغير محددالطاقةلم يتم تعيين ترددغير محددالهاتفلم يتم تعيين ترددغير محددالإنترنتلم يتم تعيين ترددغير محددلم يتم تعيين تواريخ استحقاق الفواتيرقم بتعديل الشقة لإضافة ترددات الفواتير وتواريخ الاستحقاق`;

console.log('📝 ANALYSE DU TEXTE PROBLÉMATIQUE:');
console.log('Longueur:', problematicText.length, 'caractères');

// Identifier les patterns
const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;
const frenchPattern = /[A-Za-zÀ-ÿ]+/g;
const numberPattern = /\d+/g;

const arabicMatches = problematicText.match(arabicPattern) || [];
const frenchMatches = problematicText.match(frenchPattern) || [];
const numberMatches = problematicText.match(numberPattern) || [];

console.log('\n🔤 SEGMENTS IDENTIFIÉS:');
console.log('Textes arabes:', arabicMatches.length, 'segments');
console.log('Textes français/anglais:', frenchMatches.length, 'segments');
console.log('Nombres:', numberMatches.length, 'segments');

console.log('\n📱 TEXTES ARABES:');
arabicMatches.slice(0, 10).forEach((text, i) => {
  console.log(`${i + 1}. "${text}"`);
});

console.log('\n🇫🇷 TEXTES FRANÇAIS:');
frenchMatches.slice(0, 10).forEach((text, i) => {
  console.log(`${i + 1}. "${text}"`);
});

// Analyser la structure
console.log('\n🏗️  ANALYSE DE LA STRUCTURE:');

// Le texte semble être une concaténation de tous les éléments de l'interface
// Cela suggère que le problème vient du rendu HTML/CSS, pas des traductions

console.log('❌ PROBLÈME IDENTIFIÉ:');
console.log('Le texte montre une concaténation de TOUS les éléments de l\'interface');
console.log('Cela indique un problème de CSS où les éléments perdent leur espacement');

console.log('\n🎯 CAUSES POSSIBLES:');
console.log('1. CSS qui supprime les marges/padding');
console.log('2. Éléments en position absolute qui se chevauchent');
console.log('3. Problème de z-index');
console.log('4. CSS qui force display:inline sans espacement');
console.log('5. Problème de direction de texte (RTL/LTR)');

// Vérifier les fichiers CSS
console.log('\n🔍 VÉRIFICATION DES FICHIERS CSS:');

const cssFiles = [
  'app/globals.css',
  'styles/conversations.css',
  'styles/whatsapp.css',
  'app/nuclear-spacing-fix.css'
];

cssFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const size = Math.round(content.length / 1024);
    console.log(`✅ ${file}: ${size}KB`);
    
    // Vérifier les règles problématiques
    const problematicRules = [
      'margin: 0',
      'padding: 0',
      'display: inline',
      'position: absolute',
      'white-space: nowrap'
    ];
    
    problematicRules.forEach(rule => {
      if (content.includes(rule)) {
        console.log(`   ⚠️  Contient: ${rule}`);
      }
    });
  } else {
    console.log(`❌ ${file}: Non trouvé`);
  }
});

console.log('\n💡 SOLUTIONS RECOMMANDÉES:');
console.log('1. Vérifier si le CSS nucléaire est bien appliqué');
console.log('2. Inspecter l\'élément dans le navigateur');
console.log('3. Vérifier les styles Tailwind qui pourraient interférer');
console.log('4. Tester avec les outils de développement');

console.log('\n🚀 ACTIONS IMMÉDIATES:');
console.log('1. Redémarrer l\'application avec le CSS nucléaire');
console.log('2. Ouvrir les outils de développement');
console.log('3. Inspecter l\'élément problématique');
console.log('4. Vérifier si les styles sont appliqués');

console.log('\n🎯 SI LE PROBLÈME PERSISTE:');
console.log('Le problème ne vient PAS des traductions mais du CSS/HTML');
console.log('Il faut identifier quel CSS supprime l\'espacement entre les éléments');

// Créer un fichier de diagnostic HTML
const diagnosticHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test de Diagnostic</title>
    <style>
        /* Test sans CSS - espacement normal */
        .normal { margin: 10px; padding: 5px; }
        
        /* Test avec problème - pas d'espacement */
        .problematic * { margin: 0; padding: 0; display: inline; }
    </style>
</head>
<body>
    <h1>Test de Diagnostic du Problème d'Espacement</h1>
    
    <h2>Rendu Normal (avec espacement):</h2>
    <div class="normal">
        <span>مدير الشقة</span>
        <span>تبديل المظهر</span>
        <span>لوحة التحكم</span>
        <span>Modifier l'appartement</span>
        <span>Détails du Loft</span>
    </div>
    
    <h2>Rendu Problématique (sans espacement):</h2>
    <div class="problematic">
        <span>مدير الشقة</span>
        <span>تبديل المظهر</span>
        <span>لوحة التحكم</span>
        <span>Modifier l'appartement</span>
        <span>Détails du Loft</span>
    </div>
    
    <p>Si le deuxième exemple ressemble à votre problème, c'est bien un problème CSS !</p>
</body>
</html>`;

const diagnosticPath = path.join(__dirname, '..', 'diagnostic-test.html');
fs.writeFileSync(diagnosticPath, diagnosticHTML);

console.log(`\n📄 Fichier de test créé: ${diagnosticPath}`);
console.log('Ouvrez ce fichier dans votre navigateur pour voir la différence !');