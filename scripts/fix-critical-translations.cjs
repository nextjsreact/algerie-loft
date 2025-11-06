const fs = require('fs');
const path = require('path');

// Traductions critiques manquantes avec leurs fallbacks
const criticalTranslations = {
  'dashboard.systemStatus': 'System Status',
  'admin.users.title': 'User Management',
  'admin.users.description': 'Manage system users',
  'admin.users.filters.title': 'Filters',
  'admin.users.filters.search': 'Search users...',
  'admin.users.filters.role': 'Filter by role',
  'admin.users.filters.allRoles': 'All roles',
  'admin.users.filters.status': 'Filter by status', 
  'admin.users.filters.allStatuses': 'All statuses',
  'admin.users.filters.apply': 'Apply filters',
  'admin.users.usersList.title': 'Users List',
  'admin.users.usersList.noUsers': 'No users found'
};

// Ajouter les traductions manquantes dans les fichiers JSON
const addMissingTranslations = () => {
  const locales = ['ar', 'fr', 'en'];
  
  // Traductions par langue
  const translations = {
    ar: {
      'dashboard.systemStatus': 'حالة النظام',
      'admin.users.title': 'إدارة المستخدمين',
      'admin.users.description': 'إدارة مستخدمي النظام',
      'admin.users.filters.title': 'المرشحات',
      'admin.users.filters.search': 'البحث عن المستخدمين...',
      'admin.users.filters.role': 'تصفية حسب الدور',
      'admin.users.filters.allRoles': 'جميع الأدوار',
      'admin.users.filters.status': 'تصفية حسب الحالة',
      'admin.users.filters.allStatuses': 'جميع الحالات',
      'admin.users.filters.apply': 'تطبيق المرشحات',
      'admin.users.usersList.title': 'قائمة المستخدمين',
      'admin.users.usersList.noUsers': 'لم يتم العثور على مستخدمين'
    },
    fr: {
      'dashboard.systemStatus': 'État du Système',
      'admin.users.title': 'Gestion des Utilisateurs',
      'admin.users.description': 'Gérer les utilisateurs du système',
      'admin.users.filters.title': 'Filtres',
      'admin.users.filters.search': 'Rechercher des utilisateurs...',
      'admin.users.filters.role': 'Filtrer par rôle',
      'admin.users.filters.allRoles': 'Tous les rôles',
      'admin.users.filters.status': 'Filtrer par statut',
      'admin.users.filters.allStatuses': 'Tous les statuts',
      'admin.users.filters.apply': 'Appliquer les filtres',
      'admin.users.usersList.title': 'Liste des Utilisateurs',
      'admin.users.usersList.noUsers': 'Aucun utilisateur trouvé'
    },
    en: {
      'dashboard.systemStatus': 'System Status',
      'admin.users.title': 'User Management',
      'admin.users.description': 'Manage system users',
      'admin.users.filters.title': 'Filters',
      'admin.users.filters.search': 'Search users...',
      'admin.users.filters.role': 'Filter by role',
      'admin.users.filters.allRoles': 'All roles',
      'admin.users.filters.status': 'Filter by status',
      'admin.users.filters.allStatuses': 'All statuses',
      'admin.users.filters.apply': 'Apply filters',
      'admin.users.usersList.title': 'Users List',
      'admin.users.usersList.noUsers': 'No users found'
    }
  };

  locales.forEach(locale => {
    const messagesPath = path.join(__dirname, '..', 'messages', `${locale}.json`);
    
    try {
      const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
      
      // Ajouter les traductions manquantes
      Object.entries(translations[locale]).forEach(([key, value]) => {
        const keyParts = key.split('.');
        let current = messages;
        
        // Naviguer/créer la structure imbriquée
        for (let i = 0; i < keyParts.length - 1; i++) {
          const part = keyParts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
        
        // Ajouter la traduction finale
        const finalKey = keyParts[keyParts.length - 1];
        if (!current[finalKey]) {
          current[finalKey] = value;
          console.log(`✅ Added ${locale}: ${key} = "${value}"`);
        }
      });
      
      // Sauvegarder le fichier mis à jour
      fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2), 'utf8');
      console.log(`📝 Updated ${locale}.json`);
      
    } catch (error) {
      console.error(`❌ Error updating ${locale}.json:`, error.message);
    }
  });
};

console.log('🔧 Adding critical missing translations...\n');
addMissingTranslations();
console.log('\n✅ Critical translations added!');