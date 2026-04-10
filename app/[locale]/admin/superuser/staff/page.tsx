'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

const TEAMS = ['', 'nettoyage', 'accueil', 'maintenance', 'gestion']
const TEAM_LABELS: Record<string, string> = {
  '': '— Aucune —',
  nettoyage: '🧹 Nettoyage',
  accueil: '🤝 Accueil',
  maintenance: '🔧 Maintenance',
  gestion: '📋 Gestion',
}

export default function StaffManagementPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/superuser/users?role=member&limit=100')
      .then(r => r.json())
      .then(d => setMembers(d.users || []))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false))
  }, [])

  const update = async (id: string, field: string, value: any) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
    setSaving(id)
    try {
      const res = await fetch(`/api/superuser/users/${id}/staff`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_staff: field === 'is_staff' ? value : members.find(m => m.id === id)?.is_staff || false,
          team: field === 'team' ? (value || null) : members.find(m => m.id === id)?.team || null,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Sauvegardé')
    } catch (err: any) {
      toast.error(err.message || 'Erreur')
    }
    setSaving(null)
  }

  if (loading) return <div className="p-8 text-center">Chargement...</div>

  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Gestion du staff</h1>
      <p className="text-gray-500 text-sm mb-6">
        Cochez les vrais employés et assignez leur équipe. Seuls les membres cochés apparaissent dans le planning.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Nom</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Email</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">✅ Staff</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Équipe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {members.map(m => (
              <tr key={m.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${saving === m.id ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3 font-medium">{m.full_name || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{m.email}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={m.is_staff === true}
                    onChange={e => update(m.id, 'is_staff', e.target.checked)}
                    className="w-5 h-5 cursor-pointer accent-green-600"
                    disabled={saving === m.id}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={m.team || ''}
                    onChange={e => update(m.id, 'team', e.target.value)}
                    disabled={saving === m.id}
                    className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600"
                  >
                    {TEAMS.map(t => (
                      <option key={t} value={t}>{TEAM_LABELS[t]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && (
          <div className="text-center py-12 text-gray-400">Aucun membre trouvé</div>
        )}
      </div>
    </div>
  )
}
