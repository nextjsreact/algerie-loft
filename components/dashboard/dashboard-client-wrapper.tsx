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
        <MemberDashboard
          userTasks={[]} // Will be fetched by the component
          userName={session.user.full_name || session.user.email || 'User'}
          userRole={session.user.role}
          userId={session.user.id}
          showSecurityInfo={false} // Message can be dismissed by user
        />
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