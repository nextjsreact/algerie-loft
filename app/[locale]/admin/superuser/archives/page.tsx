import { Metadata } from 'next'
import { ArchiveManager } from '@/components/admin/superuser/archive-manager'

export const metadata: Metadata = {
  title: 'Archives - Superuser',
  description: 'Gestion des données archivées et politiques d\'archivage'
}

export default async function ArchivesPage() {
  return <ArchiveManager />;
}
