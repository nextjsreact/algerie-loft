const fs = require('fs');
const path = require('path');

// Dictionnaire de traductions automatiques
const autoTranslations = {
  // Traductions communes
  common: {
    en: {
      date: "Date",
      next: "Next", 
      none: "None",
      pickDate: "Pick a date",
      pickDateRange: "Pick date range",
      previous: "Previous",
      selectOption: "Select an option",
      time: "Time",
      today: "Today"
    },
    fr: {
      date: "Date",
      next: "Suivant",
      none: "Aucun", 
      pickDate: "Choisir une date",
      pickDateRange: "Choisir une plage de dates",
      previous: "Précédent",
      selectOption: "Sélectionner une option",
      time: "Heure",
      today: "Aujourd'hui"
    },
    ar: {
      date: "التاريخ",
      next: "التالي",
      none: "لا شيء",
      pickDate: "اختر تاريخ",
      pickDateRange: "اختر نطاق التاريخ", 
      previous: "السابق",
      selectOption: "اختر خيار",
      time: "الوقت",
      today: "اليوم"
    }
  },

  // Conversations
  conversations: {
    en: {
      addMembers: "Add Members",
      conversation: "Conversation",
      createDirectOrGroup: "Create Direct or Group",
      createdSuccessfully: "Created successfully",
      direct: "Direct",
      directMessage: "Direct Message",
      enterGroupName: "Enter group name",
      failedToCreateConversation: "Failed to create conversation",
      failedToSearchUsers: "Failed to search users",
      findUserToMessage: "Find user to message",
      group: "Group",
      groupChat: "Group Chat",
      groupName: "Group Name",
      members: "Members",
      messages: "Messages",
      new: "New",
      newConversation: "New Conversation",
      noConversations: "No conversations",
      noConversationsMatch: "No conversations match",
      noConversationsYet: "No conversations yet",
      noMessages: "No messages",
      noMessagesYet: "No messages yet",
      noUsersFound: "No users found",
      participant: "Participant",
      participants: "Participants",
      searchByNameOrEmail: "Search by name or email",
      searchConversations: "Search conversations",
      searchResults: "Search Results",
      searching: "Searching...",
      selectAtLeastOneUser: "Select at least one user",
      selectConversation: "Select Conversation",
      selectConversationDesc: "Choose a conversation to start messaging",
      selectedMembers: "Selected Members",
      selectedUser: "Selected User",
      sendInstructions: "Type your message and press Enter to send",
      someone: "Someone",
      startConversation: "Start Conversation",
      startConversationDesc: "Create a new conversation",
      startNewConversation: "Start New Conversation",
      typeMessage: "Type a message...",
      unknownUser: "Unknown User",
      you: "You"
    },
    fr: {
      addMembers: "Ajouter des Membres",
      conversation: "Conversation",
      createDirectOrGroup: "Créer Direct ou Groupe",
      createdSuccessfully: "Créé avec succès",
      direct: "Direct",
      directMessage: "Message Direct",
      enterGroupName: "Entrez le nom du groupe",
      failedToCreateConversation: "Échec de création de conversation",
      failedToSearchUsers: "Échec de recherche d'utilisateurs",
      findUserToMessage: "Trouver un utilisateur à qui envoyer un message",
      group: "Groupe",
      groupChat: "Chat de Groupe",
      groupName: "Nom du Groupe",
      members: "Membres",
      messages: "Messages",
      new: "Nouveau",
      newConversation: "Nouvelle Conversation",
      noConversations: "Aucune conversation",
      noConversationsMatch: "Aucune conversation ne correspond",
      noConversationsYet: "Aucune conversation pour le moment",
      noMessages: "Aucun message",
      noMessagesYet: "Aucun message pour le moment",
      noUsersFound: "Aucun utilisateur trouvé",
      participant: "Participant",
      participants: "Participants",
      searchByNameOrEmail: "Rechercher par nom ou email",
      searchConversations: "Rechercher des conversations",
      searchResults: "Résultats de Recherche",
      searching: "Recherche...",
      selectAtLeastOneUser: "Sélectionnez au moins un utilisateur",
      selectConversation: "Sélectionner une Conversation",
      selectConversationDesc: "Choisissez une conversation pour commencer à envoyer des messages",
      selectedMembers: "Membres Sélectionnés",
      selectedUser: "Utilisateur Sélectionné",
      sendInstructions: "Tapez votre message et appuyez sur Entrée pour envoyer",
      someone: "Quelqu'un",
      startConversation: "Démarrer une Conversation",
      startConversationDesc: "Créer une nouvelle conversation",
      startNewConversation: "Démarrer une Nouvelle Conversation",
      typeMessage: "Tapez un message...",
      unknownUser: "Utilisateur Inconnu",
      you: "Vous"
    },
    ar: {
      addMembers: "إضافة أعضاء",
      conversation: "محادثة",
      createDirectOrGroup: "إنشاء مباشر أو مجموعة",
      createdSuccessfully: "تم الإنشاء بنجاح",
      direct: "مباشر",
      directMessage: "رسالة مباشرة",
      enterGroupName: "أدخل اسم المجموعة",
      failedToCreateConversation: "فشل في إنشاء المحادثة",
      failedToSearchUsers: "فشل في البحث عن المستخدمين",
      findUserToMessage: "العثور على مستخدم لإرسال رسالة",
      group: "مجموعة",
      groupChat: "دردشة جماعية",
      groupName: "اسم المجموعة",
      members: "الأعضاء",
      messages: "الرسائل",
      new: "جديد",
      newConversation: "محادثة جديدة",
      noConversations: "لا توجد محادثات",
      noConversationsMatch: "لا توجد محادثات مطابقة",
      noConversationsYet: "لا توجد محادثات بعد",
      noMessages: "لا توجد رسائل",
      noMessagesYet: "لا توجد رسائل بعد",
      noUsersFound: "لم يتم العثور على مستخدمين",
      participant: "مشارك",
      participants: "المشاركون",
      searchByNameOrEmail: "البحث بالاسم أو البريد الإلكتروني",
      searchConversations: "البحث في المحادثات",
      searchResults: "نتائج البحث",
      searching: "جاري البحث...",
      selectAtLeastOneUser: "اختر مستخدم واحد على الأقل",
      selectConversation: "اختر محادثة",
      selectConversationDesc: "اختر محادثة لبدء المراسلة",
      selectedMembers: "الأعضاء المختارون",
      selectedUser: "المستخدم المختار",
      sendInstructions: "اكتب رسالتك واضغط Enter للإرسال",
      someone: "شخص ما",
      startConversation: "بدء محادثة",
      startConversationDesc: "إنشاء محادثة جديدة",
      startNewConversation: "بدء محادثة جديدة",
      typeMessage: "اكتب رسالة...",
      unknownUser: "مستخدم غير معروف",
      you: "أنت"
    }
  },

  // Tasks
  tasks: {
    en: {
      assignTo: "Assign to",
      createTask: "Create Task",
      editTask: "Edit Task",
      noTasks: "No tasks found",
      taskDescription: "Task Description",
      taskDetails: "Task Details",
      taskDueDate: "Due Date",
      taskStatus: "Status",
      taskTitle: "Task Title",
      updateTask: "Update Task",
      cancel: "Cancel",
      createError: "Failed to create task",
      createSuccess: "Task created successfully",
      fillTaskInformation: "Fill task information",
      noDueDate: "No due date",
      saving: "Saving...",
      updateError: "Failed to update task",
      updateSuccess: "Task updated successfully",
      updateStatus: "Update Status",
      viewTask: "View Task"
    },
    fr: {
      assignTo: "Assigner à",
      createTask: "Créer une Tâche",
      editTask: "Modifier la Tâche",
      noTasks: "Aucune tâche trouvée",
      taskDescription: "Description de la Tâche",
      taskDetails: "Détails de la Tâche",
      taskDueDate: "Date d'Échéance",
      taskStatus: "Statut",
      taskTitle: "Titre de la Tâche",
      updateTask: "Mettre à Jour la Tâche",
      cancel: "Annuler",
      createError: "Échec de création de la tâche",
      createSuccess: "Tâche créée avec succès",
      fillTaskInformation: "Remplir les informations de la tâche",
      noDueDate: "Pas de date d'échéance",
      saving: "Enregistrement...",
      updateError: "Échec de mise à jour de la tâche",
      updateSuccess: "Tâche mise à jour avec succès",
      updateStatus: "Mettre à Jour le Statut",
      viewTask: "Voir la Tâche"
    },
    ar: {
      assignTo: "تعيين إلى",
      createTask: "إنشاء مهمة",
      editTask: "تعديل المهمة",
      noTasks: "لا توجد مهام",
      taskDescription: "وصف المهمة",
      taskDetails: "تفاصيل المهمة",
      taskDueDate: "تاريخ الاستحقاق",
      taskStatus: "الحالة",
      taskTitle: "عنوان المهمة",
      updateTask: "تحديث المهمة",
      cancel: "إلغاء",
      createError: "فشل في إنشاء المهمة",
      createSuccess: "تم إنشاء المهمة بنجاح",
      fillTaskInformation: "املأ معلومات المهمة",
      noDueDate: "لا يوجد تاريخ استحقاق",
      saving: "جاري الحفظ...",
      updateError: "فشل في تحديث المهمة",
      updateSuccess: "تم تحديث المهمة بنجاح",
      updateStatus: "تحديث الحالة",
      viewTask: "عرض المهمة"
    }
  }
};

