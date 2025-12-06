import { requireRole } from '@/lib/auth';
import { PartnersManagement } from '@/components/admin/partners-management';

export default async function AdminPartnersPage() {
  // Seuls les admin, manager et superuser peuvent accéder
  const session = await requireRole(['admin', 'manager', 'superuser']);

  return (
    <div className="container mx-auto py-8 px-4">
      <PartnersManagement />
    </div>
  );
}
