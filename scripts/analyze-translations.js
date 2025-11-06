#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Script simple d'analyse des traductions
 */
console.log('🚀 Analyse des traductions en cours...\n');

// Langues supportées
const languages = ['fr', 'en', 'ar'];
const translationFiles = {};

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

// Analyser les traductions manquantes
console.log('\n🔍 Analyse des traductions manquantes...');

const allKeys = {};
languages.forEach(lang => {
  allKeys[lang] = extractKeys(translationFiles[lang]);
});

const missingTranslations = {};
languages.forEach(lang => {
  missingTranslations[lang] = [];
  
  languages.forEach(otherLang => {
    if (lang !== otherLang) {
      const missingInCurrent = allKeys[otherLang].filter(key => 
        !allKeys[lang].includes(key)
      );
      
      missingInCurrent.forEach(key => {
        if (!missingTranslations[lang].includes(key)) {
          missingTranslations[lang].push(key);
        }
      });
    }
  });
});

// Afficher les résultats
languages.forEach(lang => {
  const missing = missingTranslations[lang];
  if (missing.length > 0) {
    console.log(`\n❌ ${lang.toUpperCase()} - ${missing.length} traductions manquantes:`);
    missing.forEach(key => console.log(`   - ${key}`));
  } else {
    console.log(`\n✅ ${lang.toUpperCase()} - Toutes les traductions présentes`);
  }
});

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

// Traductions automatiques courantes
const commonTranslations = {
  fr: {
    'admin': 'Administrateur',
    'manager': 'Manager', 
    'executive': 'Exécutif',
    'member': 'Membre',
    'client': 'Client',
    'partner': 'Partenaire',
    'superuser': 'Superuser',
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
    'password': 'Mot de passe'
  },
  en: {
    'admin': 'Administrator',
    'manager': 'Manager',
    'executive': 'Executive', 
    'member': 'Member',
    'client': 'Client',
    'partner': 'Partner',
    'superuser': 'Superuser',
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
    'password': 'Password'
  },
  ar: {
    'admin': 'مسؤول',
    'manager': 'مدير',
    'executive': 'تنفيذي',
    'member': 'عضو',
    'client': 'عميل',
    'partner': 'شريك',
    'superuser': 'مدير أعلى',
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
    'password': 'كلمة المرور'
  }
};

// Génération automatique des traductions
console.log('\n🤖 Génération automatique des traductions...');
let autoFixed = 0;

languages.forEach(lang => {
  const missing = missingTranslations[lang];
  
  missing.forEach(key => {
    const lastPart = key.split('.').pop().toLowerCase();
    
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
  summary: {}
};

languages.forEach(lang => {
  const totalKeys = extractKeys(translationFiles[lang]).length;
  const missingKeys = missingTranslations[lang].length;
  
  report.summary[lang] = {
    totalKeys: totalKeys,
    missingKeys: missingKeys,
    completeness: Math.round((1 - missingKeys / Math.max(totalKeys, 1)) * 100)
  };
});

const reportPath = 'translation-analysis-report.json';
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log('\n📊 Résumé final:');
languages.forEach(lang => {
  const summary = report.summary[lang];
  console.log(`${lang.toUpperCase()}: ${summary.completeness}% complet (${summary.totalKeys - summary.missingKeys}/${summary.totalKeys} clés)`);
});

console.log(`\n📄 Rapport détaillé sauvegardé: ${reportPath}`);
console.log('\n✨ Analyse terminée !');