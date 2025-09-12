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
      password: "Password",
      forgotPassword: "Forgot Password?",
      rememberMe: "Remember me",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      createAccount: "Create Account",
      signInToAccount: "Sign in to your account"
    },

    // Theme
    theme: {
      light: "Light",
      dark: "Dark",
      system: "System"
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
      reports: "Reports",
      notifications: "Notifications",
      settings: "Settings",
      categories: "Categories",
      currencies: "Currencies",
      zoneAreas: "Zone Areas",
      paymentMethods: "Payment Methods",
      internetConnections: "Internet Connections"
    },

    // Settings
    settings: {
      title: "Settings",
      subtitle: "Manage your application settings and preferences",
      categories: {
        subtitle: "Manage your transaction categories",
        addNew: "Add New Category",
        editCategory: "Edit Category",
        createCategory: "Create Category",
        updateCategoryInfo: "Update category information",
        createNewCategory: "Create a new transaction category",
        categoryDetails: "Category Details",
        enterCategoryInfo: "Enter the category information below",
        categoryName: "Category Name",
        categoryType: "Category Type",
        description: "Description",
        namePlaceholder: "Enter category name",
        descriptionPlaceholder: "Enter category description (optional)",
        selectType: "Select category type",
        saveChanges: "Save Changes",
        categoryCreated: "Category '{name}' created successfully",
        categoryUpdated: "Category '{name}' updated successfully",
        saveError: "Failed to save category - please try again",
        incomeCategories: "Income Categories",
        expenseCategories: "Expense Categories",
        manageCategoriesIncome: "Categories for income transactions",
        manageCategoriesExpense: "Categories for expense transactions",
        noIncomeCategories: "No income categories found",
        noExpenseCategories: "No expense categories found",
        allCategories: "All Categories",
        totalCategories: "Total: {count} categories",
        deleteConfirm: "Are you sure you want to delete this category?"
      },
      currencies: {
        subtitle: "Manage currencies for your transactions",
        addNew: "Add New Currency",
        defaultCurrency: "Default Currency",
        defaultCurrencyDesc: "This currency is used as the default for all transactions",
        default: "Default",
        allCurrencies: "All Currencies",
        totalCurrencies: "Total: {count} currencies",
        noCurrenciesFound: "No currencies found",
        addFirstCurrency: "Add your first currency to get started",
        setAsDefault: "Set as default"
      },
      paymentMethods: {
        subtitle: "Manage your payment methods",
        addPaymentMethod: "Add Payment Method",
        existingMethods: "Existing Payment Methods",
        totalMethods: "Total: {count} payment methods",
        noMethodsFound: "No payment methods found",
        addFirstMethod: "Add your first payment method to get started",
        additionalDetails: "Additional details available",
        createdOn: "Created"
      }
    },

    // Zone Areas
    zoneAreas: {
      title: "Zone Areas",
      subtitle: "Manage zone areas",
      name: "Name",
      actions: "Actions",
      existingZoneAreas: "Existing Zone Areas",
      noZoneAreasYet: "No zone areas yet",
      deleteConfirm: "Are you sure you want to delete this zone area?",
      deleteSuccess: "Zone area deleted successfully",
      deleteError: "Error deleting zone area",
      nameRequired: "Zone area name is required",
      updateSuccess: "Zone area updated successfully",
      createSuccess: "Zone area created successfully",
      editZoneArea: "Edit Zone Area",
      addNewZoneArea: "Add New Zone Area",
      updateZoneAreaInfo: "Update zone area information",
      createNewZoneArea: "Create a new zone area",
      zoneDetails: "Zone Details",
      enterZoneInfo: "Enter the zone information below",
      zoneAreaName: "Zone Area Name",
      namePlaceholder: "Enter zone area name",
      updateZoneArea: "Update Zone Area",
      createZoneArea: "Create Zone Area"
    },

    // Internet Connections
    internetConnections: {
      subtitle: "Manage internet connection types",
      addNewConnectionType: "Add New Connection Type",
      existingConnectionTypes: "Existing Connection Types",
      loadError: "Error loading internet connection types",
      totalConnections: "Total: {count} connection types",
      noConnectionTypesFound: "No internet connection types found",
      addFirstConnection: "Add your first connection type to get started",
      cost: "Cost",
      provider: "Provider"
    },

    // Lofts
    lofts: {
      title: "Lofts",
      subtitle: "Manage your loft properties",
      addLoft: "Add Loft",
      editLoft: "Edit Loft",
      viewLoft: "View Loft",
      deleteLoft: "Delete Loft",
      loftName: "Loft Name",
      loftAddress: "Address",
      owner: "Owner",
      description: "Description",
      loftDescription: "Loft Description",
      noLofts: "No lofts found",
      createLoft: "Create Loft",
      createNewLoft: "Create New Loft",
      addNewPropertyListing: "Add New Property Listing",
      updateLoft: "Update Loft",
      updating: "Updating...",
      creating: "Creating...",
      loftCreated: "Loft created successfully",
      loftUpdated: "Loft updated successfully",
      loftDeleted: "Loft deleted successfully",
      updatePropertyDetails: "Update property details and billing information",
      pricePerDay: "Price per Day (DA)",
      dailyRent: "Daily Rent",
      companyShare: "Company Share",
      companyPercentage: "Company Percentage",
      ownerPercentage: "Owner Percentage",
      total: "Total",
      shouldEqual100: "Should equal 100%",
      zoneArea: "Zone Area",
      internetConnection: "Internet Connection",
      utilityInformation: "Utility Information",
      waterCustomerCode: "Water Customer Code",
      waterContractCode: "Water Contract Code",
      waterMeterNumber: "Water Meter Number",
      electricityPdlRef: "Electricity PDL Ref",
      electricityCustomerNumber: "Electricity Customer Number",
      electricityMeterNumber: "Electricity Meter Number",
      gasPdlRef: "Gas PDL Ref",
      gasCustomerNumber: "Gas Customer Number",
      gasMeterNumber: "Gas Meter Number",
      phoneNumber: "Phone Number",
      billingAlerts: "Billing Alerts",
      billingAlertsDescription: "Configure frequencies and due dates for automatic bill tracking",
      loftInfoTitle: "Loft Information",
      loftInfoDescription: "Provide the main details of the loft, including its name, address, and rental price.",
      billingSections: {
        water: "Water Bills",
        energy: "Energy Bills", 
        phone: "Phone Bills",
        internet: "Internet Bills",
        tv: "TV Subscription",
        gas: "Gas Bills"
      },
      waterBillFrequency: "Water Bill Frequency",
      energyBillFrequency: "Energy Bill Frequency",
      phoneBillFrequency: "Phone Bill Frequency",
      internetBillFrequency: "Internet Bill Frequency",
      tvBillFrequency: "TV Subscription Frequency",
      selectFrequency: "Select Frequency",
      frequency: {
        weekly: "Weekly",
        monthly: "Monthly",
        bimonthly: "Bimonthly",
        quarterly: "Quarterly",
        fourMonthly: "Four Monthly",
        sixMonthly: "Six Monthly",
        yearly: "Yearly"
      }
    },

    // Transactions
    transactions: {
      type: "Type",
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
      signUp: "S'Inscrire",
      signOut: "Se Déconnecter",
      welcomeBack: "Bon Retour",
      signInDescription: "Connectez-vous à votre compte pour continuer",
      email: "Email",
      password: "Mot de passe",
      forgotPassword: "Mot de passe oublié ?",
      rememberMe: "Se souvenir de moi",
      noAccount: "Vous n'avez pas de compte ?",
      hasAccount: "Vous avez déjà un compte ?",
      createAccount: "Créer un Compte",
      signInToAccount: "Connectez-vous à votre compte"
    },

    // Theme
    theme: {
      light: "Clair",
      dark: "Sombre",
      system: "Système"
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
      reports: "Rapports",
      notifications: "Notifications",
      settings: "Paramètres",
      categories: "Catégories",
      currencies: "Devises",
      zoneAreas: "Zones Géographiques",
      paymentMethods: "Méthodes de Paiement",
      internetConnections: "Connexions Internet"
    },

    // Settings
    settings: {
      title: "Paramètres",
      subtitle: "Gérez vos paramètres d'application et préférences",
      categories: {
        subtitle: "Gérez vos catégories de transactions",
        addNew: "Ajouter une Nouvelle Catégorie",
        editCategory: "Modifier la Catégorie",
        createCategory: "Créer une Catégorie",
        updateCategoryInfo: "Mettre à jour les informations de la catégorie",
        createNewCategory: "Créer une nouvelle catégorie de transaction",
        categoryDetails: "Détails de la Catégorie",
        enterCategoryInfo: "Entrez les informations de la catégorie ci-dessous",
        categoryName: "Nom de la Catégorie",
        categoryType: "Type de Catégorie",
        description: "Description",
        namePlaceholder: "Entrez le nom de la catégorie",
        descriptionPlaceholder: "Entrez la description de la catégorie (optionnel)",
        selectType: "Sélectionnez le type de catégorie",
        saveChanges: "Enregistrer les Modifications",
        categoryCreated: "Catégorie '{name}' créée avec succès",
        categoryUpdated: "Catégorie '{name}' mise à jour avec succès",
        saveError: "Échec de l'enregistrement de la catégorie - veuillez réessayer",
        incomeCategories: "Catégories de Revenus",
        expenseCategories: "Catégories de Dépenses",
        manageCategoriesIncome: "Catégories pour les transactions de revenus",
        manageCategoriesExpense: "Catégories pour les transactions de dépenses",
        noIncomeCategories: "Aucune catégorie de revenus trouvée",
        noExpenseCategories: "Aucune catégorie de dépenses trouvée",
        allCategories: "Toutes les Catégories",
        totalCategories: "Total : {count} catégories",
        deleteConfirm: "Êtes-vous sûr de vouloir supprimer cette catégorie ?"
      },
      currencies: {
        subtitle: "Gérez les devises pour vos transactions",
        addNew: "Ajouter une Nouvelle Devise",
        defaultCurrency: "Devise par Défaut",
        defaultCurrencyDesc: "Cette devise est utilisée par défaut pour toutes les transactions",
        default: "Par défaut",
        allCurrencies: "Toutes les Devises",
        totalCurrencies: "Total : {count} devises",
        noCurrenciesFound: "Aucune devise trouvée",
        addFirstCurrency: "Ajoutez votre première devise pour commencer",
        setAsDefault: "Définir par défaut"
      },
      paymentMethods: {
        subtitle: "Gérez vos méthodes de paiement",
        addPaymentMethod: "Ajouter une Méthode de Paiement",
        existingMethods: "Méthodes de Paiement Existantes",
        totalMethods: "Total : {count} méthodes de paiement",
        noMethodsFound: "Aucune méthode de paiement trouvée",
        addFirstMethod: "Ajoutez votre première méthode de paiement pour commencer",
        additionalDetails: "Détails supplémentaires disponibles",
        createdOn: "Créé le"
      }
    },

    // Zone Areas
    zoneAreas: {
      title: "Zones Géographiques",
      subtitle: "Gérer les zones géographiques",
      name: "Nom",
      actions: "Actions",
      existingZoneAreas: "Zones Géographiques Existantes",
      noZoneAreasYet: "Aucune zone géographique pour le moment",
      deleteConfirm: "Êtes-vous sûr de vouloir supprimer cette zone géographique ?",
      deleteSuccess: "Zone géographique supprimée avec succès",
      deleteError: "Erreur lors de la suppression de la zone géographique",
      nameRequired: "Le nom de la zone géographique est requis",
      updateSuccess: "Zone géographique mise à jour avec succès",
      createSuccess: "Zone géographique créée avec succès",
      editZoneArea: "Modifier la Zone Géographique",
      addNewZoneArea: "Ajouter une Nouvelle Zone Géographique",
      updateZoneAreaInfo: "Mettre à jour les informations de la zone géographique",
      createNewZoneArea: "Créer une nouvelle zone géographique",
      zoneDetails: "Détails de la Zone",
      enterZoneInfo: "Entrez les informations de la zone ci-dessous",
      zoneAreaName: "Nom de la Zone Géographique",
      namePlaceholder: "Entrez le nom de la zone géographique",
      updateZoneArea: "Mettre à Jour la Zone Géographique",
      createZoneArea: "Créer la Zone Géographique"
    },

    // Internet Connections
    internetConnections: {
      subtitle: "Gérer les types de connexions internet",
      addNewConnectionType: "Ajouter un Nouveau Type de Connexion",
      existingConnectionTypes: "Types de Connexions Existants",
      loadError: "Erreur lors du chargement des types de connexion Internet",
      totalConnections: "Total : {count} types de connexion",
      noConnectionTypesFound: "Aucun type de connexion Internet trouvé",
      addFirstConnection: "Ajoutez votre premier type de connexion pour commencer",
      cost: "Coût",
      provider: "Fournisseur"
    },

    // Lofts
    lofts: {
      title: "Lofts",
      subtitle: "Gérez vos propriétés loft",
      addLoft: "Ajouter un Loft",
      editLoft: "Modifier le Loft",
      viewLoft: "Voir le Loft",
      deleteLoft: "Supprimer le Loft",
      loftName: "Nom du Loft",
      loftAddress: "Adresse du Loft",
      owner: "Propriétaire",
      description: "Description",
      loftDescription: "Description du Loft",
      noLofts: "Aucun loft trouvé",
      createLoft: "Créer un Loft",
      createNewLoft: "Créer un Nouveau Loft",
      addNewPropertyListing: "Ajouter une Nouvelle Propriété",
      updateLoft: "Mettre à Jour le Loft",
      updating: "Mise à jour...",
      creating: "Création...",
      loftCreated: "Loft créé avec succès",
      loftUpdated: "Loft mis à jour avec succès",
      loftDeleted: "Loft supprimé avec succès",
      updatePropertyDetails: "Mettre à jour les détails de la propriété et les informations de facturation",
      pricePerDay: "Prix par Jour (DA)",
      dailyRent: "Loyer Quotidien",
      companyShare: "Part de l'Entreprise",
      companyPercentage: "Pourcentage de l'Entreprise",
      ownerPercentage: "Pourcentage du Propriétaire",
      total: "Total",
      shouldEqual100: "Doit égaler 100%",
      zoneArea: "Zone",
      internetConnection: "Connexion Internet",
      utilityInformation: "Informations sur les Services",
      waterCustomerCode: "Code Client Eau",
      waterContractCode: "Code Contrat Eau",
      waterMeterNumber: "Numéro Compteur Eau",
      electricityPdlRef: "Référence PDL Électricité",
      electricityCustomerNumber: "Numéro Client Électricité",
      electricityMeterNumber: "Numéro Compteur Électricité",
      gasPdlRef: "Référence PDL Gaz",
      gasCustomerNumber: "Numéro Client Gaz",
      gasMeterNumber: "Numéro Compteur Gaz",
      phoneNumber: "Numéro de Téléphone",
      billingAlerts: "Alertes de Facturation",
      billingAlertsDescription: "Configurez les fréquences et dates d'échéance pour le suivi automatique des factures",
      loftInfoTitle: "Informations du Loft",
      loftInfoDescription: "Fournissez les détails principaux du loft, y compris son nom, son adresse et son prix de location.",
      billingSections: {
        water: "Factures d'Eau",
        energy: "Factures d'Énergie",
        phone: "Factures de Téléphone", 
        internet: "Factures Internet",
        tv: "Abonnement Chaînes TV",
        gas: "Factures de Gaz"
      },
      waterBillFrequency: "Fréquence Facture Eau",
      energyBillFrequency: "Fréquence Facture Énergie",
      phoneBillFrequency: "Fréquence Facture Téléphone",
      internetBillFrequency: "Fréquence Facture Internet",
      tvBillFrequency: "Fréquence Abonnement TV",
      selectFrequency: "Sélectionner la Fréquence",
      frequency: {
        weekly: "Hebdomadaire",
        monthly: "Mensuel",
        bimonthly: "Bimestriel",
        quarterly: "Trimestriel",
        fourMonthly: "Quatre Mois",
        sixMonthly: "Six Mois",
        yearly: "Annuel"
      }
    },

    // Transactions
    transactions: {
      type: "Type",
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
      pickDateRange: "اختر نطاق التواريخ",
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
      description: "قم بتبسيط إدارة عقاراتك مع منصتنا الشاملة للوفت والحجوزات والتتبع المالي."
    },

    // Authentication
    auth: {
      signIn: "تسجيل الدخول",
      signUp: "إنشاء حساب",
      signOut: "تسجيل الخروج",
      welcomeBack: "مرحباً بعودتك",
      signInDescription: "قم بتسجيل الدخول إلى حسابك للمتابعة",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      forgotPassword: "نسيت كلمة المرور؟",
      rememberMe: "تذكرني",
      noAccount: "ليس لديك حساب؟",
      hasAccount: "لديك حساب بالفعل؟",
      createAccount: "إنشاء حساب",
      signInToAccount: "قم بتسجيل الدخول إلى حسابك"
    },

    // Theme
    theme: {
      light: "فاتح",
      dark: "داكن",
      system: "النظام"
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
      reports: "التقارير",
      notifications: "الإشعارات",
      settings: "الإعدادات",
      categories: "الفئات",
      currencies: "العملات",
      zoneAreas: "المناطق",
      paymentMethods: "طرق الدفع",
      internetConnections: "اتصالات الإنترنت"
    },

    // Settings
    settings: {
      title: "الإعدادات",
      subtitle: "إدارة إعدادات التطبيق والتفضيلات",
      categories: {
        subtitle: "إدارة فئات المعاملات",
        addNew: "إضافة فئة جديدة",
        editCategory: "تعديل الفئة",
        createCategory: "إنشاء فئة",
        updateCategoryInfo: "تحديث معلومات الفئة",
        createNewCategory: "إنشاء فئة معاملات جديدة",
        categoryDetails: "تفاصيل الفئة",
        enterCategoryInfo: "أدخل معلومات الفئة أدناه",
        categoryName: "اسم الفئة",
        categoryType: "نوع الفئة",
        description: "الوصف",
        namePlaceholder: "أدخل اسم الفئة",
        descriptionPlaceholder: "أدخل وصف الفئة (اختياري)",
        selectType: "اختر نوع الفئة",
        saveChanges: "حفظ التغييرات",
        categoryCreated: "تم إنشاء الفئة '{name}' بنجاح",
        categoryUpdated: "تم تحديث الفئة '{name}' بنجاح",
        saveError: "فشل في حفظ الفئة - يرجى المحاولة مرة أخرى",
        incomeCategories: "فئات الدخل",
        expenseCategories: "فئات المصروفات",
        manageCategoriesIncome: "فئات معاملات الدخل",
        manageCategoriesExpense: "فئات معاملات المصروفات",
        noIncomeCategories: "لا توجد فئات دخل",
        noExpenseCategories: "لا توجد فئات مصروفات",
        allCategories: "جميع الفئات",
        totalCategories: "المجموع: {count} فئة",
        deleteConfirm: "هل أنت متأكد من أنك تريد حذف هذه الفئة؟"
      },
      currencies: {
        subtitle: "إدارة العملات للمعاملات",
        addNew: "إضافة عملة جديدة",
        defaultCurrency: "العملة الافتراضية",
        defaultCurrencyDesc: "هذه العملة تُستخدم كافتراضية لجميع المعاملات",
        default: "افتراضي",
        allCurrencies: "جميع العملات",
        totalCurrencies: "المجموع: {count} عملة",
        noCurrenciesFound: "لا توجد عملات",
        addFirstCurrency: "أضف عملتك الأولى للبدء",
        setAsDefault: "تعيين كافتراضي"
      },
      paymentMethods: {
        subtitle: "إدارة طرق الدفع",
        addPaymentMethod: "إضافة طريقة دفع",
        existingMethods: "طرق الدفع الموجودة",
        totalMethods: "المجموع: {count} طريقة دفع",
        noMethodsFound: "لا توجد طرق دفع",
        addFirstMethod: "أضف طريقة الدفع الأولى للبدء",
        additionalDetails: "تفاصيل إضافية متاحة",
        createdOn: "تم الإنشاء في"
      }
    },

    // Zone Areas
    zoneAreas: {
      title: "المناطق الجغرافية",
      subtitle: "إدارة المناطق الجغرافية",
      name: "الاسم",
      actions: "الإجراءات",
      existingZoneAreas: "المناطق الجغرافية الموجودة",
      noZoneAreasYet: "لا توجد مناطق جغرافية بعد",
      deleteConfirm: "هل أنت متأكد من أنك تريد حذف هذه المنطقة الجغرافية؟",
      deleteSuccess: "تم حذف المنطقة الجغرافية بنجاح",
      deleteError: "خطأ في حذف المنطقة الجغرافية",
      nameRequired: "اسم المنطقة الجغرافية مطلوب",
      updateSuccess: "تم تحديث المنطقة الجغرافية بنجاح",
      createSuccess: "تم إنشاء المنطقة الجغرافية بنجاح",
      editZoneArea: "تعديل المنطقة الجغرافية",
      addNewZoneArea: "إضافة منطقة جغرافية جديدة",
      updateZoneAreaInfo: "تحديث معلومات المنطقة الجغرافية",
      createNewZoneArea: "إنشاء منطقة جغرافية جديدة",
      zoneDetails: "تفاصيل المنطقة",
      enterZoneInfo: "أدخل معلومات المنطقة أدناه",
      zoneAreaName: "اسم المنطقة الجغرافية",
      namePlaceholder: "أدخل اسم المنطقة الجغرافية",
      updateZoneArea: "تحديث المنطقة الجغرافية",
      createZoneArea: "إنشاء المنطقة الجغرافية"
    },

    // Internet Connections
    internetConnections: {
      subtitle: "إدارة أنواع اتصالات الإنترنت",
      addNewConnectionType: "إضافة نوع اتصال جديد",
      existingConnectionTypes: "أنواع الاتصالات الموجودة",
      loadError: "خطأ في تحميل أنواع اتصالات الإنترنت",
      totalConnections: "المجموع: {count} نوع اتصال",
      noConnectionTypesFound: "لا توجد أنواع اتصالات إنترنت",
      addFirstConnection: "أضف نوع الاتصال الأول للبدء",
      cost: "التكلفة",
      provider: "المزود"
    },

    // Lofts
    lofts: {
      title: "اللوفت",
      subtitle: "إدارة عقارات اللوفت الخاصة بك",
      addLoft: "إضافة لوفت",
      editLoft: "تعديل اللوفت",
      viewLoft: "عرض اللوفت",
      deleteLoft: "حذف اللوفت",
      loftName: "اسم اللوفت",
      loftAddress: "عنوان اللوفت",
      owner: "المالك",
      description: "الوصف",
      loftDescription: "وصف اللوفت",
      noLofts: "لا توجد لوفت",
      createLoft: "إنشاء لوفت",
      createNewLoft: "إنشاء لوفت جديد",
      addNewPropertyListing: "إضافة عقار جديد",
      updateLoft: "تحديث اللوفت",
      updating: "جاري التحديث...",
      creating: "جاري الإنشاء...",
      loftCreated: "تم إنشاء اللوفت بنجاح",
      loftUpdated: "تم تحديث اللوفت بنجاح",
      loftDeleted: "تم حذف اللوفت بنجاح",
      updatePropertyDetails: "تحديث تفاصيل العقار ومعلومات الفواتير",
      pricePerDay: "السعر يومياً (دج)",
      dailyRent: "الإيجار اليومي",
      companyShare: "حصة الشركة",
      companyPercentage: "نسبة الشركة",
      ownerPercentage: "نسبة المالك",
      total: "المجموع",
      shouldEqual100: "يجب أن يساوي 100%",
      zoneArea: "المنطقة",
      internetConnection: "اتصال الإنترنت",
      utilityInformation: "معلومات المرافق",
      waterCustomerCode: "رمز عميل المياه",
      waterContractCode: "رمز عقد المياه",
      waterMeterNumber: "رقم عداد المياه",
      electricityPdlRef: "مرجع PDL الكهرباء",
      electricityCustomerNumber: "رقم عميل الكهرباء",
      electricityMeterNumber: "رقم عداد الكهرباء",
      gasPdlRef: "مرجع PDL الغاز",
      gasCustomerNumber: "رقم عميل الغاز",
      gasMeterNumber: "رقم عداد الغاز",
      phoneNumber: "رقم الهاتف",
      billingAlerts: "تنبيهات الفواتير",
      billingAlertsDescription: "قم بتكوين التكرارات وتواريخ الاستحقاق للمتابعة التلقائية للفواتير",
      loftInfoTitle: "معلومات اللوفت",
      loftInfoDescription: "قدم التفاصيل الرئيسية للوفت، بما في ذلك اسمه وعنوانه وسعر الإيجار.",
      billingSections: {
        water: "فواتير المياه",
        energy: "فواتير الطاقة",
        phone: "فواتير الهاتف",
        internet: "فواتير الإنترنت", 
        tv: "اشتراك التلفزيون",
        gas: "فواتير الغاز"
      },
      waterBillFrequency: "تكرار فاتورة المياه",
      energyBillFrequency: "تكرار فاتورة الطاقة",
      phoneBillFrequency: "تكرار فاتورة الهاتف",
      internetBillFrequency: "تكرار فاتورة الإنترنت",
      tvBillFrequency: "تكرار اشتراك التلفزيون",
      selectFrequency: "اختر التكرار",
      frequency: {
        weekly: "أسبوعي",
        monthly: "شهري",
        bimonthly: "كل شهرين",
        quarterly: "ربع سنوي",
        fourMonthly: "كل أربعة أشهر",
        sixMonthly: "كل ستة أشهر",
        yearly: "سنوي"
      }
    },

    // Transactions
    transactions: {
      type: "النوع",
      income: "الدخل",
      expense: "المصروفات",
      optional: "اختياري"
    }
  }
}

export default translations