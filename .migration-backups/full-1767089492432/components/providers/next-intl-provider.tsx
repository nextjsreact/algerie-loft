"use client"

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

interface NextIntlProviderProps {
  children: ReactNode;
  locale: string;
  messages: any;
}

/**
 * Provider next-intl pour les composants migrés
 * Utilisé temporairement pendant la migration progressive
 */
export function NextIntlProvider({ children, locale, messages }: NextIntlProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}