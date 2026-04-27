'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Shield, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  can_validate_reservations: boolean
}

export default function PermissionsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/superuser/users?role=admin&limit=100')
      .then(r => r.json())
      .then(d => {
        // Also fetch managers
        return fetch('/api/superuser/users?role=manager&limit=100')
          .then(r2 => r2.json())
          .then(d2 => {
            const all = [...(d.users || []), ...(d2.users || [])]
            setUsers(all)
          })
      })
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false))
  }, [])

  const togglePermission = async (userId: string, current: boolean) => {
    setSaving(userId)
    const newVal = !current
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, can_validate_reservations: newVal } : u))
    try {
      const res = await fetch(`/api/superuser/users/${userId}/staff`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ can_validate_reservations: newVal })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(newVal
        ? `✅ Permission accordée à ${users.find(u => u.id === userId)?.full_name}`
        : `❌ Permission retirée à ${users.find(u => u.id === userId)?.full_name}`
      )
    } catch (err: any) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, can_validate_reservations: current } : u))
      toast.error(err.message || 'Erreur')
    }
    setSaving(null)
  }

  const roleLabel = (role: string) => role === 'admin' ? '👤 Admin' : '🔧 Manager'

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="h-7 w-7 text-blue-600" />
        <h1 className="text-2xl font-bold">Permissions de validation</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Activez ou désactivez le droit de <strong>confirmer / annuler</strong> des réservations pour chaque admin et manager.
        Le superuser a toujours ce droit sans restriction.
      </p>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5" />
            Peut valider les réservations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Aucun admin ou manager trouvé</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{user.full_name || '—'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email} · {roleLabel(user.role)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.can_validate_reservations
                      ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle className="h-4 w-4" /> Autorisé</span>
                      : <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle className="h-4 w-4" /> Non autorisé</span>
                    }
                    <button
                      onClick={() => togglePermission(user.id, user.can_validate_reservations)}
                      disabled={saving === user.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        user.can_validate_reservations ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      } ${saving === user.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        user.can_validate_reservations ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Les modifications sont effectives immédiatement.
      </p>
    </div>
  )
}
