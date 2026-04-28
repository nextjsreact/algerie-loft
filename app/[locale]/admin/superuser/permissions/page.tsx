'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Shield, CheckCircle, XCircle, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  can_validate_reservations: boolean
  can_view_reports: boolean
}

export default function PermissionsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/superuser/users?role=admin&limit=100').then(r => r.json()),
      fetch('/api/superuser/users?role=manager&limit=100').then(r => r.json()),
    ]).then(([d1, d2]) => {
      setUsers([...(d1.users || []), ...(d2.users || [])])
    }).catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false))
  }, [])

  const togglePermission = async (userId: string, field: 'can_validate_reservations' | 'can_view_reports', current: boolean) => {
    const key = userId + field
    setSaving(key)
    const newVal = !current
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: newVal } : u))
    try {
      const res = await fetch(`/api/superuser/users/${userId}/staff`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newVal })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const name = users.find(u => u.id === userId)?.full_name
      toast.success(newVal ? `✅ Permission accordée à ${name}` : `❌ Permission retirée à ${name}`)
    } catch (err: any) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: current } : u))
      toast.error(err.message || 'Erreur')
    }
    setSaving(null)
  }

  const Toggle = ({ userId, field, value }: {
    userId: string
    field: 'can_validate_reservations' | 'can_view_reports'
    value: boolean
  }) => {
    const key = userId + field
    return (
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={() => togglePermission(userId, field, value)}
          disabled={saving === key}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value ? 'bg-blue-600' : 'bg-gray-300'
          } ${saving === key ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
        {value
          ? <span className="text-xs text-green-600 font-medium flex items-center gap-0.5"><CheckCircle className="h-3 w-3" /> Oui</span>
          : <span className="text-xs text-red-500 font-medium flex items-center gap-0.5"><XCircle className="h-3 w-3" /> Non</span>
        }
      </div>
    )
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Shield className="h-7 w-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des permissions</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
        Gérez les droits d'accès des admins et managers. Le superuser a toujours tous les droits.
      </p>

      <Card className="border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_140px_140px] bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-5 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            Utilisateur
          </div>
          <div className="px-3 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-blue-500" />
            Valider rés.
          </div>
          <div className="px-3 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-purple-500" />
            Voir rapports
          </div>
        </div>

        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Aucun admin ou manager trouvé</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map(user => (
                <div key={user.id} className="grid grid-cols-[1fr_140px_140px] items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* User info */}
                  <div className="px-5 py-4">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{user.full_name || '—'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      user.role === 'admin'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {user.role === 'admin' ? '👤 Admin' : '🔧 Manager'}
                    </span>
                  </div>

                  {/* Toggle: validate reservations */}
                  <div className="flex justify-center py-4">
                    <Toggle userId={user.id} field="can_validate_reservations" value={!!user.can_validate_reservations} />
                  </div>

                  {/* Toggle: view reports */}
                  <div className="flex justify-center py-4">
                    <Toggle userId={user.id} field="can_view_reports" value={!!user.can_view_reports} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-gray-400 mt-4 text-center">Les modifications sont effectives immédiatement.</p>
    </div>
  )
}
