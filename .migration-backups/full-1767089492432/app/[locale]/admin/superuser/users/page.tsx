import { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { UserManagementInterface } from '@/components/admin/superuser/user-management-interface'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'superuser.userManagement' })
  
  return {
    title: `${t('title')} - Superuser`,
    description: t('description')
  }
}

export default async function UsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'superuser.userManagement' })
  
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t('title')}
        </h1>
        <p className="text-gray-600 mt-2">
          {t('description')}
        </p>
      </div>

      <UserManagementInterface />
    </div>
  )
}