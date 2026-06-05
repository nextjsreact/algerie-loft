import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route pour marquer toutes les notifications Airbnb comme lues
 * POST /api/airbnb/notifications/read-all
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return NextResponse.json(
        { error: 'Accès refusé - Admin ou Manager uniquement' },
        { status: 403 }
      );
    }

    // Marquer toutes les notifications non lues comme lues
    const { data, error } = await supabase
      .from('airbnb_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        read_by: user.id
      })
      .eq('is_read', false)
      .select();

    if (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour', details: error.message },
        { status: 500 }
      );
    }

    const count = data?.length || 0;

    return NextResponse.json({
      success: true,
      message: `${count} notification(s) marquée(s) comme lue(s)`,
      count
    });

  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
