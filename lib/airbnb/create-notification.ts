import { createClient } from '@/lib/supabase/server';

export type NotificationType = 'new' | 'updated' | 'cancelled' | 'conflict' | 'error';

interface CreateNotificationParams {
  reservationId: string;
  loftId: string;
  type: NotificationType;
  metadata?: Record<string, any>;
}

/**
 * Crée une notification Airbnb dans la base de données
 */
export async function createAirbnbNotification({
  reservationId,
  loftId,
  type,
  metadata = {}
}: CreateNotificationParams) {
  try {
    const supabase = await createClient(true);

    // Récupérer les informations du loft
    const { data: loft } = await supabase
      .from('lofts')
      .select('name')
      .eq('id', loftId)
      .single();

    if (!loft) {
      console.error('Loft non trouvé:', loftId);
      return { success: false, error: 'Loft non trouvé' };
    }

    // Récupérer les informations de la réservation
    const { data: reservation } = await supabase
      .from('reservations')
      .select('guest_name, check_in_date, check_out_date, total_amount, currency_code, status')
      .eq('id', reservationId)
      .single();

    if (!reservation) {
      console.error('Réservation non trouvée:', reservationId);
      return { success: false, error: 'Réservation non trouvée' };
    }

    // Générer le titre et le message selon le type
    const { title, message } = generateNotificationContent(
      type,
      loft.name,
      reservation
    );

    // Créer la notification
    const { data, error } = await supabase
      .from('airbnb_notifications')
      .insert({
        reservation_id: reservationId,
        loft_id: loftId,
        type,
        title,
        message,
        metadata: {
          ...metadata,
          guest_name: reservation.guest_name,
          check_in: reservation.check_in_date,
          check_out: reservation.check_out_date,
          total_price: reservation.total_amount,
          currency_code: reservation.currency_code,
          status: reservation.status,
          loft_name: loft.name
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la notification:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Notification créée:', {
      id: data.id,
      type,
      loft: loft.name,
      guest: reservation.guest_name
    });

    return { success: true, data };

  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

/**
 * Génère le contenu de la notification selon le type
 */
function generateNotificationContent(
  type: NotificationType,
  loftName: string,
  reservation: any
) {
  const guestName = reservation.guest_name || 'Guest';
  const checkIn = formatDate(reservation.check_in_date);
  const checkOut = formatDate(reservation.check_out_date);
  const price = formatCurrency(reservation.total_amount);
  const nights = calculateNights(reservation.check_in_date, reservation.check_out_date);

  switch (type) {
    case 'new':
      return {
        title: `🎉 Nouvelle réservation - ${loftName}`,
        message: `${guestName} • ${checkIn} → ${checkOut} (${nights} nuits) • ${price}`
      };

    case 'updated':
      return {
        title: `📝 Réservation modifiée - ${loftName}`,
        message: `${guestName} • ${checkIn} → ${checkOut} (${nights} nuits) • ${price}`
      };

    case 'cancelled':
      return {
        title: `❌ Réservation annulée - ${loftName}`,
        message: `${guestName} • ${checkIn} → ${checkOut} (${nights} nuits) • ${price}`
      };

    case 'conflict':
      return {
        title: `⚠️ Conflit détecté - ${loftName}`,
        message: `Chevauchement de dates pour ${guestName} • ${checkIn} → ${checkOut}`
      };

    case 'error':
      return {
        title: `🚨 Erreur de synchronisation - ${loftName}`,
        message: `Problème lors de la synchronisation de la réservation pour ${guestName}`
      };

    default:
      return {
        title: `Notification - ${loftName}`,
        message: `${guestName} • ${checkIn} → ${checkOut}`
      };
  }
}

/**
 * Formate une date au format français
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formate un montant en devise
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Calcule le nombre de nuits entre deux dates
 */
function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
