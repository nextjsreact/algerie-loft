'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PendingPartner {
  id: string
  user_id: string
  business_name?: string
  business_type: 'individual' | 'company'
  tax_id?: string
  address: string
  phone: string
  verification_status: 'pending' | 'verified' | 'rejected'
  verification_documents: string[]
  created_at: string
  user: {
    full_name: string
    email: string
  }
}

export default function PendingPartnersPage() {
  const router = useRouter()
  const [partners, setPartners] = useState<PendingPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchPendingPartners = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/partners?status=pending')
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des partenaires')
      }

      const data = await response.json()
      setPartners(data.partners || [])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingPartners()
  }, [])

  const handlePartnerAction = async (partnerId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      setProcessingId(partnerId)
      
      const response = await fetch(`/api/admin/partners/${partnerId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          reason: reason || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors du traitement')
      }

      await fetchPendingPartners()
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du traitement')
    } finally {
      setProcessingId(null)
    }
  }

  const handleApprove = (partnerId: string) => {
    if (confirm('Êtes-vous sûr de vouloir approuver ce partenaire ?')) {
      handlePartnerAction(partnerId, 'approve')
    }
  }

  const handleReject = (partnerId: string) => {
    const reason = prompt('Raison du rejet (optionnel):')
    if (reason !== null) { // User didn't cancel
      handlePartnerAction(partnerId, 'reject', reason)
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
          <p style={{ color: '#6B7280' }}>Chargement des demandes de partenariat...</p>
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
            onClick={fetchPendingPartners}
            style={{ ...buttonStyle, backgroundColor: '#3B82F6', color: 'white', padding: '0.75rem 1.5rem' }}
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

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
            ⏳ Validation des Partenaires
          </h1>
          <p style={{ color: '#6B7280', margin: '0.5rem 0 0 0' }}>
            Examiner et valider les demandes de partenariat
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {partners.length === 0 ? (
          <div style={cardStyle}>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Aucune demande en attente
              </h2>
              <p style={{ color: '#6B7280' }}>
                Toutes les demandes de partenariat ont été traitées
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {partners.map((partner) => (
              <div key={partner.id} style={cardStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                  {/* Partner Information */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                          {partner.business_name || partner.user.full_name}
                        </h3>
                        <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
                          {partner.user.email}
                        </p>
                      </div>
                      <span
                        style={{
                          backgroundColor: '#F59E0B',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        En attente de validation
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Type d'activité</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {partner.business_type === 'individual' ? 'Particulier' : 'Entreprise'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Téléphone</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{partner.phone}</div>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Adresse</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{partner.address}</div>
                      </div>
                      {partner.tax_id && (
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Numéro fiscal</div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{partner.tax_id}</div>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Date de demande</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {new Date(partner.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                        📄 Documents fournis ({partner.verification_documents.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {partner.verification_documents.map((doc, index) => (
                          <span
                            key={index}
                            style={{
                              backgroundColor: '#EBF8FF',
                              color: '#1E40AF',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            📎 Document {index + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                      ⚙️ Actions de Validation
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <button
                        onClick={() => handleApprove(partner.id)}
                        disabled={processingId === partner.id}
                        style={{
                          ...buttonStyle,
                          backgroundColor: processingId === partner.id ? '#9CA3AF' : '#10B981',
                          color: 'white',
                          width: '100%',
                          cursor: processingId === partner.id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {processingId === partner.id ? '⏳ Traitement...' : '✅ Approuver'}
                      </button>
                      
                      <button
                        onClick={() => handleReject(partner.id)}
                        disabled={processingId === partner.id}
                        style={{
                          ...buttonStyle,
                          backgroundColor: processingId === partner.id ? '#9CA3AF' : '#EF4444',
                          color: 'white',
                          width: '100%',
                          cursor: processingId === partner.id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {processingId === partner.id ? '⏳ Traitement...' : '❌ Rejeter'}
                      </button>
                      
                      <button
                        onClick={() => router.push(`/fr/app/partners/${partner.id}`)}
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
                    </div>

                    <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#FEF3C7', borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: '500', marginBottom: '0.25rem' }}>
                        ⚠️ Points à Vérifier
                      </div>
                      <ul style={{ fontSize: '0.75rem', color: '#92400E', margin: 0, paddingLeft: '1rem' }}>
                        <li>Identité et documents officiels</li>
                        <li>Justificatifs de propriété</li>
                        <li>Informations bancaires</li>
                        <li>Conformité réglementaire</li>
                      </ul>
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