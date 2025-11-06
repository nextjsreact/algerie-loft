const fs = require('fs');
const path = require('path');

// Traductions communes qui manquent souvent
const commonMissingTranslations = {
  // Admin users
  'admin.users.filters.searchPlaceholder': {
    ar: 'البحث عن المستخدمين...',
    fr: 'Rechercher des utilisateurs...',
    en: 'Search users...'
  },
  'admin.users.table.name': {
    ar: 'الاسم',
    fr: 'Nom',
    en: 'Name'
  },
  'admin.users.table.email': {
    ar: 'البريد الإلكتروني',
    fr: 'Email',
    en: 'Email'
  },
  'admin.users.table.role': {
    ar: 'الدور',
    fr: 'Rôle',
    en: 'Role'
  },
  'admin.users.table.status': {
    ar: 'الحالة',
    fr: 'Statut',
    en: 'Status'
  },
  'admin.users.table.actions': {
    ar: 'الإجراءات',
    fr: 'Actions',
    en: 'Actions'
  },
  'admin.users.actions.edit': {
    ar: 'تعديل',
    fr: 'Modifier',
    en: 'Edit'
  },
  'admin.users.actions.delete': {
    ar: 'حذف',
    fr: 'Supprimer',
    en: 'Delete'
  },
  'admin.users.actions.activate': {
    ar: 'تفعيل',
    fr: 'Activer',
    en: 'Activate'
  },
  'admin.users.actions.deactivate': {
    ar: 'إلغاء التفعيل',
    fr: 'Désactiver',
    en: 'Deactivate'
  },
  // Dashboard common
  'dashboard.loading': {
    ar: 'جاري التحميل...',
    fr: 'Chargement...',
    en: 'Loading...'
  },
  'dashboard.error': {
    ar: 'خطأ',
    fr: 'Erreur',
    en: 'Error'
  },
  'dashboard.noData': {
    ar: 'لا توجد بيانات',
    fr: 'Aucune donnée',
    en: 'No data'
  },
  // Common actions
  'common.save': {
    ar: 'حفظ',
    fr: 'Enregistrer',
    en: 'Save'
  },
  'common.cancel': {
    ar: 'إلغاء',
    fr: 'Annuler',
    en: 'Cancel'
  },
  'common.delete': {
    ar: 'حذف',
    fr: 'Supprimer',
    en: 'Delete'
  },
  'common.edit': {
    ar: 'تعديل',
    fr: 'Modifier',
    en: 'Edit'
  },
  'common.add': {
    ar: 'إضافة',
    fr: 'Ajouter',
    en: 'Add'
  },
  'common.search': {
    ar: 'بحث',
    fr: 'Rechercher',
    en: 'Search'
  },
  'common.filter': {
    ar: 'تصفية',
    fr: 'Filtrer',
    en: 'Filter'
  },
  'common.all': {
    ar: 'الكل',
    fr: 'Tous',
    en: 'All'
  },
  'common.active': {
    ar: 'نشط',
    fr: 'Actif',
    en: 'Active'
  },
  'common.inactive': {
    ar: 'غير نشط',
    fr: 'Inactif',
    en: 'Inactive'
  }
};

// Fonction pour ajouter une traduction manquante
const addTranslation = (messages, keyPath, value) => {
  const keys = keyPath.split('.');
  let current = messages;
  
  // Naviguer/créer la structure imbriquée
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }
  
  // Ajouter la traduction finale
  const finalKey = keys[keys.length - 1];
  if (!current[finalKey]) {
    current[finalKey] = value;
    return true;
  }
  
  return false;
};

// Fonction principale
const autoFixMissingTranslations = () => {
  console.log('🔧 Auto-fixing common missing translations...\n');
  
  const locales = ['ar', 'fr', 'en'];
  let totalAdded = 0;
  
  locales.forEach(locale => {
    const messagesPath = path.join(__dirname, '..', 'messages', `${locale}.json`);
    
    try {
      const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
      let addedCount = 0;
      
      // Ajouter toutes les traductions manquantes communes
      Object.entries(commonMissingTranslations).forEach(([keyPath, translations]) => {
        if (addTranslation(messages, keyPath, translations[locale])) {
          console.log(`✅ Added ${locale}: ${keyPath} = "${translations[locale]}"`);
          addedCount++;
          totalAdded++;
        }
      });
      
      // Sauvegarder le fichier mis à jour
      if (addedCount > 0) {
        fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2), 'utf8');
        console.log(`📝 Updated ${locale}.json (${addedCount} translations added)\n`);
      } else {
        console.log(`✅ ${locale}.json is up to date\n`);
      }
      
    } catch (error) {
      console.error(`❌ Error updating ${locale}.json:`, error.message);
    }
  });
  
  console.log(`\n🎉 Auto-fix complete! Added ${totalAdded} translations total.`);
};

autoFixMissingTranslations();