'use client'

import { useTranslations, useLocale } from 'next-intl'

export default function TestRoutingPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Routing - {locale}</h1>
      <p>Locale actuelle: {locale}</p>
      <p>Traduction test: {t('signIn')}</p>
      <div className="mt-4">
        <a href="/fr/login" className="text-blue-600 hover:underline mr-4">Login FR</a>
        <a href="/en/login" className="text-blue-600 hover:underline mr-4">Login EN</a>
        <a href="/ar/login" className="text-blue-600 hover:underline">Login AR</a>
      </div>
    </div>
  )
}