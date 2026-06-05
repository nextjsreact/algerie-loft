import { IntlErrorCode } from 'next-intl';

export default {
  onError(error: any) {
    if (error.code === IntlErrorCode.MISSING_MESSAGE) {
      // Ne pas lancer d'erreur pour les messages manquants
      // En développement, on peut logger
      if (process.env.NODE_ENV === 'development') {
        console.warn('Missing translation:', error.message);
      }
    } else {
      console.error(error);
    }
  },
  getMessageFallback({ namespace, key }: { namespace?: string; key: string }) {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    // Retourner la clé sans le préfixe "notifications." si présent
    return fullKey.replace('notifications.', '');
  }
};
