"use client"

import { SimpleLoginFormNextIntl } from "@/components/auth/simple-login-form-nextintl"
import { useLocale } from "next-intl"

/**
 * Version next-intl du LoginPageClient
 * Remplace progressivement l'ancien système i18next
 */
export function LoginPageClientNextIntl() {
  const locale = useLocale();
  return <SimpleLoginFormNextIntl key={locale} />
}