"use client"

import { useState, useEffect, useCallback } from 'react'

type ConnectedUser = {
  id: string
  email: string | null
  full_name: string | null
  role: string
  is_online: boolean
  last_active_at: string | null
}

export default function ConnectedUsers() {
  const [users, setUsers] = useState<ConnectedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/superuser/online')
      if (!res.ok) return
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    const interval = setInterval(fetchUsers, 10_000)
    return () => clearInterval(interval)
  }, [fetchUsers])

  const handleDisconnect = async (userId: string) => {
    setDisconnecting(userId)
    try {
      await fetch(`/api/superuser/online/${userId}/disconnect`, { method: 'POST' })
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch {
      // ignore
    } finally {
      setDisconnecting(null)
    }
  }

  const timeSince = (dateStr: string | null) => {
    if (!dateStr) return 'jamais'
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (seconds < 60) return `il y a ${seconds}s`
    if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)}min`
    return `il y a ${Math.floor(seconds / 3600)}h`
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Utilisateurs connectés</h3>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          {users.length} en ligne
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-sm text-gray-400">
          Chargement...
        </div>
      ) : users.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-gray-400">
          Aucun utilisateur connecté
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="truncate font-medium text-gray-800">
                    {user.full_name || user.email || 'Inconnu'}
                  </span>
                </div>
                <div className="mt-0.5 flex gap-3 text-xs text-gray-400">
                  <span>{user.role}</span>
                  <span>{timeSince(user.last_active_at)}</span>
                </div>
              </div>
              <button
                onClick={() => handleDisconnect(user.id)}
                disabled={disconnecting === user.id}
                className="ml-2 shrink-0 rounded px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {disconnecting === user.id ? '...' : 'Déconnecter'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
