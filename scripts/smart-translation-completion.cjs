const fs = require('fs');
const path = require('path');

// Traductions intelligentes par section
const smartTranslations = {
  conversations: {
    en: {
      title: "Conversations",
      subtitle: "Manage your conversations",
      newConversation: "New Conversation",
      noConversations: "No conversations found",
      searchConversations: "Search conversations",
      typeMessage: "Type a message...",
      sendMessage: "Send Message",
      participants: "Participants",
      addMembers: "Add Members",
      groupName: "Group Name",
      createGroup: "Create Group",
      directMessage: "Direct Message"
    },
    fr: {
      title: "Conversations",
      subtitle: "Gérez vos conversations",
      newConversation: "Nouvelle Conversation",
      noConversations: "Aucune conversation trouvée",
      searchConversations: "Rechercher des conversations",
      typeMessage: "Tapez un message...",
      sendMessage: "Envoyer un Message",
      participants: "Participants",
      addMembers: "Ajouter des Membres",
      groupName: "Nom du Groupe",
      createGroup: "Créer un Groupe",
      directMessage: "Message Direct"
    },
    ar: {
      title: "المحادثات",
      subtitle: "إدارة محادثاتك",
      newConversation: "محادثة جديدة",
      noConversations: "لا توجد محادثات",
      searchConversations: "البحث في المحادثات",
      typeMessage: "اكتب رسالة...",
      sendMessage: "إرسال رسالة",
      participants: "المشاركون",
      addMembers: "إضافة أعضاء",
      groupName: "اسم المجموعة",
      createGroup: "إنشاء مجموعة",
      directMessage: "رسالة مباشرة"
    }
  },

  tasks: {
    en: {
      assignTo: "Assign to",
      createTask: "Create Task",
      editTask: "Edit Task",
      taskTitle: "Task Title",
      taskDescription: "Task Description",
      taskDueDate: "Due Date",
      taskStatus: "Status",
      noTasks: "No tasks found",
      updateTask: "Update Task",
      deleteTask: "Delete Task"
    },
    fr: {
      assignTo: "Assigner à",
      createTask: "Créer une Tâche",
      editTask: "Modifier la Tâche",
      taskTitle: "Titre de la Tâche",
      taskDescription: "Description de la Tâche",
      taskDueDate: "Date d'Échéance",
      taskStatus: "Statut",
      noTasks: "Aucune tâche trouvée",
      updateTask: "Mettre à Jour la Tâche",
      deleteTask: "Supprimer la Tâche"
    },
    ar: {
      assignTo: "تعيين إلى",
      createTask: "إنشاء مهمة",
      editTask: "تعديل المهمة",
      taskTitle: "عنوان المهمة",
      taskDescription: "وصف المهمة",
      taskDueDate: "تاريخ الاستحقاق",
      taskStatus: "الحالة",
      noTasks: "لا توجد مهام",
      updateTask: "تحديث المهمة",
      deleteTask: "حذف المهمة"
    }
  },

  reservations: {
    en: {
      title: "Reservations",
      subtitle: "Manage your reservations",
      newReservation: "New Reservation",
      checkIn: "Check In",
      checkOut: "Check Out",
      guestName: "Guest Name",
      guestEmail: "Guest Email",
      guestPhone: "Guest Phone",
      totalAmount: "Total Amount",
      status: "Status",
      confirmed: "Confirmed",
      pending: "Pending",
      cancelled: "Cancelled"
    },
    fr: {
      title: "Réservations",
      subtitle: "Gérez vos réservations",
      newReservation: "Nouvelle Réservation",
      checkIn: "Arrivée",
      checkOut: "Départ",
      guestName: "Nom du Client",
      guestEmail: "Email du Client",
      guestPhone: "Téléphone du Client",
      totalAmount: "Montant Total",
      status: "Statut",
      confirmed: "Confirmé",
      pending: "En Attente",
      cancelled: "Annulé"
    },
    ar: {
      title: "الحجوزات",
      subtitle: "إدارة حجوزاتك",
      newReservation: "حجز جديد",
      checkIn: "تسجيل الوصول",
      checkOut: "تسجيل المغادرة",
      guestName: "اسم الضيف",
      guestEmail: "بريد الضيف الإلكتروني",
      guestPhone: "هاتف الضيف",
      totalAmount: "المبلغ الإجمالي",
      status: "الحالة",
      confirmed: "مؤكد",
      pending: "في الانتظار",
      cancelled: "ملغي"
    }
  }
};

function addSmartTranslations() {
  try {
    console.log('🧠 AJOUT INTELLIGENT DES TRADUCTIONS MANQUANTES');
    
    const translationsPath = path.join(__dirname, '..', 'lib', 'i18n', 'translations.ts');
    let content = fs.readFileSync(translationsPath, 'utf8');
    
    let addedCount = 0;
    
    // Pour chaque section de traductions intelligentes
    Object.entries(smartTranslations).forEach(([section, languages]) => {
      console.log(`\n🔧 Ajout des traductions pour: ${section}`);
      
      // Pour chaque langue
      Object.entries(languages).forEach(([lang, translations]) => {
        // Trouver la section dans le fichier
        const sectionRegex = new RegExp(`(${lang}:\\s*{[\\s\\S]*?${section}:\\s*{)([\\s\\S]*?)(\\s*}[\\s\\S]*?(?=\\s*//|\\s*}))`, 'g');
        
        content = content.replace(sectionRegex, (match, before, sectionContent, after) => {
          let newContent = sectionContent;
          
          // Ajouter chaque traduction manquante
          Object.entries(translations).forEach(([key, value]) => {
            if (!sectionContent.includes(`${key}:`)) {
              newContent += `      ${key}: "${value}",\n`;
              addedCount++;
            }
          });
          
          return before + newContent + after;
        });
      });
    });
    
    // Sauvegarder le fichier
    fs.writeFileSync(translationsPath, content, 'utf8');
    
    console.log(`\n✅ ${addedCount} traductions intelligentes ajoutées!`);
    console.log('🎯 Sections complétées: conversations, tasks, reservations');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addSmartTranslations();