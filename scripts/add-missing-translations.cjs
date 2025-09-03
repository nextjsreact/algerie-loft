const fs = require('fs');
const path = require('path');

// Traductions prioritaires à ajouter
const priorityTranslations = {
  en: {
    // Auth
    auth: {
      enterFullName: "Enter your full name",
      fullName: "Full Name",
      haveAccount: "Already have an account?",
      registrationFailed: "Registration failed",
      signUpDescription: "Create your account to get started",
      signUpTitle: "Sign Up",
      signingUp: "Signing Up...",
      unexpectedError: "An unexpected error occurred"
    },
    
    // Bills
    bills: {
      dayOverdue: "day overdue",
      daysOverdue: "days overdue",
      dueToday: "Due today",
      dueTomorrow: "Due tomorrow",
      failedToLoadAlerts: "Failed to load alerts",
      noUpcomingBills: "No upcoming bills"
    },
    
    // Dashboard
    dashboard: {
      actionRequired: "Action Required",
      allCaughtUp: "All caught up!",
      attentionNeeded: "Attention Needed",
      completed: "Completed",
      errorLoadingData: "Error loading data",
      expenses: "Expenses",
      myProfile: "My Profile",
      needHelp: "Need Help?",
      noTasksAssigned: "No tasks assigned",
      quickActions: "Quick Actions",
      revenue: "Revenue",
      urgentTasks: "Urgent Tasks",
      viewAllMyTasks: "View All My Tasks"
    },
    
    // Lofts
    lofts: {
      deleteConfirm: "Are you sure you want to delete this loft?",
      deleteConfirmMessage: "This action cannot be undone.",
      deleteError: "Failed to delete loft",
      nextEnergyBill: "Next Energy Bill",
      nextPhoneBill: "Next Phone Bill",
      nextWaterBill: "Next Water Bill"
    },
    
    // Tasks
    tasks: {
      assignTo: "Assign to",
      createTask: "Create Task",
      editTask: "Edit Task",
      noTasks: "No tasks found",
      taskDescription: "Task Description",
      taskDetails: "Task Details",
      taskDueDate: "Due Date",
      taskStatus: "Status",
      taskTitle: "Task Title",
      updateTask: "Update Task"
    }
  },
  
  fr: {
    // Auth
    auth: {
      enterFullName: "Entrez votre nom complet",
      fullName: "Nom Complet",
      haveAccount: "Vous avez déjà un compte ?",
      registrationFailed: "Échec de l'inscription",
      signUpDescription: "Créez votre compte pour commencer",
      signUpTitle: "S'Inscrire",
      signingUp: "Inscription...",
      unexpectedError: "Une erreur inattendue s'est produite"
    },
    
    // Bills
    bills: {
      dayOverdue: "jour de retard",
      daysOverdue: "jours de retard",
      dueToday: "Échéance aujourd'hui",
      dueTomorrow: "Échéance demain",
      failedToLoadAlerts: "Échec du chargement des alertes",
      noUpcomingBills: "Aucune facture à venir"
    },
    
    // Dashboard
    dashboard: {
      actionRequired: "Action Requise",
      allCaughtUp: "Tout est à jour !",
      attentionNeeded: "Attention Nécessaire",
      completed: "Terminé",
      errorLoadingData: "Erreur de chargement des données",
      expenses: "Dépenses",
      myProfile: "Mon Profil",
      needHelp: "Besoin d'aide ?",
      noTasksAssigned: "Aucune tâche assignée",
      quickActions: "Actions Rapides",
      revenue: "Revenus",
      urgentTasks: "Tâches Urgentes",
      viewAllMyTasks: "Voir Toutes Mes Tâches"
    },
    
    // Lofts
    lofts: {
      deleteConfirm: "Êtes-vous sûr de vouloir supprimer ce loft ?",
      deleteConfirmMessage: "Cette action ne peut pas être annulée.",
      deleteError: "Échec de la suppression du loft",
      nextEnergyBill: "Prochaine Facture Énergie",
      nextPhoneBill: "Prochaine Facture Téléphone",
      nextWaterBill: "Prochaine Facture Eau"
    },
    
    // Tasks
    tasks: {
      assignTo: "Assigner à",
      createTask: "Créer une Tâche",
      editTask: "Modifier la Tâche",
      noTasks: "Aucune tâche trouvée",
      taskDescription: "Description de la Tâche",
      taskDetails: "Détails de la Tâche",
      taskDueDate: "Date d'Échéance",
      taskStatus: "Statut",
      taskTitle: "Titre de la Tâche",
      updateTask: "Mettre à Jour la Tâche"
    }
  },
  
  ar: {
    // Auth
    auth: {
      enterFullName: "أدخل اسمك الكامل",
      fullName: "الاسم الكامل",
      haveAccount: "هل لديك حساب بالفعل؟",
      registrationFailed: "فشل التسجيل",
      signUpDescription: "أنشئ حسابك للبدء",
      signUpTitle: "التسجيل",
      signingUp: "جاري التسجيل...",
      unexpectedError: "حدث خطأ غير متوقع"
    },
    
    // Bills
    bills: {
      dayOverdue: "يوم متأخر",
      daysOverdue: "أيام متأخرة",
      dueToday: "مستحق اليوم",
      dueTomorrow: "مستحق غداً",
      failedToLoadAlerts: "فشل في تحميل التنبيهات",
      noUpcomingBills: "لا توجد فواتير قادمة"
    },
    
    // Dashboard
    dashboard: {
      actionRequired: "مطلوب إجراء",
      allCaughtUp: "كل شيء محدث!",
      attentionNeeded: "يحتاج انتباه",
      completed: "مكتمل",
      errorLoadingData: "خطأ في تحميل البيانات",
      expenses: "المصروفات",
      myProfile: "ملفي الشخصي",
      needHelp: "تحتاج مساعدة؟",
      noTasksAssigned: "لا توجد مهام مخصصة",
      quickActions: "إجراءات سريعة",
      revenue: "الإيرادات",
      urgentTasks: "المهام العاجلة",
      viewAllMyTasks: "عرض جميع مهامي"
    },
    
    // Lofts
    lofts: {
      deleteConfirm: "هل أنت متأكد من حذف هذا اللوفت؟",
      deleteConfirmMessage: "لا يمكن التراجع عن هذا الإجراء.",
      deleteError: "فشل في حذف اللوفت",
      nextEnergyBill: "فاتورة الطاقة القادمة",
      nextPhoneBill: "فاتورة الهاتف القادمة",
      nextWaterBill: "فاتورة المياه القادمة"
    },
    
    // Tasks
    tasks: {
      assignTo: "تعيين إلى",
      createTask: "إنشاء مهمة",
      editTask: "تعديل المهمة",
      noTasks: "لا توجد مهام",
      taskDescription: "وصف المهمة",
      taskDetails: "تفاصيل المهمة",
      taskDueDate: "تاريخ الاستحقاق",
      taskStatus: "الحالة",
      taskTitle: "عنوان المهمة",
      updateTask: "تحديث المهمة"
    }
  }
};

