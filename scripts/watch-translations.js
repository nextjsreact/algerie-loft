#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Surveillance simple des traductions
 * Vérifie périodiquement les changements dans les fichiers de code
 */
console.log('👀 Démarrage de la surveillance des traductions...\n');

const languages = ['fr', 'en', 'ar'];
let translationFiles = {};
let lastScanResults = {};

// Patterns pour détecter les clés de traduction
const translationPatterns = [
  /t\(['"`]([^'"`]+)['"`]\)/g,           // t('key')
  /useTranslations\(\)\(['"`]([^'"`]+)['"`]\)/g, // useTranslations()('key')
  /\$t\(['"`]([^'"`]+)['"`]\)/g,         // $t('key')
  /i18n\.t\(['"`]([^'"`]+)['"`]\)/g,     // i18n.t('key')
  /translate\(['"`]([^'"`]+)['"`]\)/g,   // translate('key')
];

// Charger les fichiers de traduction
function loadTranslationFiles() {
  languages.forEach(lang => {
    const filePath = path.join('messages', `${lang}.json`);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      translationFiles[lang] = JSON.parse(content);
    } catch (error) {
      console.warn(`⚠️  Impossible de charger ${lang}.json`);
      translationFiles[lang] = {};
    }
  });
}

// Extraire les clés d'un objet
function extractKeys(obj, prefix = '') {
  const keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Vérifier si une clé existe
function keyExists(key) {
  return languages.some(lang => {
    const keys = extractKeys(translationFiles[lang]);
    return keys.includes(key);
  });
}

// Scanner un fichier pour les clés de traduction
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const keys = new Set();
    
    translationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        keys.add(match[1]);
      }
    });
    
    return Array.from(keys);
  } catch (error) {
    return [];
  }
}

// Scanner tous les fichiers de code
function scanAllFiles() {
  const allKeys = new Set();
  const missingKeys = new Set();
  
  const codeDirectories = ['app', 'components', 'pages', 'lib', 'hooks'];
  const extensions = ['.js', '.jsx', '.ts', '.tsx'];
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanDirectory(fullPath);
      } else if (extensions.some(ext => file.name.endsWith(ext))) {
        const keys = scanFile(fullPath);
        keys.forEach(key => {
          allKeys.add(key);
          if (!keyExists(key)) {
            missingKeys.add(key);
          }
        });
      }
    });
  }
  
  codeDirectories.forEach(scanDirectory);
  
  return {
    totalKeys: allKeys.size,
    missingKeys: Array.from(missingKeys),
    missingCount: missingKeys.size
  };
}

// Fonction de surveillance principale
function watchTranslations() {
  loadTranslationFiles();
  
  const results = scanAllFiles();
  
  // Comparer avec les résultats précédents
  const hasChanges = JSON.stringify(results) !== JSON.stringify(lastScanResults);
  
  if (hasChanges) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n📊 [${timestamp}] Scan terminé:`);
    console.log(`   Total clés: ${results.totalKeys}`);
    console.log(`   Clés manquantes: ${results.missingCount}`);
    
    if (results.missingCount > 0) {
      console.log('\n❌ Clés manquantes détectées:');
      results.missingKeys.slice(0, 10).forEach(key => {
        console.log(`   - ${key}`);
      });
      
      if (results.missingKeys.length > 10) {
        console.log(`   ... et ${results.missingKeys.length - 10} autres`);
      }
      
      // Suggérer des corrections automatiques
      console.log('\n💡 Pour corriger automatiquement les traductions courantes:');
      console.log('   npm run translations:fix');
    } else {
      console.log('✅ Toutes les traductions sont présentes !');
    }
    
    lastScanResults = results;
  }
}

// Démarrer la surveillance
console.log('✅ Surveillance initialisée');
console.log('🔄 Vérification toutes les 10 secondes...');
console.log('⏹️  Appuyez sur Ctrl+C pour arrêter\n');

// Scan initial
watchTranslations();

// Surveillance périodique
const interval = setInterval(watchTranslations, 10000); // 10 secondes

// Gérer l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt de la surveillance...');
  clearInterval(interval);
  process.exit(0);
});

// Garder le processus actif
process.stdin.resume();