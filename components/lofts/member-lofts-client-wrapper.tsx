"use client"

import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import { MemberLoftsView } from "./member-lofts-view"
import type { AuthSession } from "@/lib/types"

export function MemberLoftsClientWrapper() {
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
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Please log in to access lofts.</div>
      </div>
    )
  }

  return <MemberLoftsView session={session} />
}