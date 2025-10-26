import { requireRole } from '@/lib/auth'
import { PartnerVerificationManager } from '@/components/admin/partner-verification-manager'
import { getTranslations } from 'next-intl/server'

export default async function PartnersPage() {
  const session = await requireRole(["admin", "manager"])
  const t = await getTranslations('admin.partners')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950/20 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {t('description')}
          </p>
        </div>

        <PartnerVerificationManager />
      </div>
    </div>
  )
}