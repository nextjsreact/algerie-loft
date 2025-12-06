import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
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
    
    // Récupérer tous les partners (owners avec user_id)
    const { data: partners, error } = await supabase
      .from('owners')
      .select('*')
      .not('user_id', 'is', null) // Seulement les partners (avec compte utilisateur)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erreur récupération partners:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Enrichir avec les données des profiles
    const enrichedPartners = await Promise.all(
      (partners || []).map(async (partner) => {
        if (partner.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', partner.user_id)
            .single();
          
          return {
            ...partner,
            email: profile?.email || partner.email,
            full_name: profile?.full_name
          };
        }
        return partner;
      })
    );
    
    return NextResponse.json({ partners: enrichedPartners });
    
  } catch (error) {
    console.error('Erreur API partners:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
