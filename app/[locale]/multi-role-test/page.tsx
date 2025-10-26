'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/lib/types'
import { PermissionValidator } from '@/lib/permissions/types'

export default function MultiRoleTestPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<UserRole>('client')

  const roles: { role: UserRole; label: string; description: string; color: string }[] = [
    {
      role: 'client',
      label: 'Client',
      description: 'Je veux réserver un loft',
      color: '#3B82F6'
    },
    {
      role: 'partner',
      label: 'Partenaire',
      description: 'Je veux louer mes biens',
      color: '#10B981'
    },
    {
      role: 'admin',
      label: 'Administrateur',
      description: 'Gestion complète de la plateforme',
      color: '#EF4444'
    },
    {
      role: 'manager',
      label: 'Manager',
      description: 'Gestion des opérations',
      color: '#8B5CF6'
    },
    {
      role: 'executive',
      label: 'Executive',
      description: 'Rapports et analytics',
      color: '#F59E0B'
    },
    {
      role: 'member',
      label: 'Membre',
      description: 'Accès limité aux tâches',
      color: '#6B7280'
    }
  ]

  const getPermissionsForRole = (role: UserRole) => {
    const permissions = PermissionValidator.getRolePermissions(role)
    return permissions.slice(0, 5) // Show first 5 permissions
  }

  const getAccessibleComponents = (role: UserRole) => {
    const components = [
      'client-dashboard',
      'partner-dashboard',
      'loft-search',
      'booking-management',
      'property-management',
      'partner-earnings',
      'financial-dashboard',
      'admin-panel'
    ]

    return components.filter(component => 
      PermissionValidator.canAccessComponent(role, component)
    )
  }

  const navigateToRole = (role: UserRole) => {
    switch (role) {
      case 'client':
        router.push('/fr/client/dashboard')
        break
      case 'partner':
        router.push('/fr/partner/dashboard')
        break
      case 'admin':
      case 'manager':
      case 'executive':
        router.push('/fr/app/dashboard')
        break
      default:
        router.push('/fr/dashboard')
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
            🎭 Test du Système Multi-Rôles
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#6B7280' }}>
            Explorez les différents rôles et leurs permissions dans le système de réservation
          </p>
        </div>

        {/* Role Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {roles.map((roleInfo) => (
            <div 
              key={roleInfo.role}
              style={{
                backgroundColor: 'white',
                border: selectedRole === roleInfo.role ? `2px solid ${roleInfo.color}` : '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                cursor: 'pointer',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
              onClick={() => setSelectedRole(roleInfo.role)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div 
                  style={{ 
                    width: '1rem', 
                    height: '1rem', 
                    borderRadius: '50%', 
                    backgroundColor: roleInfo.color 
                  }} 
                />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                  {roleInfo.label}
                </h3>
                {selectedRole === roleInfo.role && (
                  <span style={{ 
                    backgroundColor: roleInfo.color, 
                    color: 'white', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '0.25rem', 
                    fontSize: '0.75rem',
                    marginLeft: 'auto'
                  }}>
                    Sélectionné
                  </span>
                )}
              </div>
              <p style={{ color: '#6B7280', margin: 0 }}>{roleInfo.description}</p>
            </div>
          ))}
        </div>

        {/* Role Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          {/* Permissions */}
          <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔐 Permissions pour {roles.find(r => r.role === selectedRole)?.label}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {getPermissionsForRole(selectedRole).map((permission, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#F9FAFB', borderRadius: '0.25rem' }}>
                  <span style={{ 
                    backgroundColor: '#E5E7EB', 
                    color: '#374151', 
                    padding: '0.125rem 0.5rem', 
                    borderRadius: '0.25rem', 
                    fontSize: '0.75rem' 
                  }}>
                    {permission.resource}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    {permission.action} ({permission.scope || 'all'})
                  </span>
                </div>
              ))}
              {getPermissionsForRole(selectedRole).length === 0 && (
                <p style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Aucune permission spécifique</p>
              )}
            </div>
          </div>

          {/* Accessible Components */}
          <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
              🎯 Composants Accessibles
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {getAccessibleComponents(selectedRole).map((component) => (
                <div key={component} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#F0FDF4', borderRadius: '0.25rem' }}>
                  <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#10B981', borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.875rem' }}>{component}</span>
                </div>
              ))}
              {getAccessibleComponents(selectedRole).length === 0 && (
                <p style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Aucun composant accessible</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={() => router.push('/fr/register')}
            style={{
              backgroundColor: '#3B82F6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            📝 Tester l'Inscription Multi-Rôles
          </button>
          
          <button 
            onClick={() => navigateToRole(selectedRole)}
            style={{
              backgroundColor: 'white',
              color: '#374151',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #D1D5DB',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🚀 Accéder au Dashboard {roles.find(r => r.role === selectedRole)?.label}
          </button>

          <button 
            onClick={() => router.push('/fr/login')}
            style={{
              backgroundColor: '#6B7280',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🔑 Page de Connexion
          </button>

          <button 
            onClick={() => router.push('/fr/booking-demo')}
            style={{
              backgroundColor: '#10B981',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🏠 Démonstration Réservation
          </button>

          <button 
            onClick={() => router.push('/fr/client/search')}
            style={{
              backgroundColor: '#059669',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🔍 Recherche Réelle de Lofts
          </button>
        </div>

        {/* Info Box */}
        <div style={{ 
          marginTop: '2rem', 
          backgroundColor: '#EBF8FF', 
          border: '1px solid #93C5FD', 
          borderRadius: '0.5rem', 
          padding: '1.5rem' 
        }}>
          <h3 style={{ color: '#1E40AF', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            ℹ️ Informations sur le Test
          </h3>
          <ul style={{ color: '#1E40AF', margin: 0, paddingLeft: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}><strong>Client</strong> : Peut rechercher et réserver des lofts</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Partenaire</strong> : Peut gérer ses propriétés et réservations</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Admin/Manager</strong> : Accès complet à la gestion</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Executive</strong> : Accès aux rapports et analytics</li>
            <li><strong>Member</strong> : Accès limité aux tâches assignées</li>
          </ul>
        </div>
      </div>
    </div>
  )
}