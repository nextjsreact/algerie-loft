import { Metadata } from 'next';
import { MaintenanceToolsPanel } from '@/components/admin/superuser/maintenance-tools-panel';

export const metadata: Metadata = {
  title: 'Outils de Maintenance - Administration Superuser',
  description: 'Outils de maintenance et d\'optimisation du système',
};

export default function MaintenancePage() {
  return (
    <div className="container mx-auto py-6">
      <MaintenanceToolsPanel />
    </div>
  );
}