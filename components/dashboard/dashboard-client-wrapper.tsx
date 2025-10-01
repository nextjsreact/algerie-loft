"use client"

import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import { MemberDashboard } from "./member-dashboard"
import { ModernDashboard } from "./modern-dashboard"
import type { AuthSession } from "@/lib/types"

export function DashboardClientWrapper() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSession() {
      try {
        const sessionData = await getSession()
        setSession(sessionData)
      } catch (error) {
        console.error('Failed to fetch session:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Please log in to access the dashboard.</div>
      </div>
    )
  }

  // Route to appropriate dashboard based on user role
  if (session.user.role === 'member') {
    return (
      <div className="p-4 md:p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenue, {session.user.full_name || session.user.email || 'Utilisateur'}
            </h1>
            <p className="text-gray-600">
              Tableau de bord membre - Rôle: {session.user.role}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Mes Tâches</h3>
              <p className="text-gray-600">Gérez vos tâches assignées</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Appartements</h3>
              <p className="text-gray-600">Consultez les appartements</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Notifications</h3>
              <p className="text-gray-600">Vos dernières notifications</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // For executive role - redirect to dedicated executive dashboard
  if (session.user.role === 'executive') {
    // Use window.location for client-side redirect to executive page
    if (typeof window !== 'undefined') {
      window.location.href = `/${session.user.role === 'executive' ? 'executive' : 'dashboard'}`
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting to executive dashboard...</div>
      </div>
    )
  }

  // For admin, manager roles - use the existing ModernDashboard
  return <ModernDashboard />
}