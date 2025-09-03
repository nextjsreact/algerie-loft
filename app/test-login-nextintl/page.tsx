import { LoginPageClientNextIntl } from "@/components/auth/login-page-client-nextintl"
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'

/**
 * Page de test pour valider la migration du composant Login vers next-intl
 * URL: /test-login-nextintl
 */
export default async function TestLoginNextIntlPage() {
  // Charger les messages pour la locale par défaut (français)
  let messages;
  try {
    messages = (await import(`../../messages/fr.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <NextIntlClientProvider locale="fr" messages={messages}>
      <LoginPageClientNextIntl />
    </NextIntlClientProvider>
  )
}