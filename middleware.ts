import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

// Créer le middleware next-intl avec une configuration simplifiée
const intlMiddleware = createMiddleware({
  locales: locales,
  defaultLocale: 'fr',
  localePrefix: 'always',
  localeDetection: true,
});

export default intlMiddleware;

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};