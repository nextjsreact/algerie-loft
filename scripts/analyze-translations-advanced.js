#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Script avancé d'analyse des traductions avec détection des namespaces
 */
console.log('🚀 Analyse avancée des traductions en cours...\n');

const languages = ['fr', 'en', 'ar'];
const translationFiles = {};

// Patterns pour détecter les clés et namespaces
const translationPatterns = [
  /t\(['"`]([^'"`]+)['"`]\)/g,           // t('key')
  /\$t\(['"`]([^'"`]+)['"`]\)/g,         // $t('key')
  /i18n\.t\(['"`]([^'"`]+)['"`]\)/g,     // i18n.t('key')
  /translate\(['"`]([^'"`]+)['"`]\)/g,   // translate('key')
];

const namespacePattern = /useTranslations\(['"`]([^'"`]+)['"`]\)/g;

// Charger les fichiers de traduction
console.log('🔍 Chargement des fichiers de traduction...');
languages.forEach(lang => {
  const filePath = path.join('messages', `${lang}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    translationFiles[lang] = JSON.parse(content);
    console.log(`✅ ${lang}.json chargé`);
  } catch (error) {
    console.error(`❌ Erreur lors du chargement de ${lang}.json:`, error.message);
    translationFiles[lang] = {};
  }
});

// Fonction pour extraire toutes les clés
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

// Scanner un fichier pour les clés et namespaces
function scanFileAdvanced(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const keys = new Set();
    const namespaces = new Set();
    
    // Détecter les namespaces
    let namespaceMatch;
    while ((namespaceMatch = namespacePattern.exec(content)) !== null) {
      namespaces.add(namespaceMatch[1]);
    }
    
    // Détecter les clés de traduction
    translationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const key = match[1];
        
        // Si on a des namespaces, créer les clés complètes
        if (namespaces.size > 0) {
          namespaces.forEach(namespace => {
            keys.add(`${namespace}.${key}`);
          });
        } else {
          keys.add(key);
        }
      }
    });
    
    return {
      keys: Array.from(keys),
      namespaces: Array.from(namespaces),
      filePath: filePath
    };
  } catch (error) {
    return { keys: [], namespaces: [], filePath: filePath };
  }
}

// Scanner tous les fichiers
console.log('\n🔍 Scan avancé du code...');

const allKeys = new Set();
const missingKeys = new Set();
const fileAnalysis = [];

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
      const analysis = scanFileAdvanced(fullPath);
      
      if (analysis.keys.length > 0 || analysis.namespaces.length > 0) {
        fileAnalysis.push(analysis);
      }
      
      analysis.keys.forEach(key => {
        allKeys.add(key);
        if (!keyExists(key)) {
          missingKeys.add(key);
        }
      });
    }
  });
}

codeDirectories.forEach(scanDirectory);

// Afficher l'analyse détaillée
console.log('\n📊 Analyse détaillée par fichier:');
fileAnalysis.forEach(analysis => {
  if (analysis.namespaces.length > 0) {
    console.log(`\n📁 ${analysis.filePath}`);
    console.log(`   Namespaces: ${analysis.namespaces.join(', ')}`);
    
    const fileMissingKeys = analysis.keys.filter(key => !keyExists(key));
    if (fileMissingKeys.length > 0) {
      console.log(`   ❌ Clés manquantes: ${fileMissingKeys.length}`);
      fileMissingKeys.forEach(key => {
        console.log(`      - ${key}`);
      });
    } else {
      console.log(`   ✅ Toutes les clés présentes`);
    }
  }
});

// Résumé global
console.log('\n📊 Résumé global:');
console.log(`   Total clés détectées: ${allKeys.size}`);
console.log(`   Clés manquantes: ${missingKeys.size}`);

if (missingKeys.size > 0) {
  console.log('\n❌ Toutes les clés manquantes:');
  Array.from(missingKeys).forEach(key => {
    console.log(`   - ${key}`);
  });
}

// Fonction pour définir une valeur dans un objet
function setTranslationValue(obj, key, value) {
  const keys = key.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in current) || typeof current[k] !== 'object') {
      current[k] = {};
    }
    current = current[k];
  }
  
  current[keys[keys.length - 1]] = value;
}

