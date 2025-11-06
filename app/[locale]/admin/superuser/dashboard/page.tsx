import { Metadata } from 'next'
import { SuperuserDashboard } from '@/components/admin/superuser/superuser-dashboard'

export const metadata: Metadata = {
  title: 'Superuser Dashboard',
  description: 'Dashboard d\'administration superuser'
}

export default async function SuperuserDashboardPage() {
  return <SuperuserDashboard />
}