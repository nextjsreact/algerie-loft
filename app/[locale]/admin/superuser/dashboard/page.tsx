import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations('superuser.dashboard')
  
  return {
    title: t('title'),
    description: t('welcome')
  }
}

export default async function SuperuserDashboardPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations('superuser.dashboard')
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-2 text-xs text-gray-500">
        DEBUG: Locale = {params.locale} | Title = {t('title')}
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          🎉 {t('title')}
        </h1>
        <p className="text-gray-600 mt-2">
          {t('welcome')}
        </p>
      </div>

      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
        <strong>✅</strong> {t('successMessage')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">👥 {t('cards.userManagement.title')}</h3>
          <p className="text-gray-600">{t('cards.userManagement.description')}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">🔒 {t('cards.security.title')}</h3>
          <p className="text-gray-600">{t('cards.security.description')}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">📊 {t('cards.audit.title')}</h3>
          <p className="text-gray-600">{t('cards.audit.description')}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">🔧 {t('cards.maintenance.title')}</h3>
          <p className="text-gray-600">{t('cards.maintenance.description')}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">💾 {t('cards.backup.title')}</h3>
          <p className="text-gray-600">{t('cards.backup.description')}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">⚙️ {t('cards.configuration.title')}</h3>
          <p className="text-gray-600">{t('cards.configuration.description')}</p>
        </div>
      </div>
    </div>
  )
}