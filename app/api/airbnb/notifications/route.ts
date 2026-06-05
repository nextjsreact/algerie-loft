import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/airbnb/notifications
 * Récupère les notifications Airbnb pour les admins
 * Query params:
 * - unread: boolean (optionnel) - Filtrer uniquement les non lues
 * - limit: number (optionnel) - Nombre de notifications à retourner (défaut: 50)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Vérifier que l'utilisateur est admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier le rôle admin
    const { data: userData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.role !== 'admin' && userData.role !== 'manager')) {
      return NextResponse.json(
        { error: 'Accès refusé - Admin ou Manager uniquement' },
        { status: 403 }
      );
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Construire la requête
    let query = supabase
      .from('airbnb_notifications')
      .select(`
        *,
        reservations (
          id,
          guest_name,
          check_in_date,
          check_out_date,
          total_amount,
          status
        ),
        lofts (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Compter les notifications non lues
    const { count: unreadCount } = await supabase
      .from('airbnb_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      total: notifications?.length || 0
    });

  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/airbnb/notifications/read-all
 * Marque toutes les notifications comme lues
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Vérifier que l'utilisateur est admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier le rôle admin
    const { data: userData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.role !== 'admin' && userData.role !== 'manager')) {
      return NextResponse.json(
        { error: 'Accès refusé - Admin ou Manager uniquement' },
        { status: 403 }
      );
    }

    // Marquer toutes les notifications non lues comme lues
    const { error } = await supabase
      .from('airbnb_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        read_by: user.id
      })
      .eq('is_read', false);

    if (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues'
    });

  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
