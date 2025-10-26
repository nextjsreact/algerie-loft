'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  full_name: string
  email: string
  role: 'client' | 'partner' | 'admin' | 'manager' | 'executive' | 'member'
  created_at: string
  last_login?: string
  is_active: boolean
  verification_status?: 'pending' | 'verified' | 'rejected'
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'clients' | 'partners' | 'admins'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs')
      }

      const data = await response.json()
      setUsers(data.users || [])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const getFilteredUsers = () => {
    let filtered = users

    // Filter by role
    switch (filter) {
      case 'clients':
        filtered = filtered.filter(user => user.role === 'client')
        break
      case 'partners':
        filtered = filtered.filter(user => user.role === 'partner')
        break
      case 'admins':
        filtered = filtered.filter(user => ['admin', 'manager', 'executive'].includes(user.role))
        break
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'client': return '#3B82F6'
      case 'partner': return '#10B981'
      case 'admin': return '#EF4444'
      case 'manager': return '#8B5CF6'
      case 'executive': return '#F59E0B'
      case 'member': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'client': return 'Client'
      case 'partner': return 'Partenaire'
      case 'admin': return 'Administrateur'
      case 'manager': return 'Manager'
      case 'executive': return 'Executive'
      case 'member': return 'Membre'
      default: return role
    }
  }

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'delete') => {
    if (action === 'delete' && !confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'action')
      }

      await fetchUsers()
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de l\'action')
    }
  }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  }

  const buttonStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '0.25rem',
    border: 'none',
    fontSize: '0.875rem',
    cursor: 'pointer',
    fontWeight: '500'
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.25rem',
    fontSize: '0.875rem'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
          <p style={{ color: '#6B7280' }}>Chargement des utilisateurs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Erreur de chargement</h2>
          <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={fetchUsers}
            style={{ ...buttonStyle, backgroundColor: '#3B82F6', color: 'white', padding: '0.75rem 1.5rem' }}
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const filteredUsers = getFilteredUsers()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <button
            onClick={() => router.push('/fr/app/dashboard')}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #D1D5DB',
              borderRadius: '0.25rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            ← Retour au dashboard
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            👥 Gestion des Utilisateurs
          </h1>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            Superviser et gérer tous les utilisateurs de la plateforme
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Filters and Search */}
        <div style={{ ...cardStyle, marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Rechercher
              </label>
              <input
                type="text"
                placeholder="Nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Filtrer par rôle
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                style={inputStyle}
              >
                <option value="all">Tous les utilisateurs</option>
                <option value="clients">Clients</option>
                <option value="partners">Partenaires</option>
                <option value="admins">Administrateurs</option>
              </select>
            </div>

            <button
              onClick={fetchUsers}
              style={{
                ...buttonStyle,
                backgroundColor: '#3B82F6',
                color: 'white',
                padding: '0.75rem 1rem'
              }}
            >
              🔄 Actualiser
            </button>
          </div>
        </div>

        {/* Users List */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              Utilisateurs ({filteredUsers.length})
            </h2>
          </div>

          {filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Aucun utilisateur trouvé
              </h3>
              <p style={{ color: '#6B7280' }}>
                Aucun utilisateur ne correspond à vos critères de recherche
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                      Utilisateur
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                      Rôle
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                      Inscription
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                      Statut
                    </th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#6B7280' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {user.full_name || 'Nom non défini'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span
                          style={{
                            backgroundColor: getRoleColor(user.role),
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', fontSize: '0.875rem', color: '#6B7280' }}>
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span
                            style={{
                              backgroundColor: user.is_active ? '#10B981' : '#EF4444',
                              color: 'white',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              width: 'fit-content'
                            }}
                          >
                            {user.is_active ? 'Actif' : 'Inactif'}
                          </span>
                          {user.verification_status && (
                            <span
                              style={{
                                backgroundColor: user.verification_status === 'verified' ? '#10B981' : 
                                               user.verification_status === 'pending' ? '#F59E0B' : '#EF4444',
                                color: 'white',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                width: 'fit-content'
                              }}
                            >
                              {user.verification_status === 'verified' ? 'Vérifié' :
                               user.verification_status === 'pending' ? 'En attente' : 'Rejeté'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleUserAction(user.id, user.is_active ? 'deactivate' : 'activate')}
                            style={{
                              ...buttonStyle,
                              backgroundColor: user.is_active ? '#F59E0B' : '#10B981',
                              color: 'white'
                            }}
                          >
                            {user.is_active ? '⏸️ Désactiver' : '▶️ Activer'}
                          </button>
                          <button
                            onClick={() => router.push(`/fr/app/users/${user.id}`)}
                            style={{
                              ...buttonStyle,
                              backgroundColor: '#3B82F6',
                              color: 'white'
                            }}
                          >
                            👁️ Voir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}