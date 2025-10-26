'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Dispute {
  id: string
  booking_id: string
  reporter_id: string
  reported_id: string
  type: 'payment' | 'property' | 'behavior' | 'cancellation' | 'other'
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  description: string
  resolution?: string
  created_at: string
  updated_at: string
  booking: {
    id: string
    loft_name: string
    check_in: string
    check_out: string
    total_price: number
  }
  reporter: {
    full_name: string
    email: string
    role: string
  }
  reported: {
    full_name: string
    email: string
    role: string
  }
}

export default function AdminDisputesPage() {
  const router = useRouter()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'open' | 'investigating' | 'resolved' | 'closed'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all')

  const fetchDisputes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/disputes')
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des litiges')
      }

      const data = await response.json()
      setDisputes(data.disputes || [])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDisputes()
  }, [])

  const getFilteredDisputes = () => {
    let filtered = disputes

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(dispute => dispute.status === filter)
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(dispute => dispute.priority === priorityFilter)
    }

    return filtered.sort((a, b) => {
      // Sort by priority first (urgent > high > medium > low)
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      // Then by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#EF4444'
      case 'investigating': return '#F59E0B'
      case 'resolved': return '#10B981'
      case 'closed': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouvert'
      case 'investigating': return 'En cours'
      case 'resolved': return 'Résolu'
      case 'closed': return 'Fermé'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#DC2626'
      case 'high': return '#EF4444'
      case 'medium': return '#F59E0B'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent'
      case 'high': return 'Élevée'
      case 'medium': return 'Moyenne'
      case 'low': return 'Faible'
      default: return priority
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'payment': return 'Paiement'
      case 'property': return 'Propriété'
      case 'behavior': return 'Comportement'
      case 'cancellation': return 'Annulation'
      case 'other': return 'Autre'
      default: return type
    }
  }

  const handleDisputeAction = async (disputeId: string, action: 'investigate' | 'resolve' | 'close', resolution?: string) => {
    try {
      const response = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, resolution })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'action')
      }

      await fetchDisputes()
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de l\'action')
    }
  }

  const handleResolve = (disputeId: string) => {
    const resolution = prompt('Résolution du litige:')
    if (resolution) {
      handleDisputeAction(disputeId, 'resolve', resolution)
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
          <p style={{ color: '#6B7280' }}>Chargement des litiges...</p>
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
            onClick={fetchDisputes}
            style={{ ...buttonStyle, backgroundColor: '#3B82F6', color: 'white', padding: '0.75rem 1.5rem' }}
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const filteredDisputes = getFilteredDisputes()
  const openDisputes = disputes.filter(d => d.status === 'open').length
  const urgentDisputes = disputes.filter(d => d.priority === 'urgent').length

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
            ⚠️ Gestion des Litiges
          </h1>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            Résoudre les conflits et disputes entre utilisateurs
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Alert Summary */}
        {(openDisputes > 0 || urgentDisputes > 0) && (
          <div style={{ 
            ...cardStyle, 
            marginBottom: '2rem',
            backgroundColor: urgentDisputes > 0 ? '#FEF2F2' : '#FEF3C7',
            border: `1px solid ${urgentDisputes > 0 ? '#FECACA' : '#FDE68A'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>
                {urgentDisputes > 0 ? '🚨' : '⚠️'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.25rem 0', color: urgentDisputes > 0 ? '#DC2626' : '#92400E' }}>
                  {urgentDisputes > 0 ? 'Litiges urgents nécessitant une attention immédiate' : 'Litiges ouverts en attente de traitement'}
                </h3>
                <p style={{ margin: 0, color: urgentDisputes > 0 ? '#DC2626' : '#92400E' }}>
                  {urgentDisputes > 0 && `${urgentDisputes} litige${urgentDisputes > 1 ? 's' : ''} urgent${urgentDisputes > 1 ? 's' : ''} • `}
                  {openDisputes} litige{openDisputes > 1 ? 's' : ''} ouvert{openDisputes > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ ...cardStyle, marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Filtrer par statut
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                style={inputStyle}
              >
                <option value="all">Tous les litiges</option>
                <option value="open">Ouverts</option>
                <option value="investigating">En cours</option>
                <option value="resolved">Résolus</option>
                <option value="closed">Fermés</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Filtrer par priorité
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                style={inputStyle}
              >
                <option value="all">Toutes les priorités</option>
                <option value="urgent">Urgent</option>
                <option value="high">Élevée</option>
                <option value="medium">Moyenne</option>
                <option value="low">Faible</option>
              </select>
            </div>

            <button
              onClick={fetchDisputes}
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

        {/* Disputes List */}
        {filteredDisputes.length === 0 ? (
          <div style={cardStyle}>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Aucun litige trouvé
              </h2>
              <p style={{ color: '#6B7280' }}>
                {filter === 'all' ? 'Aucun litige enregistré' : 'Aucun litige ne correspond à vos critères'}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredDisputes.map((dispute) => (
              <div key={dispute.id} style={{
                ...cardStyle,
                borderLeft: `4px solid ${getPriorityColor(dispute.priority)}`
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                  {/* Dispute Information */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                          {dispute.title}
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span
                            style={{
                              backgroundColor: getStatusColor(dispute.status),
                              color: 'white',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            {getStatusLabel(dispute.status)}
                          </span>
                          <span
                            style={{
                              backgroundColor: getPriorityColor(dispute.priority),
                              color: 'white',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            {getPriorityLabel(dispute.priority)}
                          </span>
                          <span
                            style={{
                              backgroundColor: '#6B7280',
                              color: 'white',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            {getTypeLabel(dispute.type)}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', textAlign: 'right' }}>
                        <div>Créé le {new Date(dispute.created_at).toLocaleDateString('fr-FR')}</div>
                        <div>ID: {dispute.id.slice(0, 8)}...</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                        📋 Description du litige
                      </div>
                      <p style={{ fontSize: '0.875rem', margin: 0, lineHeight: '1.5' }}>
                        {dispute.description}
                      </p>
                    </div>

                    {/* Booking Information */}
                    <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                        📅 Réservation concernée
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
                        <div><strong>Loft:</strong> {dispute.booking.loft_name}</div>
                        <div><strong>Montant:</strong> {dispute.booking.total_price}€</div>
                        <div><strong>Arrivée:</strong> {new Date(dispute.booking.check_in).toLocaleDateString('fr-FR')}</div>
                        <div><strong>Départ:</strong> {new Date(dispute.booking.check_out).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>

                    {/* Parties Involved */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                          👤 Plaignant
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {dispute.reporter.full_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          {dispute.reporter.email} • {dispute.reporter.role}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                          🎯 Mis en cause
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {dispute.reported.full_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          {dispute.reported.email} • {dispute.reported.role}
                        </div>
                      </div>
                    </div>

                    {dispute.resolution && (
                      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#ECFDF5', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#065F46', marginBottom: '0.5rem' }}>
                          ✅ Résolution
                        </div>
                        <p style={{ fontSize: '0.875rem', color: '#065F46', margin: 0 }}>
                          {dispute.resolution}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                      ⚙️ Actions
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {dispute.status === 'open' && (
                        <button
                          onClick={() => handleDisputeAction(dispute.id, 'investigate')}
                          style={{
                            ...buttonStyle,
                            backgroundColor: '#F59E0B',
                            color: 'white',
                            width: '100%'
                          }}
                        >
                          🔍 Prendre en charge
                        </button>
                      )}
                      
                      {dispute.status === 'investigating' && (
                        <button
                          onClick={() => handleResolve(dispute.id)}
                          style={{
                            ...buttonStyle,
                            backgroundColor: '#10B981',
                            color: 'white',
                            width: '100%'
                          }}
                        >
                          ✅ Résoudre
                        </button>
                      )}
                      
                      {dispute.status === 'resolved' && (
                        <button
                          onClick={() => handleDisputeAction(dispute.id, 'close')}
                          style={{
                            ...buttonStyle,
                            backgroundColor: '#6B7280',
                            color: 'white',
                            width: '100%'
                          }}
                        >
                          🔒 Fermer
                        </button>
                      )}
                      
                      <button
                        onClick={() => router.push(`/fr/app/disputes/${dispute.id}`)}
                        style={{
                          ...buttonStyle,
                          backgroundColor: 'transparent',
                          color: '#3B82F6',
                          border: '1px solid #3B82F6',
                          width: '100%'
                        }}
                      >
                        👁️ Voir Détails
                      </button>
                      
                      <button
                        onClick={() => router.push(`/fr/app/bookings/${dispute.booking_id}`)}
                        style={{
                          ...buttonStyle,
                          backgroundColor: 'transparent',
                          color: '#8B5CF6',
                          border: '1px solid #8B5CF6',
                          width: '100%'
                        }}
                      >
                        📅 Voir Réservation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}