import { Suspense } from 'react';
import { requireSuperuser } from '@/lib/superuser/auth';
import { SuperuserDashboard } from '@/components/admin/superuser/superuser-dashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export default async function SuperuserPage() {
  // Verify superuser access
  await requireSuperuser();
  
  const t = await getTranslations('superuser');

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t('dashboard.welcome')}
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <SuperuserDashboard />
      </Suspense>
    </div>
  );
}