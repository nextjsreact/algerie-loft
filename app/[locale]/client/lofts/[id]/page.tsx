'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

interface LoftDetailPageProps {
  params: Promise<{ id: string; locale: string }>
}

export default function LoftDetailPage({ params }: LoftDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = resolvedParams.locale || 'fr'

  const [loft, setLoft] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Form state
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || '')
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || '')
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 1)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  useEffect(() => {
    fetch(`/api/lofts/${resolvedParams.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.loft) setLoft(data.loft)
        else setError(data.error || 'Loft non trouvé')
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [resolvedParams.id])

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 0
  const total = nights * (loft?.price_per_night || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkIn || !checkOut) { alert('Veuillez sélectionner les dates'); return }
    const today = new Date(); today.setHours(0,0,0,0)
    const cin = new Date(checkIn); cin.setHours(0,0,0,0)
    const cout = new Date(checkOut); cout.setHours(0,0,0,0)
    if (cin < today) { alert('La date d\'arrivée ne peut pas être dans le passé'); return }
    if (cout <= cin) { alert('La date de départ doit être après la date d\'arrivée'); return }
    if (!guestPhone.trim()) { alert('Le numéro de téléphone est obligatoire'); return }
    if (nights <= 0) { alert('La date de départ doit être après la date d\'arrivée'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loft_id: loft.id,
          guest_name: guestName || null,
          guest_email: guestEmail || null,
          guest_phone: guestPhone,
          guest_nationality: 'DZ',
          guest_count: guests,
          check_in_date: checkIn,
          check_out_date: checkOut,
          base_price: total,
          cleaning_fee: 0,
          service_fee: 0,
          taxes: 0,
          total_amount: total,
          special_requests: specialRequests || null,
        }),
      })
      const data = await res.json()
      if (data.success || data.data?.id) {
        setSuccess(true)
      } else {
        alert(data.error || 'Erreur lors de la réservation')
      }
    } catch {
      alert('Erreur réseau')
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-4">🔄</div><p className="text-gray-500">Chargement...</p></div>
    </div>
  )

  if (error || !loft) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-gray-700 mb-4">{error || 'Loft non trouvé'}</p>
        <button onClick={() => router.back()} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Retour</button>
      </div>
    </div>
  )

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">Réservation envoyée !</h2>
        <p className="text-gray-600 mb-6">Votre demande de réservation pour <strong>{loft.name}</strong> a été envoyée. Notre équipe vous contactera pour confirmer.</p>
        <button onClick={() => router.push(`/${locale}`)} className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold">
          Retour à l'accueil
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => router.back()} className="text-blue-600 hover:underline mb-2 flex items-center gap-1">
            ← Retour
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{loft.name}</h1>
          {loft.address && <p className="text-gray-500 text-sm mt-1">📍 {loft.address}</p>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Loft info */}
          <div className="space-y-6">
            {/* Photo */}
            <div className="rounded-xl overflow-hidden bg-gray-200 h-64 flex items-center justify-center">
              {loft.cover_photo ? (
                <img src={loft.cover_photo} alt={loft.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-6xl">🏠</span>
              )}
            </div>

            {/* Price */}
            <div className="bg-white rounded-xl p-4 border">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Prix par nuit</span>
                <span className="text-2xl font-bold text-blue-600">{loft.price_per_night?.toLocaleString()} DA</span>
              </div>
            </div>

            {/* Description */}
            {loft.description && (
              <div className="bg-white rounded-xl p-4 border">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{loft.description}</p>
              </div>
            )}
          </div>

          {/* Right: Booking form */}
          <div>
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900">Réserver ce loft</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Arrivée</label>
                  <input type="date" value={checkIn}
                    onChange={e => {
                      const val = e.target.value
                      setCheckIn(val)
                      // Reset checkout if it's no longer valid
                      if (checkOut && checkOut <= val) setCheckOut('')
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Départ</label>
                  <input type="date" value={checkOut}
                    onChange={e => setCheckOut(e.target.value)}
                    min={checkIn
                      ? new Date(new Date(checkIn + 'T00:00:00').getTime() + 86400000).toISOString().split('T')[0]
                      : new Date(new Date().getTime() + 86400000).toISOString().split('T')[0]}
                    className="w-full border rounded-lg px-3 py-2 text-sm" required />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Nombre d'invités</label>
                <input type="number" min="1" max={loft.max_guests || 10} value={guests}
                  onChange={e => setGuests(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>

              <hr />

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Téléphone <span className="text-red-500">*</span></label>
                <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                  placeholder="+213 XX XX XX XX" className="w-full border rounded-lg px-3 py-2 text-sm" required />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Nom (optionnel)</label>
                <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)}
                  placeholder="Votre nom" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Email (optionnel)</label>
                <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                  placeholder="votre@email.com" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Demandes spéciales (optionnel)</label>
                <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
                  rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>

              {/* Price summary */}
              {nights > 0 && (
                <div className="bg-blue-50 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{nights} nuit{nights > 1 ? 's' : ''} × {loft.price_per_night?.toLocaleString()} DA</span>
                    <span>{total.toLocaleString()} DA</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t pt-1 mt-1">
                    <span>Total</span>
                    <span className="text-blue-700">{total.toLocaleString()} DA</span>
                  </div>
                </div>
              )}

              <button type="submit" disabled={submitting || nights <= 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold transition-colors">
                {submitting ? 'Envoi en cours...' : `Demander la réservation${nights > 0 ? ` — ${total.toLocaleString()} DA` : ''}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
