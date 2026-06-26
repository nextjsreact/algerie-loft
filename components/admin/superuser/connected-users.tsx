"use client"

import { useState, useEffect, useCallback } from 'react'

type SessionInfo = {
  session_id: string
  device_info: string | null
  ip_address: string | null
  last_seen: string
}

type ConnectedUser = {
  id: string
  email: string | null
  full_name: string | null
  role: string
  is_online: boolean
  last_active_at: string | null
  session_count: number
  sessions: SessionInfo[]
}

export default function ConnectedUsers() {
  const [users, setUsers] = useState<ConnectedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/superuser/online')
      if (!res.ok) return
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    const interval = setInterval(fetchUsers, 10_000)
    return () => clearInterval(interval)
  }, [fetchUsers])

  const handleDisconnect = async (userId: string, userName: string) => {
    setDisconnecting(userId)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/superuser/online/${userId}/disconnect`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(`Erreur: ${data.error || 'API ' + res.status}`)
        return
      }

      setSuccess(`${userName} déconnecté avec succès`)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setTimeout(() => setSuccess(null), 5000)
    } catch (e: any) {
      setError(`Erreur réseau: ${e.message}`)
    } finally {
      setDisconnecting(null)
    }
  }

  const handleDisconnectSession = async (userId: string, sessionId: string, userName: string) => {
    setDisconnecting(sessionId)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/superuser/online/${userId}/disconnect`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(`Erreur: ${data.error || 'API ' + res.status}`)
        return
      }

      setSuccess(`Session de ${userName} déconnectée`)
      fetchUsers()
      setTimeout(() => setSuccess(null), 5000)
    } catch (e: any) {
      setError(`Erreur réseau: ${e.message}`)
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

  const deviceIcon = (info: string | null) => {
    if (!info) return '💻'
    const lower = info.toLowerCase()
    if (lower.includes('mobile')) return '📱'
    if (lower.includes('tablette') || lower.includes('tablet') || lower.includes('ipad')) return '📱'
    return '💻'
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Utilisateurs connectés</h3>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          {users.length} en ligne
        </span>
      </div>

      {error && (
        <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

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
            <div key={user.id} className="rounded-md border border-gray-100">
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="truncate font-medium text-gray-800">
                      {user.full_name || user.email || 'Inconnu'}
                    </span>
                    {user.session_count > 1 && (
                      <button
                        onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 transition hover:bg-amber-200"
                        title={`${user.session_count} sessions actives — cliquer pour voir les détails`}
                      >
                        <span>{user.session_count} sessions</span>
                        <svg className={`h-3 w-3 transition-transform ${expandedUser === user.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    {user.session_count === 1 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        1 session
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex gap-3 text-xs text-gray-400">
                    <span>{user.role}</span>
                    <span>{timeSince(user.last_active_at)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(user.id, user.full_name || user.email || 'Inconnu')}
                  disabled={disconnecting === user.id}
                  className="ml-2 shrink-0 rounded px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {disconnecting === user.id ? '...' : 'Déconnecter'}
                </button>
              </div>

              {user.session_count > 1 && expandedUser === user.id && (
                <div className="border-t border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="mb-1.5 text-xs font-medium text-gray-500">Sessions actives :</p>
                  <div className="space-y-1.5">
                    {user.sessions.map((session) => (
                      <div
                        key={session.session_id}
                        className="flex items-center justify-between rounded bg-white px-2.5 py-1.5 text-xs shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span>{deviceIcon(session.device_info)}</span>
                          <span className="text-gray-700">{session.device_info || 'Inconnu'}</span>
                          {session.ip_address && (
                            <span className="text-gray-400">{session.ip_address}</span>
                          )}
                          <span className="text-gray-400">{timeSince(session.last_seen)}</span>
                        </div>
                        <button
                          onClick={() => handleDisconnectSession(
                            user.id,
                            session.session_id,
                            user.full_name || user.email || 'Inconnu'
                          )}
                          disabled={disconnecting === session.session_id}
                          className="shrink-0 rounded px-2 py-0.5 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {disconnecting === session.session_id ? '...' : '×'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
