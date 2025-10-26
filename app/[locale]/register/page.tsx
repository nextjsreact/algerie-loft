import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { RegistrationFlow } from '@/components/auth/registration-flow'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth' })
  
  return {
    title: t('register.title'),
    description: t('register.description')
  }
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <RegistrationFlow />
      </div>
    </div>
  )
}