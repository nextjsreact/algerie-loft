'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Shield, CheckCircle, XCircle, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    setSaving(userId + field)
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
      const userName = users.find(u => u.id === userId)?.full_name
      toast.success(newVal ? `✅ Permission accordée à ${userName}` : `❌ Permission retirée à ${userName}`)
    } catch (err: any) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: current } : u))
      toast.error(err.message || 'Erreur')
    }
    setSaving(null)
  }

  const Toggle = ({ userId, field, value }: { userId: string; field: 'can_validate_reservations' | 'can_view_reports'; value: boolean }) => (
    <div className="flex items-center gap-2">
      {value
        ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium w-24"><CheckCircle className="h-3.5 w-3.5" /> Autorisé</span>
        : <span className="flex items-center gap-1 text-xs text-gray-400 w-24"><XCircle className="h-3.5 w-3.5" /> Non autorisé</span>
      }
      <button
        onClick={() => togglePermission(userId, field, value)}
        disabled={saving === userId + field}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        } ${saving === userId + field ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="h-7 w-7 text-blue-600" />
        <h1 className="text-2xl font-bold">Gestion des permissions</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Gérez les droits d'accès des admins et managers. Le superuser a toujours tous les droits.
      </p>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
          <CardTitle className="text-base flex items-center gap-4">
            <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Valider réservations</span>
            <span className="flex items-center gap-2 ml-auto"><FileText className="h-4 w-4" /> Voir rapports</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Aucun admin ou manager trouvé</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex-wrap gap-3">
                  <div className="min-w-[180px]">
                    <p className="font-medium text-gray-900 dark:text-white">{user.full_name || '—'}</p>
                    <p className="text-xs text-gray-500">{user.email} · {user.role === 'admin' ? '👤 Admin' : '🔧 Manager'}</p>
                  </div>
                  <div className="flex items-center gap-8">
                    <Toggle userId={user.id} field="can_validate_reservations" value={user.can_validate_reservations} />
                    <Toggle userId={user.id} field="can_view_reports" value={user.can_view_reports} />
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
