import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { partnerId, rejectionReason, adminNotes } = await request.json();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    // Vérifier les permissions admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!profile || !['admin', 'manager', 'superuser'].includes(profile.role)) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }
    
    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json({ error: 'La raison du rejet est requise' }, { status: 400 });
    }
    
    // Appeler la fonction reject_owner_partner
    const { data, error } = await supabase.rpc('reject_owner_partner', {
      owner_id: partnerId,
      admin_user_id: user.id,
      rejection_reason: rejectionReason,
      admin_notes: adminNotes || null
    });
    
    if (error) {
      console.error('Erreur rejet partner:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('Erreur API reject partner:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
