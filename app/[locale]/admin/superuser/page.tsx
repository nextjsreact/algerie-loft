import { Suspense } from 'react';
import { requireSuperuser } from '@/lib/superuser/auth';
import { SuperuserDashboard } from '@/components/admin/superuser/superuser-dashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default async function SuperuserPage() {
  // Verify superuser access
  await requireSuperuser();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Administration Superuser
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Tableau de bord d'administration système avec accès complet
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <SuperuserDashboard />
      </Suspense>
    </div>
  );
}