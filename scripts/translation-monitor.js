#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
// Note: chokidar sera installé si nécessaire

/**
 * Moniteur de traductions en temps réel
 * Surveille les fichiers et détecte automatiquement les nouvelles clés de traduction
 */
class TranslationMonitor {
  constructor() {
    this.translationKeys = new Set();
    this.missingKeys = new Set();
    this.watchers = [];
    this.languages = ['fr', 'en', 'ar'];
    this.translationFiles = {};
    
    // Patterns pour détecter les clés de traduction dans le code
    this.translationPatterns = [
      /t\(['"`]([^'"`]+)['"`]\)/g,           // t('key')
      /useTranslations\(\)\(['"`]([^'"`]+)['"`]\)/g, // useTranslations()('key')
      /\$t\(['"`]([^'"`]+)['"`]\)/g,         // $t('key')
      /i18n\.t\(['"`]([^'"`]+)['"`]\)/g,     // i18n.t('key')
      /translate\(['"`]([^'"`]+)['"`]\)/g,   // translate('key')
    ];
  }

  /**
   * Initialise le moniteur
   */
  async init() {
    console.log('🔍 Initialisation du moniteur de traductions...');
    
    // Charger les fichiers de traduction existants
    await this.loadTranslationFiles();
    
    // Scanner le code existant
    await this.scanExistingCode();
    
    // Démarrer la surveillance
    this.startWatching();
    
    console.log('✅ Moniteur de traductions actif');
    console.log(`📊 ${this.translationKeys.size} clés de traduction détectées`);
    console.log(`❌ ${this.missingKeys.size} clés manquantes`);
  }

  /**
   * Charge les fichiers de traduction
   */
  async loadTranslationFiles() {
    this.languages.forEach(lang => {
      const filePath = path.join('messages', `${lang}.json`);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.translationFiles[lang] = JSON.parse(content);
      } catch (error) {
        console.warn(`⚠️  Impossible de charger ${lang}.json:`, error.message);
        this.translationFiles[lang] = {};
      }
    });
  }

  /**
   * Extrait les clés de traduction d'un objet
   */
  extractKeysFromObject(obj, prefix = '') {
    const keys = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        keys.push(...this.extractKeysFromObject(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  /**
   * Vérifie si une clé existe dans les fichiers de traduction
   */
  keyExistsInTranslations(key) {
    return this.languages.some(lang => {
      const keys = this.extractKeysFromObject(this.translationFiles[lang]);
      return keys.includes(key);
    });
  }

  /**
   * Extrait les clés de traduction d'un fichier de code
   */
  extractTranslationKeysFromFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const keys = new Set();
      
      this.translationPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          keys.add(match[1]);
        }
      });
      
      return Array.from(keys);
    } catch (error) {
      console.warn(`⚠️  Erreur lors de la lecture de ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Scanne tout le code existant
   */
  async scanExistingCode() {
    console.log('🔍 Scan du code existant...');
    
    const codeDirectories = ['app', 'components', 'pages', 'lib', 'hooks'];
    const extensions = ['.js', '.jsx', '.ts', '.tsx'];
    
    const scanDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      files.forEach(file => {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          scanDirectory(fullPath);
        } else if (extensions.some(ext => file.name.endsWith(ext))) {
          const keys = this.extractTranslationKeysFromFile(fullPath);
          keys.forEach(key => {
            this.translationKeys.add(key);
            
            if (!this.keyExistsInTranslations(key)) {
              this.missingKeys.add(key);
            }
          });
        }
      });
    };
    
    codeDirectories.forEach(scanDirectory);
  }

  /**
   * Démarre la surveillance des fichiers (version simplifiée)
   */
  startWatching() {
    console.log('👀 Surveillance des fichiers (mode polling)...');
    
    // Surveillance simple par polling toutes les 5 secondes
    this.watchInterval = setInterval(() => {
      this.recheckAllFiles();
    }, 5000);
    
    console.log('✅ Surveillance active (vérification toutes les 5 secondes)');
  }

  /**
   * Revérifie tous les fichiers
   */
  recheckAllFiles() {
    const previousKeyCount = this.translationKeys.size;
    const previousMissingCount = this.missingKeys.size;
    
    // Recharger les traductions
    this.loadTranslationFiles();
    
    // Rescanner le code
    this.translationKeys.clear();
    this.missingKeys.clear();
    this.scanExistingCode();
    
    // Vérifier s'il y a des changements
    if (this.translationKeys.size !== previousKeyCount || this.missingKeys.size !== previousMissingCount) {
      console.log(`📊 Mise à jour: ${this.translationKeys.size} clés total, ${this.missingKeys.size} manquantes`);
      
      if (this.missingKeys.size > previousMissingCount) {
        console.log('🚨 Nouvelles clés manquantes détectées !');
        this.generateQuickReport();
      }
    }
  }

  /**
   * Gère les changements de fichiers
   */
  handleFileChange(filePath) {
    console.log(`📝 Fichier modifié: ${filePath}`);
    
    const keys = this.extractTranslationKeysFromFile(filePath);
    let newKeysFound = false;
    
    keys.forEach(key => {
      if (!this.translationKeys.has(key)) {
        this.translationKeys.add(key);
        newKeysFound = true;
        
        if (!this.keyExistsInTranslations(key)) {
          this.missingKeys.add(key);
          console.log(`🚨 NOUVELLE CLÉ MANQUANTE: "${key}" dans ${filePath}`);
          this.suggestTranslation(key);
        } else {
          console.log(`✅ Nouvelle clé trouvée: "${key}" (traductions existantes)`);
        }
      }
    });
    
    if (newKeysFound) {
      this.generateQuickReport();
    }
  }

  /**
   * Revérifie les clés manquantes
   */
  recheckMissingKeys() {
    const previousMissingCount = this.missingKeys.size;
    this.missingKeys.clear();
    
    this.translationKeys.forEach(key => {
      if (!this.keyExistsInTranslations(key)) {
        this.missingKeys.add(key);
      }
    });
    
    const newMissingCount = this.missingKeys.size;
    if (newMissingCount !== previousMissingCount) {
      console.log(`📊 Clés manquantes: ${previousMissingCount} → ${newMissingCount}`);
      
      if (newMissingCount < previousMissingCount) {
        console.log('🎉 Certaines traductions ont été ajoutées !');
      }
    }
  }

  /**
   * Suggère une traduction pour une clé manquante
   */
  suggestTranslation(key) {
    const suggestions = this.generateTranslationSuggestions(key);
    
    console.log(`💡 Suggestions pour "${key}":`);
    this.languages.forEach(lang => {
      if (suggestions[lang]) {
        console.log(`   ${lang}: "${suggestions[lang]}"`);
      }
    });
    
    // Optionnel: ajouter automatiquement les suggestions
    if (process.env.AUTO_ADD_TRANSLATIONS === 'true') {
      this.addTranslationSuggestions(key, suggestions);
    }
  }

  /**
   * Génère des suggestions de traduction
   */
  generateTranslationSuggestions(key) {
    const suggestions = {};
    const keyParts = key.split('.');
    const lastPart = keyParts[keyParts.length - 1];
    
    // Dictionnaire de traductions communes
    const commonTranslations = {
      fr: {
        'title': 'Titre',
        'name': 'Nom',
        'email': 'Email',
        'password': 'Mot de passe',
        'login': 'Connexion',
        'logout': 'Déconnexion',
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
        'admin': 'Administrateur',
        'manager': 'Manager',
        'member': 'Membre',
        'client': 'Client'
      },
      en: {
        'title': 'Title',
        'name': 'Name',
        'email': 'Email',
        'password': 'Password',
        'login': 'Login',
        'logout': 'Logout',
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
        'admin': 'Administrator',
        'manager': 'Manager',
        'member': 'Member',
        'client': 'Client'
      },
      ar: {
        'title': 'العنوان',
        'name': 'الاسم',
        'email': 'البريد الإلكتروني',
        'password': 'كلمة المرور',
        'login': 'تسجيل الدخول',
        'logout': 'تسجيل الخروج',
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
        'admin': 'مسؤول',
        'manager': 'مدير',
        'member': 'عضو',
        'client': 'عميل'
      }
    };
    
    this.languages.forEach(lang => {
      if (commonTranslations[lang][lastPart]) {
        suggestions[lang] = commonTranslations[lang][lastPart];
      } else {
        // Suggestion basique basée sur la clé
        suggestions[lang] = lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
      }
    });
    
    return suggestions;
  }

  /**
   * Ajoute automatiquement les suggestions de traduction
   */
  addTranslationSuggestions(key, suggestions) {
    this.languages.forEach(lang => {
      if (suggestions[lang]) {
        this.setTranslationValue(this.translationFiles[lang], key, suggestions[lang]);
      }
    });
    
    // Sauvegarder les fichiers
    this.saveTranslationFiles();
    console.log(`✅ Traductions automatiques ajoutées pour "${key}"`);
  }

  /**
   * Définit une valeur de traduction
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
   * Sauvegarde les fichiers de traduction
   */
  saveTranslationFiles() {
    this.languages.forEach(lang => {
      const filePath = path.join('messages', `${lang}.json`);
      const content = JSON.stringify(this.translationFiles[lang], null, 2);
      
      try {
        fs.writeFileSync(filePath, content, 'utf8');
      } catch (error) {
        console.error(`❌ Erreur sauvegarde ${lang}.json:`, error.message);
      }
    });
  }

  /**
   * Génère un rapport rapide
   */
  generateQuickReport() {
    console.log('\n📊 RAPPORT RAPIDE:');
    console.log(`   Total clés: ${this.translationKeys.size}`);
    console.log(`   Clés manquantes: ${this.missingKeys.size}`);
    
    if (this.missingKeys.size > 0) {
      console.log('   Clés manquantes:');
      Array.from(this.missingKeys).slice(0, 5).forEach(key => {
        console.log(`     - ${key}`);
      });
      
      if (this.missingKeys.size > 5) {
        console.log(`     ... et ${this.missingKeys.size - 5} autres`);
      }
    }
    console.log('');
  }

  /**
   * Arrête la surveillance
   */
  stop() {
    console.log('🛑 Arrêt du moniteur de traductions...');
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
    }
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new TranslationMonitor();
  
  monitor.init().catch(console.error);
  
  // Gérer l'arrêt propre
  process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
  });
}

export default TranslationMonitor;