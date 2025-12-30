import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof import('../../public/locales/fr/common.json');
      lofts: typeof import('../../public/locales/fr/lofts.json');
      reservations: typeof import('../../public/locales/fr/reservations.json');
      auth: typeof import('../../public/locales/fr/auth.json');
      landing: typeof import('../../public/locales/fr/landing.json');
      nav: typeof import('../../public/locales/fr/nav.json') & { executive: string };
      conversations: typeof import('../../public/locales/fr/conversations.json');
      notifications: typeof import('../../public/locales/fr/notifications.json');
      roles: typeof import('../../public/locales/fr/roles.json') & { executive: string };
      executive: typeof import('../../public/locales/fr/executive.json');
    };
  }
}