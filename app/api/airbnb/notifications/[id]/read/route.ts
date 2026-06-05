import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/airbnb/notifications/[id]/read
 * Marque une notification spécifique comme lue
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    console.log('[Airbnb Notifications] Marking notification as read:', params.id);
    
    const supabase = await createClient();
    
    // Vérifier que l'utilisateur est admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('[Airbnb Notifications] Auth error:', authError);
      return NextResponse.json(
        { error: 'Erreur d\'authentification', details: authError.message },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.error('[Airbnb Notifications] No user found');
      return NextResponse.json(
        { error: 'Non authentifié - Aucun utilisateur trouvé' },
        { status: 401 }
      );
    }

    console.log('[Airbnb Notifications] User ID:', user.id);

    // Vérifier le rôle admin
    const { data: userData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Airbnb Notifications] Profile error:', profileError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du profil', details: profileError.message },
        { status: 500 }
      );
    }

    console.log('[Airbnb Notifications] User role:', userData?.role);

    if (!userData || (userData.role !== 'admin' && userData.role !== 'manager')) {
      return NextResponse.json(
        { error: `Accès refusé - Admin ou Manager uniquement (votre rôle: ${userData?.role || 'inconnu'})` },
        { status: 403 }
      );
    }

    // Vérifier que la notification existe
    const { data: notification, error: notifError } = await supabase
      .from('airbnb_notifications')
      .select('id, is_read')
      .eq('id', params.id)
      .single();

    if (notifError) {
      console.error('[Airbnb Notifications] Notification fetch error:', notifError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de la notification', details: notifError.message },
        { status: 500 }
      );
    }

    if (!notification) {
      console.error('[Airbnb Notifications] Notification not found:', params.id);
      return NextResponse.json(
        { error: 'Notification non trouvée' },
        { status: 404 }
      );
    }

    console.log('[Airbnb Notifications] Notification found, is_read:', notification.is_read);

    // Si déjà lue, retourner succès sans mise à jour
    if (notification.is_read) {
      console.log('[Airbnb Notifications] Notification already read');
      return NextResponse.json({
        success: true,
        message: 'Notification déjà marquée comme lue'
      });
    }

    // Marquer la notification comme lue
    const { error: updateError } = await supabase
      .from('airbnb_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        read_by: user.id
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('[Airbnb Notifications] Update error:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('[Airbnb Notifications] Successfully marked as read');
    return NextResponse.json({
      success: true,
      message: 'Notification marquée comme lue'
    });

  } catch (error) {
    console.error('[Airbnb Notifications] Server error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/airbnb/notifications/[id]/read
 * Marque une notification comme non lue
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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

    // Marquer la notification comme non lue
    const { error } = await supabase
      .from('airbnb_notifications')
      .update({
        is_read: false,
        read_at: null,
        read_by: null
      })
      .eq('id', params.id);

    if (error) {
      console.error('Erreur lors de la mise à jour de la notification:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marquée comme non lue'
    });

  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
