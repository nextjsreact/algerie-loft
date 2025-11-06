#!/usr/bin/env node

/**
 * Script pour identifier et corriger les problèmes d'espacement CSS
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Correction des problèmes d\'espacement CSS...\n');

// Créer un fichier CSS pour corriger les problèmes d'espacement
const cssFixContent = `
/* Corrections pour les problèmes d'espacement et de mélange de langues */

/* Assurer un espacement correct entre les éléments de navigation */
.sidebar-nav-item {
  margin-bottom: 0.25rem !important;
  padding: 0.5rem !important;
  display: block !important;
}

/* Espacement pour les éléments de texte */
.text-element {
  margin-right: 0.25rem !important;
  margin-left: 0.25rem !important;
}

/* Correction pour les badges et labels */
.badge, .label {
  margin: 0.125rem !important;
  padding: 0.25rem 0.5rem !important;
  display: inline-block !important;
}

/* Espacement pour les cartes et conteneurs */
.card-content > * {
  margin-bottom: 0.5rem !important;
}

.card-content > *:last-child {
  margin-bottom: 0 !important;
}

/* Correction pour les éléments flex */
.flex-container > * {
  margin-right: 0.5rem !important;
}

.flex-container > *:last-child {
  margin-right: 0 !important;
}

/* Correction spécifique pour les problèmes identifiés */
.loft-detail-page * {
  word-spacing: normal !important;
  letter-spacing: normal !important;
}

/* Assurer que les éléments ne se collent pas */
* + * {
  margin-left: 0.125rem !important;
}

/* Correction pour les éléments de navigation */
nav a, nav button {
  margin: 0.125rem !important;
  padding: 0.25rem 0.5rem !important;
}
`;

// Sauvegarder le fichier CSS
const cssPath = path.join(__dirname, '..', 'styles', 'spacing-fix.css');
const stylesDir = path.join(__dirname, '..', 'styles');

// Créer le dossier styles s'il n'existe pas
if (!fs.existsSync(stylesDir)) {
  fs.mkdirSync(stylesDir, { recursive: true });
}

fs.writeFileSync(cssPath, cssFixContent);

console.log('✅ Fichier CSS de correction créé:', cssPath);

console.log('\n🎯 Corrections appliquées:');
console.log('1. Fichier CSS avec corrections d\'espacement');

console.log('\n🚀 Prochaines étapes:');
console.log('1. Importer le CSS dans votre globals.css');
console.log('2. Redémarrer l\'application');
console.log('3. Tester la page loft pour vérifier les corrections');

console.log('\n💡 Si le problème persiste:');
console.log('1. Inspecter l\'élément dans le navigateur');
console.log('2. Vérifier si les styles CSS sont appliqués');
console.log('3. Ajuster les valeurs de margin/padding si nécessaire');