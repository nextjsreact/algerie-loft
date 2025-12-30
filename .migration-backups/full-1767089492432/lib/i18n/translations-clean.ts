export type Language = 'en' | 'fr' | 'ar'

export const translations = {
  en: {
    // Common
    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      add: "Add",
      update: "Update",
      create: "Create",
      back: "Back",
      success: "Success",
      error: "Error",
      saving: "Saving...",
      refresh: "Refresh",
      name: "Name",
      actions: "Actions",
      code: "Code",
      symbol: "Symbol",
      ratio: "Ratio",
      yes: "Yes",
      no: "No",
      copyId: "Copy ID",
      confirmDelete: "Are you sure you want to delete this item?",
      pickDate: "Pick a date",
      pickDateRange: "Pick date range",
      next: "Next",
      previous: "Previous",
      today: "Today",
      date: "Date",
      time: "Time",
      none: "None",
      selectOption: "Select an option"
    },

    // Landing
    landing: {
      title: "Loft Algerie",
      subtitle: "Professional Property Management Platform",
      description: "Streamline your property management with our comprehensive platform for lofts, reservations, and financial tracking."
    },

    // Authentication
    auth: {
      signIn: "Sign In",
      signUp: "Sign Up",
      signOut: "Sign Out",
      welcomeBack: "Welcome Back",
      signInDescription: "Sign in to your account to continue",
      email: "Email",
      enterEmail: "Enter your email",
      password: "Password",
      enterPassword: "Enter your password",
      forgotPassword: "Forgot Password?",
      signingIn: "Signing In...",
      rememberMe: "Remember me",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      createAccount: "Create Account",
      signInToAccount: "Sign in to your account",
      demoAccounts: "Demo Accounts",
      admin: "Admin",
      manager: "Manager",
      member: "Member"
    },

    // Navigation
    nav: {
      dashboard: "Dashboard",
      conversations: "Conversations",
      lofts: "Lofts",
      reservations: "Reservations",
      tasks: "Tasks",
      transactions: "Transactions",
      teams: "Teams",
      owners: "Owners",
      settings: "Settings",
      reports: "Reports",
      notifications: "Notifications"
    },

    // Lofts
    lofts: {
      title: "Lofts",
      subtitle: "Manage your loft properties",
      addLoft: "Add Loft",
      nextInternetBill: "Next Internet Bill",
      nextTvBill: "Next TV Bill",
      tvSubscription: "TV Channels Subscription",
      subscriptionFrequency: "TV Subscription Frequency",
      monthly: "Monthly",
      weekly: "Weekly",
      bimonthly: "Bimonthly",
      quarterly: "Quarterly",
      fourMonths: "Four Months",
      sixMonths: "Six Months",
      annual: "Annual"
    },

    // Tasks
    tasks: {
      title: "Tasks",
      subtitle: "Manage your tasks and assignments",
      yourTasks: "Your assigned tasks",
      addTask: "Add Task",
      assignedTo: "Assigned to",
      status: {
        inProgress: "In Progress",
        todo: "To Do",
        completed: "Completed",
        cancelled: "Cancelled"
      },
      filters: {
        filterByStatus: "Filter by status"
      }
    },

    // Reservations
    reservations: {
      title: "Reservations",
      description: "Professional reservation management system",
      create: "Create Reservation",
      liveView: "Live View",
      quickActions: "Quick Actions",
      newReservation: "New Reservation",
      manageGuests: "Manage Guests",
      viewReports: "View Reports",
      recentActivity: "Recent Activity",
      availabilityManagement: "Availability Management",
      proTools: "Pro Tools",
      nights: "nights",
      analytics: {
        title: "Analytics Dashboard",
        totalReservations: "Total Reservations",
        monthlyRevenue: "Monthly Revenue",
        occupancyRate: "Occupancy Rate",
        guestSatisfaction: "Guest Satisfaction",
        vsLastMonth: "vs last month"
      },
      tabs: {
        calendar: "Calendar",
        list: "List View",
        analytics: "Analytics"
      },
      calendar: {
        title: "Reservation Calendar",
        month: "Month",
        week: "Week",
        day: "Day",
        agenda: "Agenda"
      },
      status: {
        confirmed: "Confirmed",
        pending: "Pending",
        cancelled: "Cancelled",
        completed: "Completed"
      },
      upcoming: {
        title: "Upcoming Reservations",
        empty: "No upcoming reservations"
      },
      activities: {
        newReservation: "New reservation created",
        checkinCompleted: "Check-in completed",
        bookingCancelled: "Booking cancelled",
        minAgo: "2 min ago",
        hourAgo: "1 hour ago",
        hoursAgo: "3 hours ago"
      },
      form: {
        title: "Create New Reservation"
      },
      details: {
        title: "Reservation Details",
        guest: "Guest Information",
        dates: "Stay Dates",
        loft: "Property",
        total: "Total Amount",
        specialRequests: "Special Requests"
      },
      availability: {
        selectLoft: "Select Loft",
        management: "Availability Management",
        blockDates: "Block Dates",
        unblockDates: "Unblock Dates",
        chooseLoft: "Choose Loft",
        reasonForBlocking: "Reason for Blocking",
        selectReason: "Select Reason",
        maintenance: "Maintenance",
        personalUse: "Personal Use",
        renovation: "Renovation",
        other: "Other",
        startDate: "Start Date",
        endDate: "End Date",
        priceOverride: "Price Override",
        minimumStay: "Minimum Stay"
      }
    },

    // Teams
    teams: {
      title: "Teams",
      subtitle: "Manage your teams and members",
      addTeam: "Add Team",
      createdBy: "Created by",
      activeTasks: "Active Tasks"
    },

    // Owners
    owners: {
      title: "Owners",
      subtitle: "Manage property owners",
      addOwner: "Add Owner"
    },

    // Analytics
    analytics: {
      title: "Analytics",
      subtitle: "Business insights and reports",
      top5ProfitableLofts: "Top 5 Profitable Lofts",
      mostValuableAssets: "Most Valuable Assets"
    },

    // Transactions
    transactions: {
      title: "Transactions",
      subtitle: "Manage your financial transactions",
      referenceAmounts: "Reference Amounts",
      addNewTransaction: "Add New Transaction",
      totalIncome: "Total Income",
      totalExpenses: "Total Expenses",
      netIncome: "Net Income",
      startDate: "Start Date",
      endDate: "End Date",
      type: "Type",
      allTypes: "All Types",
      category: "Category",
      allCategories: "All Categories",
      loft: "Loft",
      allLofts: "All Lofts",
      currency: "Currency",
      allCurrencies: "All Currencies",
      paymentMethod: "Payment Method",
      allPaymentMethods: "All Payment Methods",
      noTransactions: "No transactions found",
      amount: "Amount",
      equivalent: "Equivalent",
      ratio: "Ratio",
      deleteConfirmTitle: "Delete Transaction",
      deleteConfirmDescription: "This action cannot be undone. This will permanently delete the transaction.",
      continue: "Continue",
      income: "Income",
      expense: "Expense",
      optional: "Optional"
    }
  },

  fr: {
    // Common
    common: {
      loading: "Chargement...",
      save: "Enregistrer",
      cancel: "Annuler",
      edit: "Modifier",
      delete: "Supprimer",
      view: "Voir",
      add: "Ajouter",
      update: "Mettre à jour",
      create: "Créer",
      back: "Retour",
      success: "Succès",
      error: "Erreur",
      saving: "Enregistrement...",
      refresh: "Actualiser",
      name: "Nom",
      actions: "Actions",
      code: "Code",
      symbol: "Symbole",
      ratio: "Ratio",
      yes: "Oui",
      no: "Non",
      copyId: "Copier l'ID",
      confirmDelete: "Êtes-vous sûr de vouloir supprimer cet élément ?",
      pickDate: "Choisir une date",
      pickDateRange: "Choisir une plage de dates",
      next: "Suivant",
      previous: "Précédent",
      today: "Aujourd'hui",
      date: "Date",
      time: "Heure",
      none: "Aucun",
      selectOption: "Sélectionner une option"
    },

    // Landing
    landing: {
      title: "Loft Algérie",
      subtitle: "Plateforme Professionnelle de Gestion Immobilière",
      description: "Rationalisez votre gestion immobilière avec notre plateforme complète pour lofts, réservations et suivi financier."
    },

    // Authentication
    auth: {
      signIn: "Se Connecter",
      signUp: "S'inscrire",
      signOut: "Se Déconnecter",
      welcomeBack: "Bon Retour",
      signInDescription: "Connectez-vous à votre compte pour continuer",
      email: "Email",
      enterEmail: "Entrez votre email",
      password: "Mot de passe",
      enterPassword: "Entrez votre mot de passe",
      forgotPassword: "Mot de passe oublié ?",
      signingIn: "Connexion...",
      rememberMe: "Se souvenir de moi",
      noAccount: "Vous n'avez pas de compte ?",
      hasAccount: "Vous avez déjà un compte ?",
      createAccount: "Créer un Compte",
      signInToAccount: "Connectez-vous à votre compte",
      demoAccounts: "Comptes de Démonstration",
      admin: "Administrateur",
      manager: "Gestionnaire",
      member: "Membre"
    },

    // Navigation
    nav: {
      dashboard: "Tableau de Bord",
      conversations: "Conversations",
      lofts: "Lofts",
      reservations: "Réservations",
      tasks: "Tâches",
      transactions: "Transactions",
      teams: "Équipes",
      owners: "Propriétaires",
      settings: "Paramètres",
      reports: "Rapports",
      notifications: "Notifications"
    },

    // Lofts
    lofts: {
      title: "Lofts",
      subtitle: "Gérez vos propriétés loft",
      addLoft: "Ajouter un Loft",
      nextInternetBill: "Prochaine Facture Internet",
      nextTvBill: "Prochaine Facture TV",
      tvSubscription: "Abonnement Chaînes TV",
      subscriptionFrequency: "Fréquence Abonnement TV",
      monthly: "Mensuel",
      weekly: "Hebdomadaire",
      bimonthly: "Bimestriel",
      quarterly: "Trimestriel",
      fourMonths: "Quatre Mois",
      sixMonths: "Six Mois",
      annual: "Annuel"
    },

    // Tasks
    tasks: {
      title: "Tâches",
      subtitle: "Gérez vos tâches et affectations",
      yourTasks: "Vos tâches assignées",
      addTask: "Ajouter une Tâche",
      assignedTo: "Assigné à",
      status: {
        inProgress: "En Cours",
        todo: "À Faire",
        completed: "Terminé",
        cancelled: "Annulé"
      },
      filters: {
        filterByStatus: "Filtrer par statut"
      }
    },

    // Reservations
    reservations: {
      title: "Réservations",
      description: "Système professionnel de gestion des réservations",
      create: "Créer une Réservation",
      liveView: "Vue en Direct",
      quickActions: "Actions Rapides",
      newReservation: "Nouvelle Réservation",
      manageGuests: "Gérer les Invités",
      viewReports: "Voir les Rapports",
      recentActivity: "Activité Récente",
      availabilityManagement: "Gestion de la Disponibilité",
      proTools: "Outils Pro",
      nights: "nuits",
      analytics: {
        title: "Tableau de Bord Analytique",
        totalReservations: "Total des Réservations",
        monthlyRevenue: "Revenus Mensuels",
        occupancyRate: "Taux d'Occupation",
        guestSatisfaction: "Satisfaction des Invités",
        vsLastMonth: "vs mois dernier"
      },
      tabs: {
        calendar: "Calendrier",
        list: "Vue Liste",
        analytics: "Analytiques"
      },
      calendar: {
        title: "Calendrier des Réservations",
        month: "Mois",
        week: "Semaine",
        day: "Jour",
        agenda: "Agenda"
      },
      status: {
        confirmed: "Confirmé",
        pending: "En Attente",
        cancelled: "Annulé",
        completed: "Terminé"
      },
      upcoming: {
        title: "Réservations à Venir",
        empty: "Aucune réservation à venir"
      },
      activities: {
        newReservation: "Nouvelle réservation créée",
        checkinCompleted: "Enregistrement terminé",
        bookingCancelled: "Réservation annulée",
        minAgo: "il y a 2 min",
        hourAgo: "il y a 1 heure",
        hoursAgo: "il y a 3 heures"
      },
      form: {
        title: "Créer une Nouvelle Réservation"
      },
      details: {
        title: "Détails de la Réservation",
        guest: "Informations de l'Invité",
        dates: "Dates de Séjour",
        loft: "Propriété",
        total: "Montant Total",
        specialRequests: "Demandes Spéciales"
      },
      availability: {
        selectLoft: "Sélectionner un Loft",
        management: "Gestion de la Disponibilité",
        blockDates: "Bloquer les Dates",
        unblockDates: "Débloquer les Dates",
        chooseLoft: "Choisir un Loft",
        reasonForBlocking: "Raison du Blocage",
        selectReason: "Sélectionner une Raison",
        maintenance: "Maintenance",
        personalUse: "Usage Personnel",
        renovation: "Rénovation",
        other: "Autre",
        startDate: "Date de Début",
        endDate: "Date de Fin",
        priceOverride: "Remplacement de Prix",
        minimumStay: "Séjour Minimum"
      }
    },

    // Teams
    teams: {
      title: "Équipes",
      subtitle: "Gérez vos équipes et membres",
      addTeam: "Ajouter une Équipe",
      createdBy: "Créé par",
      activeTasks: "Tâches Actives"
    },

    // Owners
    owners: {
      title: "Propriétaires",
      subtitle: "Gérer les propriétaires",
      addOwner: "Ajouter un Propriétaire"
    },

    // Analytics
    analytics: {
      title: "Analytiques",
      subtitle: "Aperçus et rapports d'affaires",
      top5ProfitableLofts: "Top 5 des Lofts Rentables",
      mostValuableAssets: "Actifs les Plus Précieux"
    },

    // Transactions
    transactions: {
      title: "Transactions",
      subtitle: "Gérez vos transactions financières",
      referenceAmounts: "Montants de Référence",
      addNewTransaction: "Ajouter une Nouvelle Transaction",
      totalIncome: "Total des Revenus",
      totalExpenses: "Total des Dépenses",
      netIncome: "Revenu Net",
      startDate: "Date de Début",
      endDate: "Date de Fin",
      type: "Type",
      allTypes: "Tous les Types",
      category: "Catégorie",
      allCategories: "Toutes les Catégories",
      loft: "Loft",
      allLofts: "Tous les Lofts",
      currency: "Devise",
      allCurrencies: "Toutes les Devises",
      paymentMethod: "Méthode de Paiement",
      allPaymentMethods: "Toutes les Méthodes de Paiement",
      noTransactions: "Aucune transaction trouvée",
      amount: "Montant",
      equivalent: "Équivalent",
      ratio: "Ratio",
      deleteConfirmTitle: "Supprimer la Transaction",
      deleteConfirmDescription: "Cette action ne peut pas être annulée. Cela supprimera définitivement la transaction.",
      continue: "Continuer",
      income: "Revenus",
      expense: "Dépenses",
      optional: "Optionnel"
    }
  },

  ar: {
    // Common
    common: {
      loading: "جاري التحميل...",
      save: "حفظ",
      cancel: "إلغاء",
      edit: "تعديل",
      delete: "حذف",
      view: "عرض",
      add: "إضافة",
      update: "تحديث",
      create: "إنشاء",
      back: "رجوع",
      success: "نجح",
      error: "خطأ",
      saving: "جاري الحفظ...",
      refresh: "تحديث",
      name: "الاسم",
      actions: "الإجراءات",
      code: "الرمز",
      symbol: "الرمز",
      ratio: "النسبة",
      yes: "نعم",
      no: "لا",
      copyId: "نسخ المعرف",
      confirmDelete: "هل أنت متأكد من أنك تريد حذف هذا العنصر؟",
      pickDate: "اختر تاريخاً",
      pickDateRange: "اختر نطاق تاريخ",
      next: "التالي",
      previous: "السابق",
      today: "اليوم",
      date: "التاريخ",
      time: "الوقت",
      none: "لا شيء",
      selectOption: "اختر خياراً"
    },

    // Landing
    landing: {
      title: "لوفت الجزائر",
      subtitle: "منصة إدارة العقارات المهنية",
      description: "قم بتبسيط إدارة الممتلكات الخاصة بك مع منصتنا الشاملة للوفت والحجوزات والتتبع المالي."
    },

    // Authentication
    auth: {
      signIn: "تسجيل الدخول",
      signUp: "إنشاء حساب",
      signOut: "تسجيل الخروج",
      welcomeBack: "مرحباً بعودتك",
      signInDescription: "قم بتسجيل الدخول إلى حسابك للمتابعة",
      email: "البريد الإلكتروني",
      enterEmail: "أدخل بريدك الإلكتروني",
      password: "كلمة المرور",
      enterPassword: "أدخل كلمة المرور",
      forgotPassword: "نسيت كلمة المرور؟",
      signingIn: "جاري تسجيل الدخول...",
      rememberMe: "تذكرني",
      noAccount: "ليس لديك حساب؟",
      hasAccount: "لديك حساب بالفعل؟",
      createAccount: "إنشاء حساب",
      signInToAccount: "قم بتسجيل الدخول إلى حسابك",
      demoAccounts: "حسابات تجريبية",
      admin: "مدير",
      manager: "مدير",
      member: "عضو"
    },

    // Navigation
    nav: {
      dashboard: "لوحة التحكم",
      conversations: "المحادثات",
      lofts: "اللوفت",
      reservations: "الحجوزات",
      tasks: "المهام",
      transactions: "المعاملات",
      teams: "الفرق",
      owners: "الملاك",
      settings: "الإعدادات",
      reports: "التقارير",
      notifications: "الإشعارات"
    },

    // Lofts
    lofts: {
      title: "اللوفت",
      subtitle: "إدارة عقارات اللوفت الخاصة بك",
      addLoft: "إضافة لوفت",
      nextInternetBill: "فاتورة الإنترنت القادمة",
      nextTvBill: "فاتورة التلفزيون القادمة",
      tvSubscription: "اشتراك القنوات التلفزيونية",
      subscriptionFrequency: "تكرار اشتراك التلفزيون",
      monthly: "شهري",
      weekly: "أسبوعي",
      bimonthly: "كل شهرين",
      quarterly: "ربع سنوي",
      fourMonths: "أربعة أشهر",
      sixMonths: "ستة أشهر",
      annual: "سنوي"
    },

    // Tasks
    tasks: {
      title: "المهام",
      subtitle: "إدارة المهام والمهام المعينة",
      yourTasks: "المهام المعينة لك",
      addTask: "إضافة مهمة",
      assignedTo: "مُعيَّن إلى",
      status: {
        inProgress: "قيد التنفيذ",
        todo: "للقيام به",
        completed: "مكتمل",
        cancelled: "ملغي"
      },
      filters: {
        filterByStatus: "تصفية حسب الحالة"
      }
    },

    // Reservations
    reservations: {
      title: "الحجوزات",
      description: "نظام إدارة الحجوزات المهني",
      create: "إنشاء حجز",
      liveView: "عرض مباشر",
      quickActions: "إجراءات سريعة",
      newReservation: "حجز جديد",
      manageGuests: "إدارة الضيوف",
      viewReports: "عرض التقارير",
      recentActivity: "النشاط الأخير",
      availabilityManagement: "إدارة التوفر",
      proTools: "أدوات احترافية",
      nights: "ليالي",
      analytics: {
        title: "لوحة التحليلات",
        totalReservations: "إجمالي الحجوزات",
        monthlyRevenue: "الإيرادات الشهرية",
        occupancyRate: "معدل الإشغال",
        guestSatisfaction: "رضا الضيوف",
        vsLastMonth: "مقارنة بالشهر الماضي"
      },
      tabs: {
        calendar: "التقويم",
        list: "عرض القائمة",
        analytics: "التحليلات"
      },
      calendar: {
        title: "تقويم الحجوزات",
        month: "شهر",
        week: "أسبوع",
        day: "يوم",
        agenda: "جدول الأعمال"
      },
      status: {
        confirmed: "مؤكد",
        pending: "في الانتظار",
        cancelled: "ملغي",
        completed: "مكتمل"
      },
      upcoming: {
        title: "الحجوزات القادمة",
        empty: "لا توجد حجوزات قادمة"
      },
      activities: {
        newReservation: "تم إنشاء حجز جديد",
        checkinCompleted: "تم إكمال تسجيل الوصول",
        bookingCancelled: "تم إلغاء الحجز",
        minAgo: "منذ دقيقتين",
        hourAgo: "منذ ساعة",
        hoursAgo: "منذ 3 ساعات"
      },
      form: {
        title: "إنشاء حجز جديد"
      },
      details: {
        title: "تفاصيل الحجز",
        guest: "معلومات الضيف",
        dates: "تواريخ الإقامة",
        loft: "العقار",
        total: "المبلغ الإجمالي",
        specialRequests: "الطلبات الخاصة"
      },
      availability: {
        selectLoft: "اختر لوفت",
        management: "إدارة التوفر",
        blockDates: "حجب التواريخ",
        unblockDates: "إلغاء حجب التواريخ",
        chooseLoft: "اختر لوفت",
        reasonForBlocking: "سبب الحجب",
        selectReason: "اختر السبب",
        maintenance: "صيانة",
        personalUse: "استخدام شخصي",
        renovation: "تجديد",
        other: "أخرى",
        startDate: "تاريخ البداية",
        endDate: "تاريخ النهاية",
        priceOverride: "تجاوز السعر",
        minimumStay: "الحد الأدنى للإقامة"
      }
    },

    // Teams
    teams: {
      title: "الفرق",
      subtitle: "إدارة الفرق والأعضاء",
      addTeam: "إضافة فريق",
      createdBy: "أنشأ بواسطة",
      activeTasks: "المهام النشطة"
    },

    // Owners
    owners: {
      title: "الملاك",
      subtitle: "إدارة ملاك العقارات",
      addOwner: "إضافة مالك"
    },

    // Analytics
    analytics: {
      title: "التحليلات",
      subtitle: "رؤى الأعمال والتقارير",
      top5ProfitableLofts: "أفضل 5 لوفت مربحة",
      mostValuableAssets: "الأصول الأكثر قيمة"
    },

    // Transactions
    transactions: {
      title: "المعاملات",
      subtitle: "إدارة المعاملات المالية",
      referenceAmounts: "المبالغ المرجعية",
      addNewTransaction: "إضافة معاملة جديدة",
      totalIncome: "إجمالي الدخل",
      totalExpenses: "إجمالي المصروفات",
      netIncome: "صافي الدخل",
      startDate: "تاريخ البداية",
      endDate: "تاريخ النهاية",
      type: "النوع",
      allTypes: "جميع الأنواع",
      category: "الفئة",
      allCategories: "جميع الفئات",
      loft: "اللوفت",
      allLofts: "جميع اللوفتات",
      currency: "العملة",
      allCurrencies: "جميع العملات",
      paymentMethod: "طريقة الدفع",
      allPaymentMethods: "جميع طرق الدفع",
      noTransactions: "لا توجد معاملات",
      amount: "المبلغ",
      equivalent: "المكافئ",
      ratio: "النسبة",
      deleteConfirmTitle: "حذف المعاملة",
      deleteConfirmDescription: "لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف المعاملة نهائياً.",
      continue: "متابعة",
      income: "الدخل",
      expense: "المصروفات",
      optional: "اختياري"
    }
  }
}

export default translations