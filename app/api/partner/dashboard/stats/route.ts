import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getPartnerInfo } from '@/lib/partner-auth'

export async function GET(request: NextRequest) {
  try {
    const partnerInfo = await getPartnerInfo()
    if (!partnerInfo) {
      return NextResponse.json({ error: 'Partner profile not found' }, { status: 403 })
    }

    const supabase = await createClient(true)
    const partnerId = partnerInfo.ownerId

    // Get properties
    const { data: properties } = await supabase
      .from('lofts')
      .select('id, status')
      .eq('owner_id', partnerId)

    const totalProperties = properties?.length || 0
    const activeProperties = properties?.filter(p => p.status === 'available').length || 0
    const propertyIds = (properties || []).map(p => p.id)

    // Get reservations
    const { data: reservations } = propertyIds.length > 0
      ? await supabase
          .from('reservations')
          .select('id, check_in_date, check_out_date, status, total_amount')
          .in('loft_id', propertyIds)
      : { data: [] }

    const totalBookings = reservations?.length || 0
    const today = new Date().toISOString().split('T')[0]
    const upcomingBookings = (reservations || []).filter(
      r => r.check_in_date >= today && r.status !== 'cancelled'
    ).length

    // Monthly earnings — RÉEL depuis reservation_payments (paiements confirmés uniquement)
    const currentMonth = new Date()
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString()
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).toISOString()
    const firstDayStr = firstDay.split('T')[0]
    const lastDayStr = lastDay.split('T')[0]

    let monthlyEarnings = 0

    if (propertyIds.length > 0) {
      // Récupérer les paiements réels depuis reservation_payments
      const { data: payments } = await supabase
        .from('reservation_payments')
        .select('amount, reservation_id, created_at')
        .gte('created_at', firstDay)
        .lte('created_at', lastDay)
        .eq('status', 'completed')

      if (payments && payments.length > 0) {
        // Vérifier que la réservation appartient bien au partenaire
        const paymentResIds = payments.map((p: any) => p.reservation_id).filter(Boolean)
        if (paymentResIds.length > 0) {
          const { data: partnerRes } = await supabase
            .from('reservations')
            .select('id')
            .in('id', paymentResIds)
            .in('loft_id', propertyIds)

          const validResIds = new Set((partnerRes || []).map((r: any) => r.id))
          monthlyEarnings = payments
            .filter((p: any) => validResIds.has(p.reservation_id))
            .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
        }
      }

      // Fallback : si pas de données reservation_payments, utiliser les réservations complétées/confirmées
      // avec check_out passé (séjours réellement terminés ce mois)
      if (monthlyEarnings === 0) {
        const todayStr = new Date().toISOString().split('T')[0]
        monthlyEarnings = (reservations || [])
          .filter(r =>
            r.check_out_date >= firstDayStr &&
            r.check_out_date <= todayStr &&  // check_out déjà passé = séjour terminé
            r.status !== 'cancelled'
          )
          .reduce((sum, r) => sum + Number(r.total_amount || 0), 0)
      }
    }

    // Occupancy rate — basé sur les séjours confirmés/complétés ce mois
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
    const totalPossibleNights = totalProperties * daysInMonth
    const totalOccupiedNights = (reservations || [])
      .filter(r => r.check_in_date >= firstDayStr && r.check_in_date <= lastDayStr && r.status !== 'cancelled')
      .reduce((sum, r) => {
        const nights = Math.ceil((new Date(r.check_out_date).getTime() - new Date(r.check_in_date).getTime()) / 86400000)
        return sum + Math.max(0, nights)
      }, 0)
    const occupancyRate = totalPossibleNights > 0 ? (totalOccupiedNights / totalPossibleNights) * 100 : 0

    return NextResponse.json({
      total_properties: totalProperties,
      active_properties: activeProperties,
      total_bookings: totalBookings,
      upcoming_bookings: upcomingBookings,
      monthly_earnings: Math.round(monthlyEarnings),
      occupancy_rate: Math.round(occupancyRate * 10) / 10,
      average_rating: 4.5,
      total_reviews: Math.floor(totalBookings * 0.7)
    })

  } catch (error) {
    console.error('Partner stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
