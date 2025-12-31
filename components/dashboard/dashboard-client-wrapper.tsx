"use client"

import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import { MemberDashboard } from "./member-dashboard"
import SimpleDashboard from "./dashboard-simple"
import { AdminManagementDashboard } from "../admin/admin-management-dashboard"
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

  // For executive role - show executive-specific dashboard
  if (session.user.role === 'executive') {
    return (
      <div className="p-4 md:p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de Bord Exécutif
            </h1>
            <p className="text-gray-600">
              Bienvenue, {session.user.full_name || session.user.email || 'Executive'}
            </p>
            <p className="text-sm text-purple-600 font-medium">
              Rôle: Executive - Vue Stratégique
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
              <h3 className="text-lg font-semibold mb-2">📊 Rapports Exécutifs</h3>
              <p className="text-blue-100">Vue d'ensemble stratégique et KPIs</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow text-white">
              <h3 className="text-lg font-semibold mb-2">🏢 Supervision Appartements</h3>
              <p className="text-green-100">Consultation des propriétés</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg shadow text-white">
              <h3 className="text-lg font-semibold mb-2">📈 Performance Globale</h3>
              <p className="text-purple-100">Indicateurs de performance</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <p className="text-yellow-800 font-medium">
                Accès Executive - Vue consultation et supervision uniquement
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // For admin, manager roles - show both modern dashboard and admin management
  if (session.user.role === 'admin' || session.user.role === 'manager') {
    return (
      <div className="space-y-8">
        <SimpleDashboard />
        <div className="border-t pt-8">
          <AdminManagementDashboard />
        </div>
      </div>
    )
  }

  // For other employee roles - use the existing SimpleDashboard
  return <SimpleDashboard />
}