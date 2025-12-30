'use client'

import { useState, useEffect } from 'react'

interface PricingRule {
  id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  price_multiplier: number
  minimum_stay?: number
  is_active: boolean
  rule_type: 'seasonal' | 'event' | 'weekend' | 'custom'
  created_at: string
}

interface PricingRulesProps {
  propertyId: string
  basePrice: number
  onRulesChange?: () => void
}

export function PricingRules({ propertyId, basePrice, onRulesChange }: PricingRulesProps) {
  const [rules, setRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    price_multiplier: 1.0,
    minimum_stay: 1,
    rule_type: 'custom' as const
  })

  useEffect(() => {
    fetchPricingRules()
  }, [propertyId])

  const fetchPricingRules = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/partner/properties/${propertyId}/pricing-rules`)
      
      if (response.ok) {
        const data = await response.json()
        setRules(data.rules || [])
      }
    } catch (error) {
      console.error('Error fetching pricing rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const createRule = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/partner/properties/${propertyId}/pricing-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchPricingRules()
        setShowCreateModal(false)
        resetForm()
        onRulesChange?.()
      }
    } catch (error) {
      console.error('Error creating pricing rule:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRule = async (ruleId: string, updates: Partial<PricingRule>) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/partner/properties/${propertyId}/pricing-rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        await fetchPricingRules()
        setEditingRule(null)
        onRulesChange?.()
      }
    } catch (error) {
      console.error('Error updating pricing rule:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle de tarification ?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/partner/properties/${propertyId}/pricing-rules/${ruleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchPricingRules()
        onRulesChange?.()
      }
    } catch (error) {
      console.error('Error deleting pricing rule:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    await updateRule(ruleId, { is_active: isActive })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      price_multiplier: 1.0,
      minimum_stay: 1,
      rule_type: 'custom'
    })
  }

  const openEditModal = (rule: PricingRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      description: rule.description || '',
      start_date: rule.start_date,
      end_date: rule.end_date,
      price_multiplier: rule.price_multiplier,
      minimum_stay: rule.minimum_stay || 1,
      rule_type: rule.rule_type
    })
    setShowCreateModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingRule) {
      await updateRule(editingRule.id, formData)
    } else {
      await createRule()
    }
  }

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'seasonal': return '🌞 Saisonnier'
      case 'event': return '🎉 Événement'
      case 'weekend': return '📅 Week-end'
      case 'custom': return '⚙️ Personnalisé'
      default: return type
    }
  }

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'seasonal': return '#F59E0B'
      case 'event': return '#8B5CF6'
      case 'weekend': return '#10B981'
      case 'custom': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier > 1.5) return '#DC2626' // Red for high prices
    if (multiplier > 1.2) return '#F59E0B' // Orange for medium increase
    if (multiplier < 0.8) return '#10B981' // Green for discounts
    return '#6B7280' // Gray for normal
  }

  const presetRules = [
    {
      name: 'Haute Saison Été',
      description: 'Tarifs majorés pour la période estivale',
      rule_type: 'seasonal' as const,
      price_multiplier: 1.5,
      minimum_stay: 3
    },
    {
      name: 'Week-ends',
      description: 'Majoration pour les week-ends',
      rule_type: 'weekend' as const,
      price_multiplier: 1.3,
      minimum_stay: 2
    },
    {
      name: 'Promotion Basse Saison',
      description: 'Réduction pour attirer les clients',
      rule_type: 'seasonal' as const,
      price_multiplier: 0.8,
      minimum_stay: 1
    }
  ]

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    marginBottom: '1.5rem'
  }

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '1rem',
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

  return (
    <div>
      {/* Header */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              💰 Règles de Tarification Dynamique
            </h3>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
              Prix de base : {basePrice}€ • {rules.filter(r => r.is_active).length} règle{rules.filter(r => r.is_active).length > 1 ? 's' : ''} active{rules.filter(r => r.is_active).length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setEditingRule(null)
              setShowCreateModal(true)
            }}
            style={{
              ...buttonStyle,
              backgroundColor: '#3B82F6',
              color: 'white'
            }}
          >
            ➕ Nouvelle Règle
          </button>
        </div>

        {/* Quick Presets */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            🚀 Modèles Prédéfinis
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {presetRules.map((preset, index) => (
              <button
                key={index}
                onClick={() => {
                  setFormData({
                    ...preset,
                    start_date: '',
                    end_date: ''
                  })
                  setEditingRule(null)
                  setShowCreateModal(true)
                }}
                style={{
                  ...buttonStyle,
                  backgroundColor: 'transparent',
                  color: getRuleTypeColor(preset.rule_type),
                  border: `1px solid ${getRuleTypeColor(preset.rule_type)}`,
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem'
                }}
              >
                {getRuleTypeLabel(preset.rule_type)} {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div style={cardStyle}>
        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
          📋 Règles Configurées ({rules.length})
        </h4>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            <p style={{ color: '#6B7280' }}>Chargement des règles...</p>
          </div>
        )}

        {!loading && rules.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Aucune règle de tarification
            </h4>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              Créez des règles pour optimiser vos revenus selon les périodes
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                ...buttonStyle,
                backgroundColor: '#3B82F6',
                color: 'white'
              }}
            >
              Créer ma première règle
            </button>
          </div>
        )}

        {!loading && rules.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {rules.map((rule) => (
              <div
                key={rule.id}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  backgroundColor: rule.is_active ? '#FFFFFF' : '#F9FAFB',
                  opacity: rule.is_active ? 1 : 0.7
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h5 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                        {rule.name}
                      </h5>
                      <span
                        style={{
                          backgroundColor: getRuleTypeColor(rule.rule_type),
                          color: 'white',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                      >
                        {getRuleTypeLabel(rule.rule_type)}
                      </span>
                      {!rule.is_active && (
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
                          Inactive
                        </span>
                      )}
                    </div>
                    {rule.description && (
                      <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0 0 0.5rem 0' }}>
                        {rule.description}
                      </p>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                      <div>
                        <span style={{ color: '#6B7280' }}>Période :</span><br />
                        <span style={{ fontWeight: '500' }}>
                          {new Date(rule.start_date).toLocaleDateString('fr-FR')} - {new Date(rule.end_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#6B7280' }}>Multiplicateur :</span><br />
                        <span style={{ fontWeight: '600', color: getMultiplierColor(rule.price_multiplier) }}>
                          ×{rule.price_multiplier} ({Math.round(basePrice * rule.price_multiplier)}€)
                        </span>
                      </div>
                      {rule.minimum_stay && rule.minimum_stay > 1 && (
                        <div>
                          <span style={{ color: '#6B7280' }}>Séjour minimum :</span><br />
                          <span style={{ fontWeight: '500' }}>{rule.minimum_stay} jour{rule.minimum_stay > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                    <button
                      onClick={() => toggleRuleStatus(rule.id, !rule.is_active)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: rule.is_active ? '#F59E0B' : '#10B981',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      {rule.is_active ? '⏸️ Désactiver' : '▶️ Activer'}
                    </button>
                    <button
                      onClick={() => openEditModal(rule)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: 'transparent',
                        color: '#3B82F6',
                        border: '1px solid #3B82F6',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: 'transparent',
                        color: '#EF4444',
                        border: '1px solid #EF4444',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              {editingRule ? '✏️ Modifier la Règle' : '➕ Nouvelle Règle de Tarification'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Nom de la règle *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={inputStyle}
                    placeholder="Ex: Haute saison été"
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ ...inputStyle, minHeight: '4rem' }}
                    placeholder="Description optionnelle de la règle"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Type de règle
                  </label>
                  <select
                    value={formData.rule_type}
                    onChange={(e) => setFormData({ ...formData, rule_type: e.target.value as any })}
                    style={inputStyle}
                  >
                    <option value="custom">Personnalisé</option>
                    <option value="seasonal">Saisonnier</option>
                    <option value="event">Événement</option>
                    <option value="weekend">Week-end</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Multiplicateur de prix *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    required
                    value={formData.price_multiplier}
                    onChange={(e) => setFormData({ ...formData, price_multiplier: Number(e.target.value) })}
                    style={inputStyle}
                    placeholder="1.5"
                  />
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                    Prix résultant : {Math.round(basePrice * formData.price_multiplier)}€
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Date de début *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Séjour minimum (jours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.minimum_stay}
                    onChange={(e) => setFormData({ ...formData, minimum_stay: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingRule(null)
                    resetForm()
                  }}
                  style={{
                    ...buttonStyle,
                    backgroundColor: 'transparent',
                    color: '#6B7280',
                    border: '1px solid #D1D5DB'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...buttonStyle,
                    backgroundColor: loading ? '#9CA3AF' : '#3B82F6',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? '⏳ Sauvegarde...' : (editingRule ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}