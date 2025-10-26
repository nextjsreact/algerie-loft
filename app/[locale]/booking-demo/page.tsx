'use client'

import { useState } from 'react'

export default function BookingDemoPage() {
  const [selectedLoft, setSelectedLoft] = useState<number | null>(null)
  const [bookingStep, setBookingStep] = useState<'search' | 'details' | 'booking' | 'confirmation'>('search')

  const demoLofts = [
    {
      id: 1,
      name: "Loft Moderne Centre-Ville",
      address: "15 Rue de la République, Alger",
      price: 85,
      rating: 4.8,
      reviews: 24,
      images: "🏢",
      amenities: ["WiFi", "Climatisation", "Cuisine équipée", "Parking"],
      partner: "Ahmed Benali",
      description: "Magnifique loft au cœur d'Alger avec vue panoramique"
    },
    {
      id: 2,
      name: "Studio Cosy Hydra",
      address: "8 Avenue Souidani Boudjemaa, Hydra",
      price: 65,
      rating: 4.6,
      reviews: 18,
      images: "🏠",
      amenities: ["WiFi", "Balcon", "Cuisine", "Transport proche"],
      partner: "Fatima Kaci",
      description: "Studio confortable dans le quartier résidentiel d'Hydra"
    },
    {
      id: 3,
      name: "Appartement Familial Bab Ezzouar",
      address: "Cité 1200 Logements, Bab Ezzouar",
      price: 95,
      rating: 4.9,
      reviews: 31,
      images: "🏘️",
      amenities: ["WiFi", "3 Chambres", "Jardin", "Parking sécurisé"],
      partner: "Karim Messaoudi",
      description: "Spacieux appartement familial avec toutes commodités"
    }
  ]

  const bookingStatuses = [
    { status: 'pending', label: 'En attente', color: '#F59E0B', count: 3 },
    { status: 'confirmed', label: 'Confirmée', color: '#10B981', count: 12 },
    { status: 'cancelled', label: 'Annulée', color: '#EF4444', count: 1 },
    { status: 'completed', label: 'Terminée', color: '#3B82F6', count: 8 }
  ]

  const handleLoftSelect = (loftId: number) => {
    setSelectedLoft(loftId)
    setBookingStep('details')
  }

  const handleBookNow = () => {
    setBookingStep('booking')
  }

  const handleConfirmBooking = () => {
    setBookingStep('confirmation')
  }

  const selectedLoftData = demoLofts.find(loft => loft.id === selectedLoft)

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  }

  const buttonStyle = {
    backgroundColor: '#3B82F6',
    color: 'white',
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
    fontSize: '1rem'
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
            🏠 Démonstration du Système de Réservation
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#6B7280' }}>
            Découvrez le nouveau système de réservation multi-rôles en action
          </p>
        </div>

        {/* Statistics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {bookingStatuses.map((item) => (
            <div key={item.status} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>
                  Réservations {item.label}
                </h3>
                <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', backgroundColor: item.color }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{item.count}</div>
            </div>
          ))}
        </div>

        {bookingStep === 'search' && (
          <div>
            {/* Search Interface */}
            <div style={{ ...cardStyle, marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📍 Recherche de Lofts
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date d'arrivée</label>
                  <input type="date" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date de départ</label>
                  <input type="date" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Nombre d'invités</label>
                  <input type="number" placeholder="2" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', alignItems: 'end' }}>
                  <button style={buttonStyle}>Rechercher</button>
                </div>
              </div>
            </div>

            {/* Loft Results */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {demoLofts.map((loft) => (
                <div key={loft.id} style={{ ...cardStyle, cursor: 'pointer' }} onClick={() => handleLoftSelect(loft.id)}>
                  <div style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '1rem' }}>{loft.images}</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>{loft.name}</h3>
                  <p style={{ color: '#6B7280', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    📍 {loft.address}
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ color: '#F59E0B' }}>⭐</span>
                      <span style={{ fontWeight: '500' }}>{loft.rating}</span>
                      <span style={{ color: '#6B7280' }}>({loft.reviews} avis)</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{loft.price}€</div>
                      <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>par nuit</div>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    {loft.amenities.slice(0, 3).map((amenity, index) => (
                      <span key={amenity} style={{ 
                        display: 'inline-block',
                        backgroundColor: '#F3F4F6', 
                        color: '#374151', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.25rem', 
                        fontSize: '0.75rem',
                        marginRight: '0.5rem',
                        marginBottom: '0.25rem'
                      }}>
                        {amenity}
                      </span>
                    ))}
                    {loft.amenities.length > 3 && (
                      <span style={{ 
                        display: 'inline-block',
                        backgroundColor: '#E5E7EB', 
                        color: '#6B7280', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.25rem', 
                        fontSize: '0.75rem'
                      }}>
                        +{loft.amenities.length - 3}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem' }}>
                    Propriétaire: {loft.partner}
                  </div>

                  <button style={{ ...buttonStyle, width: '100%' }}>
                    Voir les détails
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {bookingStep === 'details' && selectedLoftData && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div style={cardStyle}>
              <button 
                onClick={() => setBookingStep('search')}
                style={{ ...buttonStyle, backgroundColor: '#6B7280', marginBottom: '1rem' }}
              >
                ← Retour à la recherche
              </button>
              <div style={{ textAlign: 'center', fontSize: '4rem', marginBottom: '1rem' }}>{selectedLoftData.images}</div>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{selectedLoftData.name}</h2>
              <p style={{ color: '#6B7280', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📍 {selectedLoftData.address}
              </p>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Description</h3>
                <p style={{ color: '#6B7280' }}>{selectedLoftData.description}</p>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Équipements</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {selectedLoftData.amenities.map((amenity) => (
                    <div key={amenity} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#10B981', borderRadius: '50%' }} />
                      <span style={{ fontSize: '0.875rem' }}>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Propriétaire</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                  <div style={{ 
                    width: '2.5rem', 
                    height: '2.5rem', 
                    backgroundColor: '#3B82F6', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white', 
                    fontWeight: '600' 
                  }}>
                    {selectedLoftData.partner.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500' }}>{selectedLoftData.partner}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Partenaire vérifié ✅</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{selectedLoftData.price}€</span>
                <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>par nuit</span>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Arrivée</label>
                    <input type="date" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Départ</label>
                    <input type="date" style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Invités</label>
                  <input type="number" placeholder="2" style={inputStyle} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>3 nuits × {selectedLoftData.price}€</span>
                  <span>{selectedLoftData.price * 3}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Frais de service</span>
                  <span>15€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '1.125rem', borderTop: '1px solid #E5E7EB', paddingTop: '0.5rem' }}>
                  <span>Total</span>
                  <span>{selectedLoftData.price * 3 + 15}€</span>
                </div>
              </div>

              <button style={{ ...buttonStyle, width: '100%' }} onClick={handleBookNow}>
                Réserver maintenant
              </button>
            </div>
          </div>
        )}

        {bookingStep === 'booking' && selectedLoftData && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={cardStyle}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Finaliser la réservation</h2>
              <p style={{ color: '#6B7280', marginBottom: '2rem' }}>
                {selectedLoftData.name} - {selectedLoftData.price * 3 + 15}€ total
              </p>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Informations personnelles</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Prénom</label>
                    <input placeholder="Votre prénom" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Nom</label>
                    <input placeholder="Votre nom" style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Email</label>
                  <input type="email" placeholder="votre@email.com" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Téléphone</label>
                  <input placeholder="+213 XX XX XX XX" style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Demandes spéciales</h3>
                <textarea 
                  placeholder="Avez-vous des demandes particulières pour votre séjour ?"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Paiement</h3>
                <div style={{ padding: '1rem', backgroundColor: '#EBF8FF', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span>💳</span>
                    <span style={{ fontWeight: '500' }}>Paiement sécurisé</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>
                    Le paiement sera traité de manière sécurisée via Stripe
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setBookingStep('details')}
                  style={{ ...buttonStyle, backgroundColor: '#6B7280', flex: 1 }}
                >
                  Retour
                </button>
                <button onClick={handleConfirmBooking} style={{ ...buttonStyle, flex: 1 }}>
                  Confirmer et payer
                </button>
              </div>
            </div>
          </div>
        )}

        {bookingStep === 'confirmation' && selectedLoftData && (
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Réservation confirmée !</h2>
              <p style={{ color: '#6B7280', marginBottom: '2rem' }}>
                Votre réservation pour <strong>{selectedLoftData.name}</strong> a été confirmée.
                Vous recevrez un email de confirmation sous peu.
              </p>
              
              <div style={{ backgroundColor: '#F0FDF4', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#166534' }}>
                  <div><strong>Référence:</strong> BK-2024-001</div>
                  <div><strong>Propriétaire:</strong> {selectedLoftData.partner}</div>
                  <div><strong>Total payé:</strong> {selectedLoftData.price * 3 + 15}€</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button onClick={() => setBookingStep('search')} style={buttonStyle}>
                  Nouvelle recherche
                </button>
                <button style={{ ...buttonStyle, backgroundColor: '#6B7280' }}>
                  💬 Contacter le propriétaire
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}