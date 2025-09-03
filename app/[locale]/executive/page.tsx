import { requireAuth } from "@/lib/auth"
import { getExecutiveMetrics } from "@/lib/services/executive-dashboard"
import { ExecutiveWrapper } from "@/components/executive/executive-wrapper"
import { redirect } from "next/navigation"

export default async function ExecutivePage() {
  const session = await requireAuth()
  
  // Vérifier que l'utilisateur a le rôle executive
  if (session.user.role !== 'executive') {
    redirect('/dashboard')
  }

  try {
    const metrics = await getExecutiveMetrics(session.user.id)
    
    return (
      <ExecutiveWrapper metrics={metrics} />
    )
  } catch (error) {
    console.error('Erreur lors du chargement des métriques executive:', error)
    
    return (
      <ExecutiveWrapper error={true} />
    )
  }
}