// Traductions automatiques étendues
const commonTranslations = {
  fr: {
    'admin': 'Administrateur',
    'manager': 'Manager', 
    'executive': 'Exécutif',
    'member': 'Membre',
    'client': 'Client',
    'partner': 'Partenaire',
    'superuser': 'Superuser',
    'guest': 'Invité',
    'save': 'Enregistrer',
    'cancel': 'Annuler',
    'delete': 'Supprimer',
    'edit': 'Modifier',
    'add': 'Ajouter',
    'search': 'Rechercher',
    'filter': 'Filtrer',
    'loading': 'Chargement...',
    'error': 'Erreur',
    'success': 'Succès',
    'title': 'Titre',
    'name': 'Nom',
    'email': 'Email',
    'password': 'Mot de passe',
    'role': 'Rôle',
    'status': 'Statut',
    'active': 'Actif',
    'inactive': 'Inactif'
  },
  en: {
    'admin': 'Administrator',
    'manager': 'Manager',
    'executive': 'Executive', 
    'member': 'Member',
    'client': 'Client',
    'partner': 'Partner',
    'superuser': 'Superuser',
    'guest': 'Guest',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'search': 'Search',
    'filter': 'Filter',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'title': 'Title',
    'name': 'Name',
    'email': 'Email',
    'password': 'Password',
    'role': 'Role',
    'status': 'Status',
    'active': 'Active',
    'inactive': 'Inactive'
  },
  ar: {
    'admin': 'مسؤول',
    'manager': 'مدير',
    'executive': 'تنفيذي',
    'member': 'عضو',
    'client': 'عميل',
    'partner': 'شريك',
    'superuser': 'مدير أعلى',
    'guest': 'ضيف',
    'save': 'حفظ',
    'cancel': 'إلغاء',
    'delete': 'حذف',
    'edit': 'تعديل',
    'add': 'إضافة',
    'search': 'بحث',
    'filter': 'تصفية',
    'loading': 'جاري التحميل...',
    'error': 'خطأ',
    'success': 'نجح',
    'title': 'العنوان',
    'name': 'الاسم',
    'email': 'البريد الإلكتروني',
    'password': 'كلمة المرور',
    'role': 'الدور',
    'status': 'الحالة',
    'active': 'نشط',
    'inactive': 'غير نشط'
  }
};

// Génération automatique des traductions
console.log('\n🤖 Génération automatique des traductions...');
let autoFixed = 0;

Array.from(missingKeys).forEach(key => {
  const keyParts = key.split('.');
  const lastPart = keyParts[keyParts.length - 1].toLowerCase();
  
  languages.forEach(lang => {
    if (commonTranslations[lang][lastPart]) {
      setTranslationValue(
        translationFiles[lang], 
        key, 
        commonTranslations[lang][lastPart]
      );
      autoFixed++;
      console.log(`✅ Auto-fixé ${lang}: ${key} = "${commonTranslations[lang][lastPart]}"`);
    }
  });
});

console.log(`\n🎉 ${autoFixed} traductions générées automatiquement`);

// Sauvegarder les fichiers mis à jour
if (autoFixed > 0) {
  console.log('\n💾 Sauvegarde des fichiers de traduction...');
  
  languages.forEach(lang => {
    const filePath = path.join('messages', `${lang}.json`);
    const content = JSON.stringify(translationFiles[lang], null, 2);
    
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${lang}.json sauvegardé`);
    } catch (error) {
      console.error(`❌ Erreur lors de la sauvegarde de ${lang}.json:`, error.message);
    }
  });
}

// Générer un rapport final
const report = {
  timestamp: new Date().toISOString(),
  languages: languages,
  summary: {},
  fileAnalysis: fileAnalysis,
  missingKeys: Array.from(missingKeys)
};

languages.forEach(lang => {
  const totalKeys = extractKeys(translationFiles[lang]).length;
  const currentMissingKeys = Array.from(missingKeys).filter(key => !keyExists(key));
  
  report.summary[lang] = {
    totalKeys: totalKeys,
    missingKeys: currentMissingKeys.length,
    completeness: Math.round((1 - currentMissingKeys.length / Math.max(totalKeys, 1)) * 100)
  };
});

const reportPath = 'translation-analysis-advanced-report.json';
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log('\n📊 Résumé final:');
languages.forEach(lang => {
  const summary = report.summary[lang];
  console.log(`${lang.toUpperCase()}: ${summary.completeness}% complet (${summary.totalKeys - summary.missingKeys}/${summary.totalKeys} clés)`);
});

console.log(`\n📄 Rapport détaillé sauvegardé: ${reportPath}`);
console.log('\n✨ Analyse avancée terminée !');