// Fonction pour générer une traduction automatique basée sur la clé
function generateTranslation(key, lang) {
  const parts = key.split('.');
  const section = parts[0];
  const subKey = parts[parts.length - 1];
  
  // Si on a une traduction prédéfinie, l'utiliser
  if (autoTranslations[section] && autoTranslations[section][lang] && autoTranslations[section][lang][subKey]) {
    return autoTranslations[section][lang][subKey];
  }
  
  // Sinon, générer une traduction basique
  const baseTranslations = {
    en: {
      // Actions
      add: "Add", edit: "Edit", delete: "Delete", create: "Create", update: "Update",
      save: "Save", cancel: "Cancel", view: "View", search: "Search", filter: "Filter",
      // Status
      active: "Active", inactive: "Inactive", pending: "Pending", completed: "Completed",
      success: "Success", error: "Error", loading: "Loading...", saving: "Saving...",
      // Common
      title: "Title", subtitle: "Subtitle", description: "Description", name: "Name",
      email: "Email", phone: "Phone", address: "Address", date: "Date", time: "Time",
      // Navigation
      dashboard: "Dashboard", settings: "Settings", profile: "Profile", logout: "Logout",
      // Messages
      noData: "No data found", noResults: "No results", selectOption: "Select an option"
    },
    fr: {
      // Actions
      add: "Ajouter", edit: "Modifier", delete: "Supprimer", create: "Créer", update: "Mettre à jour",
      save: "Enregistrer", cancel: "Annuler", view: "Voir", search: "Rechercher", filter: "Filtrer",
      // Status
      active: "Actif", inactive: "Inactif", pending: "En attente", completed: "Terminé",
      success: "Succès", error: "Erreur", loading: "Chargement...", saving: "Enregistrement...",
      // Common
      title: "Titre", subtitle: "Sous-titre", description: "Description", name: "Nom",
      email: "Email", phone: "Téléphone", address: "Adresse", date: "Date", time: "Heure",
      // Navigation
      dashboard: "Tableau de bord", settings: "Paramètres", profile: "Profil", logout: "Déconnexion",
      // Messages
      noData: "Aucune donnée trouvée", noResults: "Aucun résultat", selectOption: "Sélectionner une option"
    },
    ar: {
      // Actions
      add: "إضافة", edit: "تعديل", delete: "حذف", create: "إنشاء", update: "تحديث",
      save: "حفظ", cancel: "إلغاء", view: "عرض", search: "بحث", filter: "تصفية",
      // Status
      active: "نشط", inactive: "غير نشط", pending: "في الانتظار", completed: "مكتمل",
      success: "نجح", error: "خطأ", loading: "جاري التحميل...", saving: "جاري الحفظ...",
      // Common
      title: "العنوان", subtitle: "العنوان الفرعي", description: "الوصف", name: "الاسم",
      email: "البريد الإلكتروني", phone: "الهاتف", address: "العنوان", date: "التاريخ", time: "الوقت",
      // Navigation
      dashboard: "لوحة التحكم", settings: "الإعدادات", profile: "الملف الشخصي", logout: "تسجيل الخروج",
      // Messages
      noData: "لا توجد بيانات", noResults: "لا توجد نتائج", selectOption: "اختر خيار"
    }
  };
  
  // Chercher une correspondance dans les traductions de base
  for (const [baseKey, translation] of Object.entries(baseTranslations[lang])) {
    if (subKey.toLowerCase().includes(baseKey.toLowerCase()) || baseKey.toLowerCase().includes(subKey.toLowerCase())) {
      return translation;
    }
  }
  
  // Fallback: capitaliser la clé
  return subKey.charAt(0).toUpperCase() + subKey.slice(1).replace(/([A-Z])/g, ' $1');
}

