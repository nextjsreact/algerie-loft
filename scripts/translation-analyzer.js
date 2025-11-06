#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Analyseur automatique de traductions
 * Détecte les traductions manquantes et propose des corrections
 */
class TranslationAnalyzer {
  constructor() {
    this.languages = ['fr', 'en', 'ar'];
    this.translationFiles = {};
    this.missingTranslations = {};
    this.inconsistencies = [];
  }

  /**
   * Charge tous les fichiers de traduction
   */
  loadTranslationFiles() {
    console.log('🔍 Chargement des fichiers de traduction...');
    
    this.languages.forEach(lang => {
      const filePath = path.join('messages', `${lang}.json`);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.translationFiles[lang] = JSON.parse(content);
        console.log(`✅ ${lang}.json chargé`);
      } catch (error) {
        console.error(`❌ Erreur lors du chargement de ${lang}.json:`, error.message);
        this.translationFiles[lang] = {};
      }
    });
  }

  /**
   * Extrait toutes les clés de traduction d'un objet de manière récursive
   */
  extractKeys(obj, prefix = '') {
    const keys = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        keys.push(...this.extractKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  /**
   * Analyse les traductions manquantes entre les langues
   */
  analyzeMissingTranslations() {
    console.log('\n🔍 Analyse des traductions manquantes...');
    
    // Obtenir toutes les clés de chaque langue
    const allKeys = {};
    this.languages.forEach(lang => {
      allKeys[lang] = this.extractKeys(this.translationFiles[lang]);
    });

    // Trouver les clés manquantes
    this.languages.forEach(lang => {
      this.missingTranslations[lang] = [];
      
      // Comparer avec les autres langues
      this.languages.forEach(otherLang => {
        if (lang !== otherLang) {
          const missingInCurrent = allKeys[otherLang].filter(key => 
            !allKeys[lang].includes(key)
          );
          
          missingInCurrent.forEach(key => {
            if (!this.missingTranslations[lang].includes(key)) {
              this.missingTranslations[lang].push(key);
            }
          });
        }
      });
    });

    // Afficher les résultats
    this.languages.forEach(lang => {
      const missing = this.missingTranslations[lang];
      if (missing.length > 0) {
        console.log(`\n❌ ${lang.toUpperCase()} - ${missing.length} traductions manquantes:`);
        missing.forEach(key => console.log(`   - ${key}`));
      } else {
        console.log(`\n✅ ${lang.toUpperCase()} - Toutes les traductions présentes`);
      }
    });
  }

  /**
   * Obtient la valeur d'une clé dans un objet de traduction
   */
  getTranslationValue(obj, key) {
    const keys = key.split('.');
    let current = obj;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }
    
    return current;
  }

  /**
   * Définit la valeur d'une clé dans un objet de traduction
   */
  setTranslationValue(obj, key, value) {
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

  /**
   * Génère des traductions automatiques basées sur des patterns
   */
  generateAutoTranslations() {
    console.log('\n🤖 Génération automatique des traductions...');
    
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
        'success': 'Succès'
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
        'success': 'Success'
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
        'success': 'نجح'
      }
    };

    let autoFixed = 0;

    this.languages.forEach(lang => {
      const missing = this.missingTranslations[lang];
      
      missing.forEach(key => {
        // Essayer de trouver une traduction automatique
        const lastPart = key.split('.').pop().toLowerCase();
        
        if (commonTranslations[lang][lastPart]) {
          this.setTranslationValue(
            this.translationFiles[lang], 
            key, 
            commonTranslations[lang][lastPart]
          );
          autoFixed++;
          console.log(`✅ Auto-fixé ${lang}: ${key} = "${commonTranslations[lang][lastPart]}"`);
        }
      });
    });

    console.log(`\n🎉 ${autoFixed} traductions générées automatiquement`);
  }

  /**
   * Sauvegarde les fichiers de traduction mis à jour
   */
  saveTranslationFiles() {
    console.log('\n💾 Sauvegarde des fichiers de traduction...');
    
    this.languages.forEach(lang => {
      const filePath = path.join('messages', `${lang}.json`);
      const content = JSON.stringify(this.translationFiles[lang], null, 2);
      
      try {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${lang}.json sauvegardé`);
      } catch (error) {
        console.error(`❌ Erreur lors de la sauvegarde de ${lang}.json:`, error.message);
      }
    });
  }

  /**
   * Génère un rapport détaillé
   */
  generateReport() {
    console.log('\n📊 Génération du rapport...');
    
    const report = {
      timestamp: new Date().toISOString(),
      languages: this.languages,
      summary: {},
      missingTranslations: this.missingTranslations,
      totalKeys: {}
    };

    this.languages.forEach(lang => {
      const allKeys = this.extractKeys(this.translationFiles[lang]);
      report.totalKeys[lang] = allKeys.length;
      report.summary[lang] = {
        totalKeys: allKeys.length,
        missingKeys: this.missingTranslations[lang].length,
        completeness: Math.round((1 - this.missingTranslations[lang].length / Math.max(...Object.values(report.totalKeys))) * 100)
      };
    });

    const reportPath = 'translation-analysis-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Rapport sauvegardé: ${reportPath}`);

    return report;
  }

  /**
   * Exécute l'analyse complète
   */
  async run() {
    console.log('🚀 Démarrage de l\'analyseur de traductions\n');
    
    this.loadTranslationFiles();
    this.analyzeMissingTranslations();
    this.generateAutoTranslations();
    
    // Re-analyser après les corrections automatiques
    this.analyzeMissingTranslations();
    
    this.saveTranslationFiles();
    const report = this.generateReport();
    
    console.log('\n📈 Résumé:');
    this.languages.forEach(lang => {
      const summary = report.summary[lang];
      console.log(`${lang.toUpperCase()}: ${summary.completeness}% complet (${summary.totalKeys - summary.missingKeys}/${summary.totalKeys} clés)`);
    });
    
    console.log('\n✨ Analyse terminée !');
  }
}

// Exécuter si appelé directement
if (import.meta.url.endsWith(process.argv[1])) {
  const analyzer = new TranslationAnalyzer();
  analyzer.run().catch(console.error);
}

export default TranslationAnalyzer;