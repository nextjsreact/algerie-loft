const fs = require('fs');
const path = require('path');

// Configuration
const locales = ['en', 'fr', 'ar'];
const baseDir = path.join(__dirname, '../public/locales');

// Fonction pour ajouter les clés manquantes à un fichier existant
function addMissingKeys(filePath, newKeys) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(newKeys, null, 2), 'utf8');
    console.log(`✅ Created: ${filePath}`);
    return;
  }

  try {
    const existingContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const updatedContent = { ...existingContent, ...newKeys };
    fs.writeFileSync(filePath, JSON.stringify(updatedContent, null, 2), 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Toutes les clés manquantes identifiées par namespace
const allMissingKeys = {
  auth: {
    admin: "Admin",
    demoAccounts: "Demo Accounts",
    email: "Email",
    enterEmail: "Enter your email",
    enterFullName: "Enter your full name",
    enterPassword: "Enter your password",
    forgotPassword: "Forgot password?",
    fullName: "Full Name",
    haveAccount: "Already have an account?",
    manager: "Manager",
    member: "Member",
    noAccount: "Don't have an account?",
    password: "Password",
    registrationFailed: "Registration failed. Please try again.",
    signIn: "Sign In",
    signInDescription: "Sign in to your account",
    signingIn: "Signing in...",
    signingUp: "Signing up...",
    signOut: "Sign Out",
    signUp: "Sign Up",
    signUpDescription: "Create a new account",
    signUpTitle: "Sign Up",
    unexpectedError: "An unexpected error occurred. Please try again.",
    welcomeBack: "Welcome back"
  },
  bills: {
    dayOverdue: "day overdue",
    days: "days",
    daysOverdue: "days overdue",
    due: "Due",
    dueToday: "Due today",
    dueTomorrow: "Due tomorrow",
    failedToLoadAlerts: "Failed to load bill alerts.",
    markPaid: "Mark as paid",
    noOverdueBills: "No overdue bills. Everything is up to date!",
    noUpcomingBills: "No upcoming bills at the moment. Relax!",
    overdueBills: "Overdue Bills",
    upcomingBills: "Upcoming Bills"
  },
  dashboard: {
    actionRequired: "Action Required",
    active: "Active",
    activeTasks: "Active Tasks",
    activeTeams: "Active Teams",
    allBillsCurrent: "All bills are current!",
    allCaughtUp: "All caught up!",
    attentionNeeded: "Attention Needed",
    billMonitoring: "Bill Monitoring",
    billsDueNow: "Bills Due Now",
    billsPastDue: "Bills Past Due",
    completed: "Completed",
    due: "Due",
    dueToday: "Due Today",
    errorLoadingData: "Error loading data.",
    errorLoadingYour: "Error loading your data. Please try again.",
    expenses: "Expenses",
    inProgress: "In Progress",
    latestTaskUpdates: "Latest Task Updates",
    loftsWithBills: "Lofts with upcoming or overdue bills",
    monthlyFinancialOverview: "Monthly Financial Overview",
    monthlyRevenue: "Monthly Revenue",
    myProfile: "My Profile",
    myRecentTasks: "My Recent Tasks",
    needHelp: "Need help?",
    next30Days: "Next 30 Days",
    noTasksAssigned: "No tasks assigned to you at the moment.",
    noTasksYet: "No tasks yet. Enjoy the break!",
    noUrgentTasks: "No urgent tasks at the moment.",
    occupiedLofts: "Occupied Lofts",
    overdue: "Overdue",
    pendingTasks: "Pending Tasks",
    quickActions: "Quick Actions",
    recentTasks: "Recent Tasks",
    revenue: "Revenue",
    revenueVsExpenses: "Revenue vs Expenses",
    someDataError: "An error occurred loading some data.",
    subtitle: "Overview of your loft activity",
    systemStatus: "System Status",
    teams: "Teams",
    thisMonth: "This Month",
    title: "Dashboard",
    toDo: "To Do",
    totalLofts: "Total Lofts",
    unableToLoadData: "Unable to load data.",
    unableToLoadTasks: "Unable to load tasks.",
    upcoming: "Upcoming",
    updated: "Updated",
    urgentTasks: "Urgent Tasks",
    viewAllMyTasks: "View All My Tasks",
    viewMyTasks: "View My Tasks",
    welcomeBack: "Welcome back"
  },
  executive: {
    accessDenied: "Access Denied",
    accessDeniedDesc: "You don't have the necessary permissions to access this page. Please contact your administrator.",
    activeAlerts: "Active Alerts",
    averagePrice: "Average Price",
    cashFlow: "Cash Flow",
    companyRevenue: "Company Revenue",
    companyShare: "Company Share",
    confidential: "Confidential",
    criticalAlerts: "Critical Alerts",
    executiveLevelRequired: "Executive Level Required",
    executiveOnly: "Executive Access Only",
    expenses: "Expenses",
    financialTrends: "Financial Trends",
    financialTrendsDesc: "Visualize revenue and expense trends over time.",
    growth: "Growth",
    maintenanceCosts: "Maintenance Costs",
    margin: "Margin",
    monthlyCashFlow: "Monthly Cash Flow",
    netProfit: "Net Profit",
    occupancyRate: "Occupancy Rate",
    onTotalRevenue: "on total revenue",
    profit: "Profit",
    realEstatePortfolio: "Real Estate Portfolio",
    revenue: "Revenue",
    revenueDistribution: "Revenue Distribution",
    revenueDistributionDesc: "Understand where your revenue comes from.",
    secured: "Secured",
    security: "Security",
    subtitle: "Overview of overall company performance",
    systemStatus: "System Status",
    thirdPartyRevenue: "Third Party Revenue",
    title: "Executive Dashboard",
    totalLofts: "Total Lofts",
    totalRevenue: "Total Revenue",
    trend: "Trend",
    vsLastMonth: "vs last month",
    yearOverYearDesc: "Compare current year performance with previous year.",
    yearOverYearPerformance: "Year over Year Performance"
  },
  notifications: {
    newMessageFrom: "New message from {sender}",
    view: "View",
    viewMembers: "View Members"
  },
  paymentMethods: {
    addPaymentMethod: "Add Payment Method",
    cancel: "Cancel",
    createNewPaymentMethod: "Create new payment method",
    createPaymentMethod: "Create Payment Method",
    details: "Details",
    editPaymentMethod: "Edit Payment Method",
    enterPaymentInfo: "Enter payment information",
    name: "Name",
    paymentDetails: "Payment Details",
    saving: "Saving...",
    type: "Type",
    updatePaymentMethod: "Update Payment Method",
    updatePaymentMethodInfo: "Update payment method information"
  },
  reports: {
    customRange: "Custom Range",
    dateRange: "Date Range",
    downloadReports: "Download Reports",
    endDate: "End Date",
    export: "Export",
    exporting: "Exporting...",
    exportReports: "Export Reports",
    format: "Format",
    startDate: "Start Date",
    thisMonth: "This Month",
    thisQuarter: "This Quarter",
    thisWeek: "This Week",
    thisYear: "This Year"
  },
  reservations: {
    activities: {
      bookingCancelled: "Booking cancelled",
      checkinCompleted: "Check-in completed",
      hourAgo: "hour ago",
      hoursAgo: "hours ago",
      minAgo: "min ago",
      newReservation: "New reservation"
    },
    analytics: {
      guestSatisfaction: "Guest Satisfaction",
      monthlyRevenue: "Monthly Revenue",
      occupancyRate: "Occupancy Rate",
      title: "Reservation Analytics",
      totalReservations: "Total Reservations",
      vsLastMonth: "vs last month"
    },
    availability: {
      blockDates: "Block Dates",
      chooseLoft: "Choose Loft",
      endDate: "End Date",
      maintenance: "Maintenance",
      management: "Management",
      minimumStay: "Minimum Stay",
      other: "Other",
      personalUse: "Personal Use",
      priceOverride: "Price Override",
      priceOverridePlaceholder: "Enter price override",
      reasonForBlocking: "Reason for Blocking",
      renovation: "Renovation",
      selectLoft: "Select Loft",
      selectReason: "Select Reason",
      startDate: "Start Date",
      unblockDates: "Unblock Dates"
    },
    availabilityManagement: "Availability Management",
    calendar: {
      agenda: "Agenda",
      allDay: "All Day",
      day: "Day",
      event: "Event",
      month: "Month",
      noEventsInRange: "No events in range.",
      showMore: "Show more",
      title: "Reservation Calendar",
      tomorrow: "Tomorrow",
      week: "Week",
      work_week: "Work Week",
      yesterday: "Yesterday"
    },
    create: "Create",
    description: "Description",
    details: {
      dates: "Dates",
      guest: "Guest",
      loft: "Loft",
      specialRequests: "Special Requests",
      title: "Reservation Details",
      total: "Total"
    },
    form: {
      available: "Available",
      basePrice: "Base Price",
      checkIn: "Check In",
      checkOut: "Check Out",
      checkingAvailability: "Checking availability...",
      cleaningFee: "Cleaning Fee",
      createReservation: "Create Reservation",
      creating: "Creating...",
      guest: "Guest",
      guestCount: "Guest Count",
      guestEmail: "Guest Email",
      guestInfo: "Guest Information",
      guestName: "Guest Name",
      guestNationality: "Guest Nationality",
      guestPhone: "Guest Phone",
      guests: "Guests",
      loft: "Loft",
      notAvailable: "Not Available",
      selectLoft: "Select Loft",
      serviceFee: "Service Fee",
      specialRequests: "Special Requests",
      specialRequestsPlaceholder: "Enter special requests...",
      taxes: "Taxes",
      title: "Reservation Form",
      total: "Total"
    },
    list: {
      title: "Reservations List"
    },
    liveView: "Live View",
    manageGuests: "Manage Guests",
    newReservation: "New Reservation",
    nights: "Nights",
    proTools: "Pro Tools",
    quickActions: "Quick Actions",
    recentActivity: "Recent Activity",
    status: {
      cancelled: "Cancelled",
      completed: "Completed",
      confirmed: "Confirmed",
      pending: "Pending"
    },
    tabs: {
      analytics: "Analytics",
      calendar: "Calendar",
      list: "List"
    },
    title: "Reservations",
    upcoming: {
      empty: "No upcoming reservations.",
      title: "Upcoming Reservations"
    },
    viewReports: "View Reports"
  },
  settings: {
    accountDeletion: "Account Deletion",
    accountDeletionDesc: "Permanently delete your account and all associated data.",
    categories: {
      addNew: "Add New",
      allCategories: "All Categories",
      categoryCreated: "Category created successfully!",
      "2": "2 categories",
      categoryDetails: "Category Details",
      categoryName: "Category Name",
      categoryType: "Category Type",
      categoryUpdated: "Category updated successfully!",
      createCategory: "Create Category",
      createNewCategory: "Create New Category",
      deleteConfirm: "Are you sure you want to delete this category?",
      description: "Description",
      descriptionPlaceholder: "Enter description (optional)",
      editCategory: "Edit Category",
      enterCategoryInfo: "Enter category information",
      expenseCategories: "Expense Categories",
      incomeCategories: "Income Categories",
      manageCategoriesExpense: "Manage Expense Categories",
      manageCategoriesIncome: "Manage Income Categories",
      namePlaceholder: "Enter category name",
      noExpenseCategories: "No expense categories found.",
      noIncomeCategories: "No income categories found.",
      saveChanges: "Save Changes",
      selectType: "Select Type",
      subtitle: "Manage your expense and income categories.",
      totalCategories_one: "1 category",
      totalCategories_many: "{count} categories",
      totalCategories_other: "{count} categories",
      updateCategoryInfo: "Update category information"
    },
    changePassword: "Change Password",
    configureNotifications: "Configure Notifications",
    confirmPassword: "Confirm new password",
    currencies: {
      addFirstCurrency: "Add your first currency",
      addNew: "Add New",
      allCurrencies: "All Currencies",
      default: "Default",
      defaultCurrency: "Default Currency",
      defaultCurrencyDesc: "Set the default currency for your application.",
      noCurrenciesFound: "No currencies found.",
      setAsDefault: "Set as Default",
      subtitle: "Manage currencies supported by your application.",
      totalCurrencies_one: "1 currency",
      totalCurrencies_many: "{count} currencies",
      totalCurrencies_other: "{count} currencies"
    },
    currentPassword: "Current password",
    dataExport: "Data Export",
    dataExportDesc: "Export all your data for backup or use elsewhere.",
    dataPrivacy: "Data Privacy",
    deleteAccount: "Delete Account",
    dueDateReminders: "Due Date Reminders",
    dueDateRemindersDesc: "Receive notifications for upcoming bills and tasks.",
    email: "Email",
    enable: "Enable",
    exportData: "Export Data",
    financialReports: "Financial Reports",
    financialReportsDesc: "Generate detailed reports on your finances.",
    fullName: "Full Name",
    integrations: {
      airbnbDescription: "Connect your Airbnb account to sync listings and reservations.",
      airbnbTitle: "Airbnb Integration",
      connectToAirbnb: "Connect to Airbnb",
      subtitle: "Connect third-party services to extend functionality.",
      title: "Integrations"
    },
    manageAccountSecurity: "Manage your account security.",
    manageDataPrivacy: "Manage your data privacy settings.",
    managePaymentMethods: "Manage your payment methods for transactions.",
    managePaymentMethodsBtn: "Manage Payment Methods",
    newPassword: "New password",
    notifications: "Notifications",
    paymentMethods: "Payment Methods",
    "paymentMethods.addFirstMethod": "Add your first payment method",
    "paymentMethods.additionalDetails": "Additional Details",
    "paymentMethods.addPaymentMethod": "Add Payment Method",
    "paymentMethods.createdOn": "Created On",
    "paymentMethods.existingMethods": "Existing Methods",
    "paymentMethods.noMethodsFound": "No payment methods found.",
    "paymentMethods.subtitle": "Manage payment methods used in the application.",
    "paymentMethods.totalMethods_one": "1 method",
    "paymentMethods.totalMethods_many": "{count} methods",
    "paymentMethods.totalMethods_other": "{count} methods",
    profileInfo: "Profile Information",
    role: "Role",
    security: "Security",
    subtitle: "Manage your application and account settings.",
    taskAssignments: "Task Assignments",
    taskAssignmentsDesc: "Receive notifications when tasks are assigned to you or updated.",
    title: "Settings",
    updatePersonalInfo: "Update personal information",
    updateProfile: "Update Profile",
    zoneAreas: {
      addFirstZoneArea: "Add your first geographic zone",
      addNew: "Add New",
      createNewZoneArea: "Create new geographic zone",
      existingZoneAreas: "Existing Geographic Zones",
      noZoneAreasFound: "No geographic zones found.",
      refreshError: "Error refreshing geographic zones.",
      totalZoneAreas: "Total Geographic Zones",
      updateZoneAreaInfo: "Update geographic zone information"
    }
  },
  tasks: {
    addTask: "Add Task",
    assignedTo: "Assigned to",
    assignTo: "Assign To",
    cancel: "Cancel",
    createError: "Error creating task.",
    createSuccess: "Task created successfully!",
    createTask: "Create Task",
    dueDateFormat: "Due Date (MM/DD/YYYY)",
    editTask: "Edit Task",
    fillTaskInformation: "Fill task information",
    filters: {
      allStatuses: "All Statuses",
      endDate: "End Date",
      filterByStatus: "Filter by Status",
      startDate: "Start Date"
    },
    form: {
      addNewTask: "Add New Task",
      createNewTask: "Create New Task",
      editTask: "Edit Task",
      updateStatusDescription: "Update task status and description.",
      updateTaskInfo: "Update task information",
      updateTaskStatus: "Update task status"
    },
    memberCanOnlyUpdateStatus: "Members can only update status and description of tasks.",
    noDueDate: "No due date",
    noTasks: "No tasks found.",
    saving: "Saving...",
    status: {
      completed: "Completed",
      inProgress: "In Progress",
      todo: "To Do"
    },
    subtitle: "Manage your assigned tasks and track their progress.",
    taskDescription: "Task Description",
    taskDetails: "Task Details",
    taskDueDate: "Task Due Date",
    taskStatus: "Task Status",
    taskTitle: "Task Title",
    title: "Tasks",
    updateError: "Error updating task.",
    updateStatus: "Update Status",
    updateSuccess: "Task updated successfully!",
    updateTask: "Update Task",
    viewTask: "View Task",
    yourTasks: "Your Tasks"
  },
  teams: {
    activeTasks: "Active Tasks",
    addNewTeam: "Add New Team",
    addTeam: "Add Team",
    cancel: "Cancel",
    createdBy: "Created by",
    createTeam: "Create Team",
    description: "Description",
    editTeam: "Edit Team",
    enterTeamInfo: "Enter team information",
    saving: "Saving...",
    subtitle: "Manage your teams and their members.",
    teamDetails: "Team Details",
    teamName: "Team Name",
    title: "Teams",
    updateTeam: "Update Team",
    updateTeamInfo: "Update team information"
  },
  unauthorized: {
    accessDenied: "Access Denied",
    backToDashboard: "Back to Dashboard",
    noPermission: "No Permission"
  }
};

// Fonction principale
function fixAllMissingTranslations() {
  console.log('🔧 Fixing all missing translations...');

  // Créer/Corriger les fichiers pour chaque locale
  locales.forEach(locale => {
    console.log(`\n📝 Processing locale: ${locale}`);
    
    // Créer/Corriger les fichiers de namespace
    Object.keys(allMissingKeys).forEach(namespace => {
      const filePath = path.join(baseDir, locale, `${namespace}.json`);
      const keys = allMissingKeys[namespace];
      
      addMissingKeys(filePath, keys);
    });
  });

  console.log('\n✅ All missing translations fixed!');
}

// Exécuter le script
fixAllMissingTranslations();

