"use client"

import { useEffect, useState, useMemo } from "react"
import { getSession } from "@/lib/auth"
import { MemberDashboard } from "./member-dashboard"
import SimpleDashboard from "./dashboard-simple"
import { AdminManagementDashboard } from "../admin/admin-management-dashboard"
import { SmartDashboard } from "./smart-dashboard"
import type { AuthSession } from "@/lib/types"

// Separate components for each role to ensure stable hook usage
function MemberDashboardContent({ session }: { session: AuthSession }) {
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

function ExecutiveDashboardContent({ session }: { session: AuthSession }) {
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

function AdminManagerDashboardContent({ session }: { session: AuthSession }) {
  const [stats, setStats] = useState({
    totalLofts: 0,
    occupiedLofts: 0,
    activeTasks: 0,
    monthlyRevenue: 0,
    totalTeams: 0
  })
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const today = new Date()
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

        const [loftsRes, tasksRes, teamsRes, revenueRes] = await Promise.all([
          supabase.from('lofts').select('id, status'),
          supabase.from('tasks').select('id').in('status', ['todo', 'in_progress']),
          supabase.from('teams').select('id'),
          supabase.from('reservations')
            .select('total_amount')
            .gte('check_in_date', monthStart)
            .lte('check_in_date', monthEnd)
            .in('status', ['confirmed', 'completed', 'pending']),
        ])

        const lofts = loftsRes.data || []
        const occupied = lofts.filter((l: any) => l.status === 'occupied').length
        const revenue = (revenueRes.data || []).reduce((s: number, r: any) => s + (r.total_amount || 0), 0)

        setStats({
          totalLofts: lofts.length,
          occupiedLofts: occupied,
          activeTasks: (tasksRes.data || []).length,
          monthlyRevenue: Math.round(revenue),
          totalTeams: (teamsRes.data || []).length,
        })

        // Last 6 months revenue
        const months = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
          const start = d.toISOString().split('T')[0]
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
          const label = d.toLocaleDateString('fr-FR', { month: 'short' })
          const { data } = await supabase
            .from('reservations')
            .select('total_amount')
            .gte('check_in_date', start)
            .lte('check_in_date', end)
            .in('status', ['confirmed', 'completed', 'pending'])
          const rev = (data || []).reduce((s: number, r: any) => s + (r.total_amount || 0), 0)
          months.push({ month: label, revenue: Math.round(rev), expenses: 0 })
        }
        setMonthlyRevenue(months)
      } catch (e) {
        console.error('Dashboard stats error:', e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <SmartDashboard
      user={{
        id: session.user.id || 'unknown',
        role: session.user.role as any,
        name: session.user.full_name || session.user.email || 'User'
      }}
      data={{
        tasks: [],
        lofts: [],
        notifications: [],
        transactions: [],
        stats,
        recentTasks: [],
        monthlyRevenue,
      }}
      errors={[]}
      isLoading={isLoading}
    />
  )
}

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

  // Memoize the dashboard component selection to prevent re-renders
  const DashboardComponent = useMemo(() => {
    if (!session) return null

    const role = session.user.role

    switch (role) {
      case 'member':
        return () => <MemberDashboardContent session={session} />
      case 'executive':
        return () => <ExecutiveDashboardContent session={session} />
      case 'admin':
      case 'manager':
      case 'superuser':
        return () => <AdminManagerDashboardContent session={session} />
      default:
        return SimpleDashboard
    }
  }, [session])

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

  if (!DashboardComponent) {
    return <SimpleDashboard />
  }

  return <DashboardComponent />
}