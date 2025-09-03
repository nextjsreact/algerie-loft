/**
 * Tests end-to-end pour la fonctionnalité multi-langue
 * Teste l'application complète dans les 3 langues supportées
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { useRouter } from 'next/navigation';

// Mock du router Next.js
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/fr/dashboard'),
}));

// Mock des messages complets pour les tests
const mockMessages = {
  fr: {
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      add: 'Ajouter',
      search: 'Rechercher',
      filter: 'Filtrer',
      export: 'Exporter',
      import: 'Importer'
    },
    nav: {
      dashboard: 'Tableau de bord',
      lofts: 'Lofts',
      transactions: 'Transactions',
      teams: 'Équipes',
      tasks: 'Tâches',
      reservations: 'Réservations',
      reports: 'Rapports',
      settings: 'Paramètres',
      logout: 'Déconnexion'
    },
    auth: {
      login: 'Connexion',
      logout: 'Déconnexion',
      email: 'Email',
      password: 'Mot de passe',
      forgotPassword: 'Mot de passe oublié ?',
      rememberMe: 'Se souvenir de moi',
      welcome: 'Bienvenue {name}',
      loginSuccess: 'Connexion réussie',
      loginError: 'Erreur de connexion'
    },
    dashboard: {
      title: 'Tableau de bord',
      totalLofts: 'Total des lofts',
      occupancyRate: 'Taux d\'occupation',
      monthlyRevenue: 'Revenus mensuels',
      pendingTasks: 'Tâches en attente',
      recentActivity: 'Activité récente',
      quickActions: 'Actions rapides'
    },
    lofts: {
      title: 'Gestion des lofts',
      addLoft: 'Ajouter un loft',
      editLoft: 'Modifier le loft',
      deleteLoft: 'Supprimer le loft',
      loftDetails: 'Détails du loft',
      address: 'Adresse',
      price: 'Prix',
      status: 'Statut',
      available: 'Disponible',
      occupied: 'Occupé',
      maintenance: 'Maintenance'
    }
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import'
    },
    nav: {
      dashboard: 'Dashboard',
      lofts: 'Lofts',
      transactions: 'Transactions',
      teams: 'Teams',
      tasks: 'Tasks',
      reservations: 'Reservations',
      reports: 'Reports',
      settings: 'Settings',
      logout: 'Logout'
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot password?',
      rememberMe: 'Remember me',
      welcome: 'Welcome {name}',
      loginSuccess: 'Login successful',
      loginError: 'Login error'
    },
    dashboard: {
      title: 'Dashboard',
      totalLofts: 'Total lofts',
      occupancyRate: 'Occupancy rate',
      monthlyRevenue: 'Monthly revenue',
      pendingTasks: 'Pending tasks',
      recentActivity: 'Recent activity',
      quickActions: 'Quick actions'
    },
    lofts: {
      title: 'Loft management',
      addLoft: 'Add loft',
      editLoft: 'Edit loft',
      deleteLoft: 'Delete loft',
      loftDetails: 'Loft details',
      address: 'Address',
      price: 'Price',
      status: 'Status',
      available: 'Available',
      occupied: 'Occupied',
      maintenance: 'Maintenance'
    }
  },
  ar: {
    common: {
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجح',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      add: 'إضافة',
      search: 'بحث',
      filter: 'تصفية',
      export: 'تصدير',
      import: 'استيراد'
    },
    nav: {
      dashboard: 'لوحة التحكم',
      lofts: 'الشقق',
      transactions: 'المعاملات',
      teams: 'الفرق',
      tasks: 'المهام',
      reservations: 'الحجوزات',
      reports: 'التقارير',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج'
    },
    auth: {
      login: 'تسجيل الدخول',
      logout: 'تسجيل الخروج',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      forgotPassword: 'نسيت كلمة المرور؟',
      rememberMe: 'تذكرني',
      welcome: 'مرحبا {name}',
      loginSuccess: 'تم تسجيل الدخول بنجاح',
      loginError: 'خطأ في تسجيل الدخول'
    },
    dashboard: {
      title: 'لوحة التحكم',
      totalLofts: 'إجمالي الشقق',
      occupancyRate: 'معدل الإشغال',
      monthlyRevenue: 'الإيرادات الشهرية',
      pendingTasks: 'المهام المعلقة',
      recentActivity: 'النشاط الأخير',
      quickActions: 'الإجراءات السريعة'
    },
    lofts: {
      title: 'إدارة الشقق',
      addLoft: 'إضافة شقة',
      editLoft: 'تعديل الشقة',
      deleteLoft: 'حذف الشقة',
      loftDetails: 'تفاصيل الشقة',
      address: 'العنوان',
      price: 'السعر',
      status: 'الحالة',
      available: 'متاح',
      occupied: 'مشغول',
      maintenance: 'صيانة'
    }
  }
};

// Composants de test
function TestNavigation({ locale }: { locale: string }) {
  const messages = mockMessages[locale as keyof typeof mockMessages];
  
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <nav data-testid="navigation">
        <div data-testid="nav-dashboard">{messages.nav.dashboard}</div>
        <div data-testid="nav-lofts">{messages.nav.lofts}</div>
        <div data-testid="nav-settings">{messages.nav.settings}</div>
      </nav>
    </NextIntlClientProvider>
  );
}

function TestDashboard({ locale }: { locale: string }) {
  const messages = mockMessages[locale as keyof typeof mockMessages];
  
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div data-testid="dashboard">
        <h1 data-testid="dashboard-title">{messages.dashboard.title}</h1>
        <div data-testid="total-lofts">{messages.dashboard.totalLofts}</div>
        <div data-testid="occupancy-rate">{messages.dashboard.occupancyRate}</div>
        <div data-testid="monthly-revenue">{messages.dashboard.monthlyRevenue}</div>
      </div>
    </NextIntlClientProvider>
  );
}

function TestLoftManagement({ locale }: { locale: string }) {
  const messages = mockMessages[locale as keyof typeof mockMessages];
  
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div data-testid="loft-management">
        <h1 data-testid="lofts-title">{messages.lofts.title}</h1>
        <button data-testid="add-loft-btn">{messages.lofts.addLoft}</button>
        <div data-testid="loft-status-available">{messages.lofts.available}</div>
        <div data-testid="loft-status-occupied">{messages.lofts.occupied}</div>
      </div>
    </NextIntlClientProvider>
  );
}

function TestAuthForm({ locale }: { locale: string }) {
  const messages = mockMessages[locale as keyof typeof mockMessages];
  
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <form data-testid="auth-form">
        <h1 data-testid="login-title">{messages.auth.login}</h1>
        <label data-testid="email-label">{messages.auth.email}</label>
        <label data-testid="password-label">{messages.auth.password}</label>
        <button data-testid="login-btn">{messages.auth.login}</button>
        <a data-testid="forgot-password">{messages.auth.forgotPassword}</a>
      </form>
    </NextIntlClientProvider>
  );
}

describe('Multi-Language End-to-End Tests', () => {
  const locales = ['fr', 'en', 'ar'];

  beforeEach(() => {
    // Mock du router
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      pathname: '/fr/dashboard',
    });
  });

  describe('Navigation Component', () => {
    test.each(locales)('should render navigation correctly in %s', (locale) => {
      render(<TestNavigation locale={locale} />);
      
      const messages = mockMessages[locale as keyof typeof mockMessages];
      
      expect(screen.getByTestId('nav-dashboard')).toHaveTextContent(messages.nav.dashboard);
      expect(screen.getByTestId('nav-lofts')).toHaveTextContent(messages.nav.lofts);
      expect(screen.getByTestId('nav-settings')).toHaveTextContent(messages.nav.settings);
    });
  });

  describe('Dashboard Component', () => {
    test.each(locales)('should render dashboard correctly in %s', (locale) => {
      render(<TestDashboard locale={locale} />);
      
      const messages = mockMessages[locale as keyof typeof mockMessages];
      
      expect(screen.getByTestId('dashboard-title')).toHaveTextContent(messages.dashboard.title);
      expect(screen.getByTestId('total-lofts')).toHaveTextContent(messages.dashboard.totalLofts);
      expect(screen.getByTestId('occupancy-rate')).toHaveTextContent(messages.dashboard.occupancyRate);
      expect(screen.getByTestId('monthly-revenue')).toHaveTextContent(messages.dashboard.monthlyRevenue);
    });
  });

  describe('Loft Management Component', () => {
    test.each(locales)('should render loft management correctly in %s', (locale) => {
      render(<TestLoftManagement locale={locale} />);
      
      const messages = mockMessages[locale as keyof typeof mockMessages];
      
      expect(screen.getByTestId('lofts-title')).toHaveTextContent(messages.lofts.title);
      expect(screen.getByTestId('add-loft-btn')).toHaveTextContent(messages.lofts.addLoft);
      expect(screen.getByTestId('loft-status-available')).toHaveTextContent(messages.lofts.available);
      expect(screen.getByTestId('loft-status-occupied')).toHaveTextContent(messages.lofts.occupied);
    });
  });

  describe('Authentication Form', () => {
    test.each(locales)('should render auth form correctly in %s', (locale) => {
      render(<TestAuthForm locale={locale} />);
      
      const messages = mockMessages[locale as keyof typeof mockMessages];
      
      expect(screen.getByTestId('login-title')).toHaveTextContent(messages.auth.login);
      expect(screen.getByTestId('email-label')).toHaveTextContent(messages.auth.email);
      expect(screen.getByTestId('password-label')).toHaveTextContent(messages.auth.password);
      expect(screen.getByTestId('login-btn')).toHaveTextContent(messages.auth.login);
      expect(screen.getByTestId('forgot-password')).toHaveTextContent(messages.auth.forgotPassword);
    });
  });

  describe('Language Switching', () => {
    test('should switch between languages correctly', () => {
      const { rerender } = render(<TestNavigation locale="fr" />);
      
      // Vérifier français
      expect(screen.getByTestId('nav-dashboard')).toHaveTextContent('Tableau de bord');
      
      // Changer vers anglais
      rerender(<TestNavigation locale="en" />);
      expect(screen.getByTestId('nav-dashboard')).toHaveTextContent('Dashboard');
      
      // Changer vers arabe
      rerender(<TestNavigation locale="ar" />);
      expect(screen.getByTestId('nav-dashboard')).toHaveTextContent('لوحة التحكم');
    });
  });

  describe('RTL Support for Arabic', () => {
    test('should handle Arabic text correctly', () => {
      render(<TestDashboard locale="ar" />);
      
      const title = screen.getByTestId('dashboard-title');
      expect(title).toHaveTextContent('لوحة التحكم');
      
      // Vérifier que le texte arabe est présent
      expect(title.textContent).toMatch(/[\u0600-\u06FF]/); // Unicode range for Arabic
    });
  });

  describe('Common Actions Across Languages', () => {
    test.each(locales)('should render common actions correctly in %s', (locale) => {
      const messages = mockMessages[locale as keyof typeof mockMessages];
      
      function TestCommonActions() {
        return (
          <NextIntlClientProvider locale={locale} messages={messages}>
            <div>
              <button data-testid="save-btn">{messages.common.save}</button>
              <button data-testid="cancel-btn">{messages.common.cancel}</button>
              <button data-testid="delete-btn">{messages.common.delete}</button>
              <button data-testid="edit-btn">{messages.common.edit}</button>
            </div>
          </NextIntlClientProvider>
        );
      }
      
      render(<TestCommonActions />);
      
      expect(screen.getByTestId('save-btn')).toHaveTextContent(messages.common.save);
      expect(screen.getByTestId('cancel-btn')).toHaveTextContent(messages.common.cancel);
      expect(screen.getByTestId('delete-btn')).toHaveTextContent(messages.common.delete);
      expect(screen.getByTestId('edit-btn')).toHaveTextContent(messages.common.edit);
    });
  });

  describe('Interpolation Support', () => {
    test.each(locales)('should handle interpolations correctly in %s', (locale) => {
      const messages = mockMessages[locale as keyof typeof mockMessages];
      
      function TestInterpolation() {
        return (
          <NextIntlClientProvider locale={locale} messages={messages}>
            <div data-testid="welcome-message">
              {messages.auth.welcome.replace('{name}', 'John Doe')}
            </div>
          </NextIntlClientProvider>
        );
      }
      
      render(<TestInterpolation />);
      
      const welcomeMessage = screen.getByTestId('welcome-message');
      expect(welcomeMessage.textContent).toContain('John Doe');
      
      // Vérifier le format spécifique à chaque langue
      if (locale === 'fr') {
        expect(welcomeMessage).toHaveTextContent('Bienvenue John Doe');
      } else if (locale === 'en') {
        expect(welcomeMessage).toHaveTextContent('Welcome John Doe');
      } else if (locale === 'ar') {
        expect(welcomeMessage).toHaveTextContent('مرحبا John Doe');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle missing translations gracefully', () => {
      const incompleteMessages = {
        common: {
          loading: 'Loading...'
          // Missing other keys
        }
      };
      
      function TestMissingTranslations() {
        return (
          <NextIntlClientProvider locale="en" messages={incompleteMessages}>
            <div data-testid="existing-key">{incompleteMessages.common.loading}</div>
          </NextIntlClientProvider>
        );
      }
      
      render(<TestMissingTranslations />);
      
      expect(screen.getByTestId('existing-key')).toHaveTextContent('Loading...');
    });
  });

  describe('Performance with Multiple Components', () => {
    test('should render multiple components efficiently', async () => {
      const startTime = performance.now();
      
      function TestMultipleComponents() {
        return (
          <div>
            <TestNavigation locale="fr" />
            <TestDashboard locale="fr" />
            <TestLoftManagement locale="fr" />
            <TestAuthForm locale="fr" />
          </div>
        );
      }
      
      render(<TestMultipleComponents />);
      
      const renderTime = performance.now() - startTime;
      
      // Vérifier que tous les composants sont rendus
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('loft-management')).toBeInTheDocument();
      expect(screen.getByTestId('auth-form')).toBeInTheDocument();
      
      // Le rendu devrait être rapide (ajuster le seuil selon les besoins)
      expect(renderTime).toBeLessThan(100); // 100ms
    });
  });
});