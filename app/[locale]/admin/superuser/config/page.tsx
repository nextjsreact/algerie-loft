import { Metadata } from 'next'
import { SystemConfigurationPanel } from '@/components/admin/superuser/system-configuration-panel'

export const metadata: Metadata = {
  title: 'Configuration Système - Superuser',
  description: 'Gestion des paramètres et configurations système'
}

export default async function ConfigPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <SystemConfigurationPanel />
    </div>
  )
}