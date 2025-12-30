import { getRequestConfig } from 'next-intl/server';

// Locales supportées
export const locales = ['fr', 'ar', 'en'] as const;
export type Locale = (typeof locales)[number];

// Helper function to flatten nested message objects (not used - preserving nested structure)
// const flattenMessages = (nestedMessages: any, prefix = '') => {
//   return Object.keys(nestedMessages).reduce((messages: Record<string, string>, key) => {
//     const value = nestedMessages[key];
//     const prefixedKey = prefix ? `${prefix}.${key}` : key;

//     if (typeof value === 'string') {
//       messages[prefixedKey] = value;
//     } else {
//       Object.assign(messages, flattenMessages(value, prefixedKey));
//     }

//     return messages;
//   }, {});
// };

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that the incoming locale is valid
  if (!locale || !locales.includes(locale as any)) {
    locale = 'fr'; // Default fallback
  }

  // Charger tous les messages directement sans les aplatir pour préserver la structure des namespaces
  const messages = (await import(`@/messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    // Configuration timezone pour éviter ENVIRONMENT_FALLBACK
    timeZone: 'Europe/Paris',
    getTimeZone: () => 'Europe/Paris',
    now: new Date(),
    // Configuration des formats par défaut optimisée
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        },
        medium: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric'
        },
        full: {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          timeZoneName: 'short'
        }
      },
      number: {
        currency: {
          style: 'currency',
          currency: locale === 'fr' ? 'EUR' : 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        },
        percent: {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        },
        decimal: {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }
      },
      list: {
        enumeration: {
          style: 'long',
          type: 'conjunction'
        }
      }
    },
    // Configuration des messages d'erreur par défaut
    defaultTranslationValues: {
      important: (chunks: any) => `<strong>${chunks}</strong>`,
      em: (chunks: any) => `<em>${chunks}</em>`,
      code: (chunks: any) => `<code>${chunks}</code>`
    }
  };
});