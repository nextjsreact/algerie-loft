import { useState, useEffect } from 'react'

type Language = 'ar' | 'fr' | 'en'

interface Translations {
  [key: string]: {
    ar: string
    fr: string
    en: string
  }
}

const translations: Translations = {
  // Auth translations
  'auth.welcomeBack': {
    ar: 'مرحباً بعودتك',
    fr: 'Bon retour',
    en: 'Welcome back'
  },
  'auth.signInDescription': {
    ar: 'قم بتسجيل الدخول إلى حسابك',
    fr: 'Connectez-vous à votre compte',
    en: 'Sign in to your account'
  },
  'auth.email': {
    ar: 'البريد الإلكتروني',
    fr: 'Email',
    en: 'Email'
  },
  'auth.password': {
    ar: 'كلمة المرور',
    fr: 'Mot de passe',
    en: 'Password'
  },
  'auth.enterEmail': {
    ar: 'أدخل بريدك الإلكتروني',
    fr: 'Entrez votre email',
    en: 'Enter your email'
  },
  'auth.enterPassword': {
    ar: 'أدخل كلمة المرور',
    fr: 'Entrez votre mot de passe',
    en: 'Enter your password'
  },
  'auth.forgotPassword': {
    ar: 'نسيت كلمة المرور؟',
    fr: 'Mot de passe oublié ?',
    en: 'Forgot password?'
  },
  'auth.signIn': {
    ar: 'تسجيل الدخول',
    fr: 'Se connecter',
    en: 'Sign In'
  },
  'auth.signingIn': {
    ar: 'جاري تسجيل الدخول...',
    fr: 'Connexion...',
    en: 'Signing in...'
  },
  'auth.noAccount': {
    ar: 'ليس لديك حساب؟',
    fr: 'Vous n\'avez pas de compte ?',
    en: 'Don\'t have an account?'
  },
  'auth.signUp': {
    ar: 'إنشاء حساب',
    fr: 'S\'inscrire',
    en: 'Sign Up'
  },
  'auth.demoAccounts': {
    ar: 'حسابات تجريبية',
    fr: 'Comptes de démonstration',
    en: 'Demo Accounts'
  },
  'auth.admin': {
    ar: 'مدير',
    fr: 'Admin',
    en: 'Admin'
  },
  'auth.manager': {
    ar: 'مدير',
    fr: 'Manager',
    en: 'Manager'
  },
  'auth.member': {
    ar: 'عضو',
    fr: 'Membre',
    en: 'Member'
  },

  // Landing translations
  'landing.title': {
    ar: 'لوفت الجزائر',
    fr: 'Loft Algérie',
    en: 'Loft Algeria'
  },
  'landing.subtitle': {
    ar: 'منصة إدارة العقارات المهنية',
    fr: 'Plateforme de gestion immobilière professionnelle',
    en: 'Professional Property Management Platform'
  },
  'landing.description': {
    ar: 'قم بتبسيط إدارة عقاراتك مع منصتنا الشاملة للوft والحجوزات والتتبع المالي.',
    fr: 'Simplifiez la gestion de vos propriétés avec notre plateforme complète pour les lofts, réservations et suivi financier.',
    en: 'Simplify your property management with our comprehensive platform for lofts, reservations and financial tracking.'
  },
  'landing.getStarted': {
    ar: 'ابدأ الآن',
    fr: 'Commencer',
    en: 'Get Started'
  },
  'landing.signIn': {
    ar: 'تسجيل الدخول',
    fr: 'Se connecter',
    en: 'Sign In'
  },
  'landing.features.title': {
    ar: 'الميزات الأساسية',
    fr: 'Fonctionnalités principales',
    en: 'Key Features'
  },
  'landing.features.property.title': {
    ar: 'إدارة مركزية للعقارات',
    fr: 'Gestion centralisée des propriétés',
    en: 'Centralized Property Management'
  },
  'landing.features.property.description': {
    ar: 'أشرف على جميع ممتلكاتك بسهولة من لوحة تحكم واحدة وبديهية.',
    fr: 'Supervisez toutes vos propriétés facilement depuis un tableau de bord unique et intuitif.',
    en: 'Oversee all your properties easily from a single, intuitive dashboard.'
  },
  'landing.features.financial.title': {
    ar: 'تتبع مالي متعمق',
    fr: 'Suivi financier approfondi',
    en: 'In-depth Financial Tracking'
  },
  'landing.features.financial.description': {
    ar: 'راقب تدفقات إيراداتك ونفقاتك من خلال تقاريرنا المالية وتحليلاتنا المفصلة.',
    fr: 'Surveillez vos flux de revenus et dépenses grâce à nos rapports financiers et analyses détaillées.',
    en: 'Monitor your revenue and expense flows through our detailed financial reports and analytics.'
  },
  'landing.features.tasks.title': {
    ar: 'إدارة مهام تعاونية',
    fr: 'Gestion collaborative des tâches',
    en: 'Collaborative Task Management'
  },
  'landing.features.tasks.description': {
    ar: 'قم بتعيين وتتبع وإدارة المهام عبر فريقك لضمان سلاسة العمليات.',
    fr: 'Assignez, suivez et gérez les tâches à travers votre équipe pour assurer des opérations fluides.',
    en: 'Assign, track and manage tasks across your team to ensure smooth operations.'
  },
  'landing.features.notifications.title': {
    ar: 'إشعارات فورية',
    fr: 'Notifications instantanées',
    en: 'Instant Notifications'
  },
  'landing.features.notifications.description': {
    ar: 'استقبل تنبيهات في الوقت الفعلي للحجوزات الجديدة ورسائل الضيوف وتحديثات العقارات الهامة.',
    fr: 'Recevez des alertes en temps réel pour les nouvelles réservations, messages d\'invités et mises à jour importantes des propriétés.',
    en: 'Receive real-time alerts for new bookings, guest messages and important property updates.'
  }
}

export function useSimpleTranslation() {
  const [language, setLanguage] = useState<Language>('ar')

  useEffect(() => {
    // Get language from localStorage or browser
    const savedLang = localStorage.getItem('language') as Language
    if (savedLang && ['ar', 'fr', 'en'].includes(savedLang)) {
      setLanguage(savedLang)
    } else {
      // Default to Arabic
      setLanguage('ar')
    }
  }, [])

  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    return translations[key]?.[language] || key
  }

  return {
    language,
    changeLanguage,
    t
  }
}