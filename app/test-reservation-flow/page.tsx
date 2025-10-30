'use client';

import { useState, useEffect } from 'react';

interface Loft {
  id: string;
  name: string;
  description: string;
  address: string;
  price_per_night: number;
  max_guests: number;
  amenities: string[];
  average_rating: number;
  review_count: number;
}

interface Reservation {
  id: string;
  loft_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_name: string;
  guest_email: string;
  total_amount: number;
  status: string;
}

export default function TestReservationFlow() {
  const [lofts, setLofts] = useState<Loft[]>([]);
  const [selectedLoft, setSelectedLoft] = useState<Loft | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'search' | 'booking' | 'confirmation'>('search');

  // Form data
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [guestName, setGuestName] = useState('Ahmed Benali');
  const [guestEmail, setGuestEmail] = useState('ahmed.benali@example.com');
  const [guestPhone, setGuestPhone] = useState('+213555123456');
  const [specialRequests, setSpecialRequests] = useState('');

  // Load lofts on component mount
  useEffect(() => {
    loadLofts();
    loadReservations();
  }, []);

  const loadLofts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/lofts/search?guests=2&sortBy=rating');
      const data = await response.json();
      
      if (data.lofts) {
        setLofts(data.lofts);
      }
    } catch (err) {
      setError('Erreur lors du chargement des lofts');
      console.error('Error loading lofts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    try {
      const response = await fetch('/api/reservations');
      const data = await response.json();
      
      if (data.reservations) {
        setReservations(data.reservations);
      }
    } catch (err) {
      console.error('Error loading reservations:', err);
    }
  };

  const handleLoftSelect = (loft: Loft) => {
    setSelectedLoft(loft);
    setStep('booking');
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLoft || !checkIn || !checkOut) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const reservationData = {
        loft_id: selectedLoft.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guests,
        guest_info: {
          primary_guest: {
            first_name: guestName.split(' ')[0],
            last_name: guestName.split(' ').slice(1).join(' '),
            email: guestEmail,
            phone: guestPhone,
            nationality: 'Algérienne'
          }
        },
        special_requests: specialRequests,
        terms_accepted: true
      };

      console.log('Submitting reservation data:', reservationData);

      // First test with debug endpoint
      const debugResponse = await fetch('/api/debug-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });

      const debugResult = await debugResponse.json();
      console.log('Debug response:', debugResult);

      // Now try the real endpoint
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });

      const result = await response.json();
      console.log('Reservation response:', result);

      if (response.ok && result.success) {
        setStep('confirmation');
        loadReservations(); // Reload reservations to show the new one
      } else {
        console.error('Reservation failed:', result);
        setError(result.error || result.message || 'Erreur lors de la création de la réservation');
      }
    } catch (err) {
      setError('Erreur réseau lors de la réservation');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('search');
    setSelectedLoft(null);
    setError(null);
    setCheckIn('');
    setCheckOut('');
    setSpecialRequests('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Test du Flux de Réservation Client
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 'search' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className="w-16 h-1 bg-gray-300"></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 'booking' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <div className="w-16 h-1 bg-gray-300"></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step 1: Search and Select Loft */}
          {step === 'search' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Étape 1: Sélectionner un Loft</h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Chargement des lofts...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lofts.map((loft) => (
                    <div key={loft.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-lg mb-2">{loft.name}</h3>
                      <p className="text-gray-600 text-sm mb-3">{loft.address}</p>
                      <p className="text-gray-700 mb-3">{loft.description}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-blue-600">
                          {loft.price_per_night.toLocaleString()} DZD/nuit
                        </span>
                        <span className="text-sm text-gray-500">
                          ⭐ {loft.average_rating} ({loft.review_count} avis)
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          Jusqu'à {loft.max_guests} invités
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {loft.amenities.slice(0, 3).map((amenity) => (
                            <span key={amenity} className="bg-gray-100 text-xs px-2 py-1 rounded">
                              {amenity}
                            </span>
                          ))}
                          {loft.amenities.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{loft.amenities.length - 3} autres
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleLoftSelect(loft)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                      >
                        Sélectionner ce loft
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Booking Form */}
          {step === 'booking' && selectedLoft && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Étape 2: Réservation</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Loft Summary */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4">Loft sélectionné</h3>
                  <h4 className="font-medium">{selectedLoft.name}</h4>
                  <p className="text-gray-600 text-sm mb-2">{selectedLoft.address}</p>
                  <p className="text-lg font-bold text-blue-600">
                    {selectedLoft.price_per_night.toLocaleString()} DZD/nuit
                  </p>
                </div>

                {/* Booking Form */}
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date d'arrivée
                      </label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date de départ
                      </label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        min={checkIn || new Date().toISOString().split('T')[0]}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Nombre d'invités (Max: {selectedLoft?.max_guests || 'N/A'})
                    </label>
                    
                    {/* Boutons pour sélectionner le nombre d'invités */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            console.log('Button clicked: changing guests from', guests, 'to:', num);
                            setGuests(num);
                          }}
                          className={`py-2 px-3 rounded border text-sm font-medium transition-colors ${
                            guests === num
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      Sélectionné: {guests} invité{guests > 1 ? 's' : ''}
                    </p>
                    
                    {/* Menu déroulant de secours */}
                    <select
                      value={guests}
                      onChange={(e) => {
                        const newGuests = Number(e.target.value);
                        console.log('Select changed: guests from', guests, 'to:', newGuests);
                        setGuests(newGuests);
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value={1}>1 invité</option>
                      <option value={2}>2 invités</option>
                      <option value={3}>3 invités</option>
                      <option value={4}>4 invités</option>
                      <option value={5}>5 invités</option>
                      <option value={6}>6 invités</option>
                      <option value={7}>7 invités</option>
                      <option value={8}>8 invités</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Demandes spéciales (optionnel)
                    </label>
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Arrivée tardive, préférences alimentaires, etc."
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setStep('search')}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Réservation...' : 'Confirmer la réservation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirmation' && (
            <div className="text-center">
              <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-8 rounded-lg mb-6">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-semibold mb-2">Réservation confirmée !</h2>
                <p className="text-lg">
                  Votre demande de réservation a été soumise avec succès.
                </p>
                <p className="text-sm mt-2">
                  Vous recevrez un email de confirmation sous peu.
                </p>
              </div>

              <button
                onClick={resetFlow}
                className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
              >
                Faire une nouvelle réservation
              </button>
            </div>
          )}

          {/* Reservations List */}
          {reservations.length > 0 && (
            <div className="mt-12 border-t pt-8">
              <h3 className="text-xl font-semibold mb-4">
                Réservations récentes ({reservations.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reservations.slice(0, 6).map((reservation) => (
                  <div key={reservation.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{reservation.guest_name}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {reservation.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{reservation.guest_email}</p>
                    <p className="text-sm text-gray-600 mb-2">
                      {reservation.check_in_date} → {reservation.check_out_date}
                    </p>
                    <p className="font-semibold text-blue-600">
                      {reservation.total_amount?.toLocaleString()} DZD
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}