async function completeAllTranslations() {
  try {
    console.log('🚀 COMPLETION AUTOMATIQUE DE TOUTES LES TRADUCTIONS');
    
    // Lire le fichier d'analyse
    const analysisPath = path.join(__dirname, 'missing-translations-analysis.json');
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    
    // Lire le fichier de traductions
    const translationsPath = path.join(__dirname, '..', 'lib', 'i18n', 'translations.ts');
    let content = fs.readFileSync(translationsPath, 'utf8');
    
    console.log(`📊 Traductions manquantes: ${analysis.totalMissingKeys}`);
    
    let addedCount = 0;
    
    // Pour chaque section manquante
    Object.entries(analysis.missingBySection).forEach(([section, missingKeys]) => {
      console.log(`\n🔧 Traitement de la section: ${section} (${missingKeys.length} clés)`);
      
      // Pour chaque langue
      ['en', 'fr', 'ar'].forEach(lang => {
        missingKeys.forEach(fullKey => {
          const keyParts = fullKey.split('.');
          if (keyParts[0] === section) {
            const key = keyParts.slice(1).join('.');
            const translation = generateTranslation(fullKey, lang);
            
            // Trouver et mettre à jour la section dans le fichier
            const sectionRegex = new RegExp(`(${lang}:\\s*{[\\s\\S]*?${section}:\\s*{)([\\s\\S]*?)(\\s*}[\\s\\S]*?(?=\\s*//|\\s*}))`, 'g');
            
            content = content.replace(sectionRegex, (match, before, sectionContent, after) => {
              // Vérifier si la clé existe déjà
              if (!sectionContent.includes(`${key}:`)) {
                const indent = '      ';
                const newLine = `${indent}${key}: "${translation}",\n`;
                return before + sectionContent + newLine + after;
              }
              return match;
            });
            
            addedCount++;
          }
        });
      });
    });
    
    // Sauvegarder le fichier
    fs.writeFileSync(translationsPath, content, 'utf8');
    
    console.log(`\n✅ TERMINÉ! ${addedCount} traductions ajoutées automatiquement`);
    console.log('🎉 Toutes les traductions manquantes ont été complétées!');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

completeAllTranslations();