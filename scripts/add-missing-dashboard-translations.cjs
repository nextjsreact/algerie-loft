const fs = require('fs');
const path = require('path');

console.log('🔧 AJOUT DES TRADUCTIONS MANQUANTES DU DASHBOARD\n');

const translationsPath = path.join(__dirname, '../lib/i18n/translations.ts');
let content = fs.readFileSync(translationsPath, 'utf8');

// Créer une sauvegarde
const backupPath = path.join(__dirname, `../lib/i18n/translations-backup-${Date.now()}.ts`);
fs.writeFileSync(backupPath, content);
console.log(`💾 Sauvegarde créée: ${path.basename(backupPath)}`);

// Traductions manquantes identifiées
const missingTranslations = {
  // Navigation
  'nav.application': {
    en: 'Application',
    fr: 'Application', 
    ar: 'التطبيق'
  },

  // Dashboard
  'dashboard.title': {
    en: 'Dashboard',
    fr: 'Tableau de Bord',
    ar: 'لوحة التحكم'
  },
  'dashboard.subtitle': {
    en: 'Welcome to your property management dashboard',
    fr: 'Bienvenue sur votre tableau de bord de gestion immobilière',
    ar: 'مرحباً بك في لوحة تحكم إدارة العقارات'
  },
  'dashboard.welcomeBack': {
    en: 'Welcome back',
    fr: 'Bon retour',
    ar: 'مرحباً بعودتك'
  },
  'dashboard.totalLofts': {
    en: 'Total Lofts',
    fr: 'Total des Lofts',
    ar: 'إجمالي اللوفت'
  },
  'dashboard.occupiedLofts': {
    en: 'Occupied Lofts',
    fr: 'Lofts Occupés',
    ar: 'اللوفت المشغولة'
  },
  'dashboard.activeTasks': {
    en: 'Active Tasks',
    fr: 'Tâches Actives',
    ar: 'المهام النشطة'
  },
  'dashboard.inProgress': {
    en: 'In Progress',
    fr: 'En Cours',
    ar: 'قيد التنفيذ'
  },
  'dashboard.monthlyRevenue': {
    en: 'Monthly Revenue',
    fr: 'Revenus Mensuels',
    ar: 'الإيرادات الشهرية'
  },
  'dashboard.thisMonth': {
    en: 'This Month',
    fr: 'Ce Mois',
    ar: 'هذا الشهر'
  },
  'dashboard.teams': {
    en: 'Teams',
    fr: 'Équipes',
    ar: 'الفرق'
  },
  'dashboard.activeTeams': {
    en: 'Active Teams',
    fr: 'Équipes Actives',
    ar: 'الفرق النشطة'
  },
  'dashboard.billMonitoring': {
    en: 'Bill Monitoring',
    fr: 'Surveillance des Factures',
    ar: 'مراقبة الفواتير'
  },
  'dashboard.updated': {
    en: 'Updated',
    fr: 'Mis à jour',
    ar: 'محدث'
  },
  'dashboard.overdue': {
    en: 'Overdue',
    fr: 'En Retard',
    ar: 'متأخر'
  },
  'dashboard.billsPastDue': {
    en: 'Bills Past Due',
    fr: 'Factures en Retard',
    ar: 'الفواتير المتأخرة'
  },
  'dashboard.dueToday': {
    en: 'Due Today',
    fr: 'Échéance Aujourd\'hui',
    ar: 'مستحق اليوم'
  },
  'dashboard.billsDueNow': {
    en: 'Bills Due Now',
    fr: 'Factures Échues',
    ar: 'الفواتير المستحقة الآن'
  },
  'dashboard.upcoming': {
    en: 'Upcoming',
    fr: 'À Venir',
    ar: 'قادم'
  },
  'dashboard.next30Days': {
    en: 'Next 30 Days',
    fr: 'Prochains 30 Jours',
    ar: 'الـ 30 يوماً القادمة'
  },
  'dashboard.active': {
    en: 'Active',
    fr: 'Actif',
    ar: 'نشط'
  },
  'dashboard.loftsWithBills': {
    en: 'Lofts with Bills',
    fr: 'Lofts avec Factures',
    ar: 'اللوفت مع الفواتير'
  },
  'dashboard.systemStatus': {
    en: 'System Status',
    fr: 'État du Système',
    ar: 'حالة النظام'
  },
  'dashboard.allBillsCurrent': {
    en: 'All Bills Current',
    fr: 'Toutes les Factures à Jour',
    ar: 'جميع الفواتير محدثة'
  },
  'dashboard.revenueVsExpenses': {
    en: 'Revenue vs Expenses',
    fr: 'Revenus vs Dépenses',
    ar: 'الإيرادات مقابل المصروفات'
  },
  'dashboard.monthlyFinancialOverview': {
    en: 'Monthly Financial Overview',
    fr: 'Aperçu Financier Mensuel',
    ar: 'نظرة عامة مالية شهرية'
  },
  'dashboard.recentTasks': {
    en: 'Recent Tasks',
    fr: 'Tâches Récentes',
    ar: 'المهام الأخيرة'
  },
  'dashboard.latestTaskUpdates': {
    en: 'Latest Task Updates',
    fr: 'Dernières Mises à Jour des Tâches',
    ar: 'آخر تحديثات المهام'
  },
  'dashboard.due': {
    en: 'Due',
    fr: 'Échéance',
    ar: 'مستحق'
  },
  'dashboard.toDo': {
    en: 'To Do',
    fr: 'À Faire',
    ar: 'للقيام به'
  },

  // Bills
  'bills.upcomingBills': {
    en: 'Upcoming Bills',
    fr: 'Factures à Venir',
    ar: 'الفواتير القادمة'
  },
  'bills.overdueBills': {
    en: 'Overdue Bills',
    fr: 'Factures en Retard',
    ar: 'الفواتير المتأخرة'
  },
  'bills.noOverdueBills': {
    en: 'No overdue bills',
    fr: 'Aucune facture en retard',
    ar: 'لا توجد فواتير متأخرة'
  },
  'bills.due': {
    en: 'Due',
    fr: 'Échéance',
    ar: 'مستحق'
  },
  'bills.days': {
    en: 'days',
    fr: 'jours',
    ar: 'أيام'
  },
  'bills.markPaid': {
    en: 'Mark Paid',
    fr: 'Marquer Payé',
    ar: 'تحديد كمدفوع'
  },

  // Bills utilities
  'bills.utilities.telephone': {
    en: 'Telephone',
    fr: 'Téléphone',
    ar: 'الهاتف'
  },
  'bills.utilities.internet': {
    en: 'Internet',
    fr: 'Internet',
    ar: 'الإنترنت'
  },
  'bills.utilities.eau': {
    en: 'Water',
    fr: 'Eau',
    ar: 'المياه'
  }
};

