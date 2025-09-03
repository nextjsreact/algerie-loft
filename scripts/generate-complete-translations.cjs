const fs = require('fs');

// Lire l'analyse des clés manquantes
const analysis = JSON.parse(fs.readFileSync('missing-translations-analysis.json', 'utf8'));
const missingKeys = analysis.missingKeys;

// Dictionnaire de traductions automatiques
const autoTranslations = {
  // Traductions communes
  en: {
    // Analytics
    'analytics.title': 'Analytics',
    'analytics.subtitle': 'Financial and Performance Analytics',
    'analytics.overview': 'Overview',
    'analytics.financial': 'Financial',
    'analytics.occupancy': 'Occupancy',
    'analytics.maintenance': 'Maintenance',
    'analytics.revenue': 'Revenue',
    'analytics.expenses': 'Expenses',
    'analytics.detailedFinancialPerformance': 'Detailed Financial Performance',
    'analytics.monthlyFinancialTrend': 'Monthly Financial Trend',
    'analytics.monthlyOccupancyRates': 'Monthly Occupancy Rates',
    'analytics.mostValuableAssets': 'Most Valuable Assets',
    'analytics.occupancyRateTrends': 'Occupancy Rate Trends',
    'analytics.revenueExpensesByLoft': 'Revenue & Expenses by Loft',
    'analytics.top5ProfitableLofts': 'Top 5 Profitable Lofts',
    'analytics.trackRevenueExpenses': 'Track Revenue & Expenses',

    // Auth
    'auth.admin': 'Admin',
    'auth.manager': 'Manager',
    'auth.member': 'Member',
    'auth.demoAccounts': 'Demo Accounts',
    'auth.enterEmail': 'Enter your email',
    'auth.enterFullName': 'Enter your full name',
    'auth.enterPassword': 'Enter your password',
    'auth.fullName': 'Full Name',
    'auth.haveAccount': 'Already have an account?',
    'auth.registrationFailed': 'Registration failed',
    'auth.signUpDescription': 'Create your account to get started',
    'auth.signUpTitle': 'Create Account',
    'auth.signingIn': 'Signing in...',
    'auth.signingUp': 'Creating account...',
    'auth.unexpectedError': 'An unexpected error occurred',

    // Bills
    'bills.due': 'Due',
    'bills.days': 'days',
    'bills.dayOverdue': 'day overdue',
    'bills.daysOverdue': 'days overdue',
    'bills.dueToday': 'Due Today',
    'bills.dueTomorrow': 'Due Tomorrow',
    'bills.failedToLoadAlerts': 'Failed to load bill alerts',
    'bills.markPaid': 'Mark as Paid',
    'bills.noOverdueBills': 'No overdue bills',
    'bills.noUpcomingBills': 'No upcoming bills',
    'bills.overdueBills': 'Overdue Bills',
    'bills.upcomingBills': 'Upcoming Bills',

    // Common
    'common.date': 'Date',
    'common.next': 'Next',
    'common.none': 'None',
    'common.pickDate': 'Pick a date',
    'common.pickDateRange': 'Pick date range',
    'common.previous': 'Previous',
    'common.selectOption': 'Select an option',
    'common.time': 'Time',
    'common.today': 'Today',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Overview of your property management',
    'dashboard.actionRequired': 'Action Required',
    'dashboard.active': 'Active',
    'dashboard.activeTasks': 'Active Tasks',
    'dashboard.activeTeams': 'Active Teams',
    'dashboard.allBillsCurrent': 'All bills are current',
    'dashboard.allCaughtUp': 'All caught up!',
    'dashboard.attentionNeeded': 'Attention Needed',
    'dashboard.billMonitoring': 'Bill Monitoring',
    'dashboard.billsDueNow': 'Bills Due Now',
    'dashboard.billsPastDue': 'Bills Past Due',
    'dashboard.completed': 'Completed',
    'dashboard.due': 'Due',
    'dashboard.dueToday': 'Due Today',
    'dashboard.errorLoadingData': 'Error loading data',
    'dashboard.er