import { Suspense } from 'react';
import { requireSuperuserPermissions } from '@/lib/superuser/auth';
import { AuditLogViewer } from '@/components/admin/superuser/audit-log-viewer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default async function SuperuserAuditPage() {
  // Verify superuser access with audit access permissions
  await requireSuperuserPermissions(['AUDIT_ACCESS']);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Journal d'Audit
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Surveillance et analyse des activités administratives et système
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <AuditLogViewer />
      </Suspense>
    </div>
  );
}