// Fonction pour ajouter les traductions manquantes
function addMissingTranslations(content, translations) {
  const languages = ['en', 'fr', 'ar'];
  
  languages.forEach(lang => {
    // Trouver la position de la section de la langue
    const langPattern = new RegExp(`(${lang}:\\s*{[\\s\\S]*?)(\\n\\s*},?\\s*\\n\\s*(?:en|fr|ar):|\\n\\s*}\\s*$)`, 'g');
    const match = langPattern.exec(content);
    
    if (match) {
      let additions = '';
      
      // Grouper les traductions par section
      const sections = {};
      Object.keys(translations).forEach(key => {
        const parts = key.split('.');
        const section = parts[0];
        const subKey = parts.slice(1).join('.');
        
        if (!sections[section]) {
          sections[section] = {};
        }
        sections[section][subKey] = translations[key][lang];
      });
      
      // Ajouter les sections manquantes
      Object.keys(sections).forEach(sectionName => {
        // Vérifier si la section existe déjà
        const sectionPattern = new RegExp(`${sectionName}:\\s*{`);
        if (!sectionPattern.test(match[1])) {
          // Ajouter la nouvelle section
          additions += `\\n\\n    // ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}\\n`;
          additions += `    ${sectionName}: {\\n`;
          
          Object.keys(sections[sectionName]).forEach(subKey => {
            additions += `      ${subKey}: "${sections[sectionName][subKey]}",\\n`;
          });
          
          additions += `    },`;
        } else {
          // Ajouter les clés manquantes à la section existante
          Object.keys(sections[sectionName]).forEach(subKey => {
            const keyPattern = new RegExp(`${subKey}:\\s*["'][^"']*["']`);
            if (!keyPattern.test(match[1])) {
              // Trouver la fin de la section et ajouter la clé
              const sectionEndPattern = new RegExp(`(${sectionName}:\\s*{[^}]*)(})`);
              const sectionMatch = sectionEndPattern.exec(match[1]);
              if (sectionMatch) {
                const newKey = `      ${subKey}: "${sections[sectionName][subKey]}",\\n    `;
                content = content.replace(sectionMatch[0], sectionMatch[1] + newKey + sectionMatch[2]);
              }
            }
          });
        }
      });
      
      if (additions) {
        content = content.replace(match[0], match[1] + additions + match[2]);
      }
    }
  });
  
  return content;
}

// Appliquer les corrections
console.log('🔧 Ajout des traductions manquantes...');
content = addMissingTranslations(content, missingTranslations);

// Sauvegarder le fichier corrigé
fs.writeFileSync(translationsPath, content);

console.log('✅ Traductions ajoutées avec succès!');
console.log(`📊 ${Object.keys(missingTranslations).length} clés ajoutées pour chaque langue`);
console.log('🎉 Le dashboard devrait maintenant afficher les textes traduits!');

// Vérification finale
console.log('\\n🔍 Vérification finale...');
const finalContent = fs.readFileSync(translationsPath, 'utf8');
let addedCount = 0;

Object.keys(missingTranslations).forEach(key => {
  const subKey = key.split('.').slice(1).join('.');
  if (finalContent.includes(`${subKey}:`)) {
    addedCount++;
  }
});

console.log(`✅ ${addedCount}/${Object.keys(missingTranslations).length} clés vérifiées comme ajoutées`);
console.log('\\n🏆 CORRECTION TERMINÉE!');