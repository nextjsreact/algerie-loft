import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route pour créer une notification Airbnb de test
 * GET /api/airbnb/notifications/test
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier que l'utilisateur est admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé - Admin uniquement' },
        { status: 403 }
      );
    }

    // Récupérer un loft
    const { data: loft, error: loftError } = await supabase
      .from('lofts')
      .select('id, name')
      .limit(1)
      .single();

    if (loftError || !loft) {
      return NextResponse.json(
        { error: 'Aucun loft trouvé', details: loftError },
        { status: 404 }
      );
    }

    // Générer des données de test aléatoires
    const guests = ['Jean Dupont', 'Marie Martin', 'Ahmed Benali', 'Sophie Laurent', 'Karim Meziane'];
    const randomGuest = guests[Math.floor(Math.random() * guests.length)];
    
    const today = new Date();
    const checkIn = new Date(today);
    checkIn.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + Math.floor(Math.random() * 5) + 2);
    
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const pricePerNight = 12000 + Math.floor(Math.random() * 8000);
    const totalPrice = nights * pricePerNight;

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-DZ', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount) + ' DA';
    };

    // Créer la notification
    const testNotification = {
      reservation_id: null, // NULL pour les notifications de test (pas de vraie réservation)
      loft_id: loft.id,
      type: 'new',
      title: `🎉 Nouvelle réservation - ${loft.name}`,
      message: `${randomGuest} • ${formatDate(checkIn)} → ${formatDate(checkOut)} (${nights} nuits) • ${formatCurrency(totalPrice)}`,
      metadata: {
        guest_name: randomGuest,
        check_in: checkIn.toISOString().split('T')[0],
        check_out: checkOut.toISOString().split('T')[0],
        total_price: totalPrice,
        price_per_night: pricePerNight,
        nights: nights,
        status: 'confirmed',
        loft_name: loft.name,
        test: true,
        created_by_api: true,
        created_at: new Date().toISOString()
      },
      is_read: false
    };

    const { data, error } = await supabase
      .from('airbnb_notifications')
      .insert(testNotification)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la notification:', error);
      return NextResponse.json(
        { 
          error: 'Erreur lors de la création', 
          details: {
            message: error.message,
            code: error.code,
            hint: error.hint,
            details: error.details
          },
          notification: testNotification
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification de test créée avec succès',
      notification: {
        id: data.id,
        type: data.type,
        title: data.title,
        message: data.message,
        loft: loft.name,
        guest: randomGuest,
        checkIn: formatDate(checkIn),
        checkOut: formatDate(checkOut),
        nights: nights,
        totalPrice: formatCurrency(totalPrice),
        createdAt: new Date(data.created_at).toLocaleString('fr-FR')
      }
    });

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