function addMissingTranslations() {
  const translationsPath = path.join(__dirname, '..', 'lib', 'i18n', 'translations.ts');
  
  try {
    let content = fs.readFileSync(translationsPath, 'utf8');
    
    // Pour chaque langue
    Object.keys(priorityTranslations).forEach(lang => {
      const langTranslations = priorityTranslations[lang];
      
      // Pour chaque section
      Object.keys(langTranslations).forEach(section => {
        const sectionTranslations = langTranslations[section];
        
        // Trouver la section dans le fichier
        const sectionRegex = new RegExp(`(${lang}:\\s*{[\\s\\S]*?${section}:\\s*{)([\\s\\S]*?)(\\s*}[\\s\\S]*?(?=\\s*//|\\s*}))`, 'g');
        
        content = content.replace(sectionRegex, (match, before, sectionContent, after) => {
          let newSectionContent = sectionContent;
          
          // Ajouter les traductions manquantes
          Object.keys(sectionTranslations).forEach(key => {
            const value = sectionTranslations[key];
            if (!newSectionContent.includes(`${key}:`)) {
              // Ajouter la traduction avant la fermeture de la section
              newSectionContent += `      ${key}: "${value}",\n`;
            }
          });
          
          return before + newSectionContent + after;
        });
      });
    });
    
    fs.writeFileSync(translationsPath, content, 'utf8');
    console.log('✅ Traductions prioritaires ajoutées avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des traductions:', error.message);
  }
}

addMissingTranslations();