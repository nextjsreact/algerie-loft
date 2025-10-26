import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'

export default async function PartnerPage() {
  // Ensure user is authenticated and has partner role
  await requireRole(['partner'])
  
  // Redirect to dashboard
  redirect('/partner/dashboard')
}