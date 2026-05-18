/**
 * API Route: Property Sync Config
 * 
 * Gère la configuration des URLs iCal pour les lofts.
 * 
 * GET /api/properties/sync-config - Liste toutes les configs
 * PUT /api/properties/sync-config - Met à jour une config
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Vérifie que l'utilisateur est authentifié et admin
 */
async function verifyAdmin(request: NextRequest): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Token manquant' };
    }

    const token = authHeader.substring(7);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { valid: false, error: 'Token invalide' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { valid: false, error: 'Profil non trouvé' };
    }

    if (profile.role !== 'admin' && profile.role !== 'superuser') {
      return { valid: false, error: 'Accès refusé: admin requis' };
    }

    return { valid: true, userId: user.id };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Erreur d\'authentification',
    };
  }
}

/**
 * GET /api/properties/sync-config
 * Récupère toutes les configurations de sync avec les infos des lofts
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupérer tous les lofts
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name')
      .order('name');

    if (loftsError) {
      return NextResponse.json(
        { error: loftsError.message },
        { status: 500 }
      );
    }

    // Récupérer toutes les configs de sync
    const { data: configs, error: configsError } = await supabase
      .from('property_sync_config')
      .select('*')
      .order('created_at');

    if (configsError) {
      return NextResponse.json(
        { error: configsError.message },
        { status: 500 }
      );
    }

    // Créer un map des configs par loft_id
    const configMap = new Map(
      configs?.map(c => [c.loft_id, c]) || []
    );

    // Combiner lofts avec leurs configs
    const combined = lofts?.map(loft => ({
      loft_id: loft.id,
      loft_name: loft.name,
      ical_url: configMap.get(loft.id)?.ical_url || null,
      is_active: configMap.get(loft.id)?.is_active || false,
      last_sync_at: configMap.get(loft.id)?.last_sync_at || null,
      last_sync_status: configMap.get(loft.id)?.last_sync_status || null,
      config_exists: configMap.has(loft.id),
    })) || [];

    // Calculer les statistiques
    const stats = {
      total_lofts: lofts?.length || 0,
      configured: combined.filter(c => c.ical_url).length,
      active: combined.filter(c => c.is_active).length,
      inactive: combined.filter(c => !c.is_active && c.ical_url).length,
      not_configured: combined.filter(c => !c.ical_url).length,
    };

    return NextResponse.json({
      success: true,
      configs: combined,
      stats,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des configs:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/properties/sync-config
 * Met à jour la configuration de sync pour un loft
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { loft_id, ical_url, is_active } = body;

    // Validation
    if (!loft_id) {
      return NextResponse.json(
        { error: 'loft_id requis' },
        { status: 400 }
      );
    }

    // Valider l'URL iCal si fournie
    if (ical_url) {
      try {
        const url = new URL(ical_url);
        if (url.protocol !== 'https:') {
          return NextResponse.json(
            { error: 'L\'URL doit être en HTTPS' },
            { status: 400 }
          );
        }
        if (!ical_url.includes('airbnb.com') && !ical_url.includes('.ics')) {
          return NextResponse.json(
            { error: 'L\'URL doit être une URL iCal Airbnb valide' },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'URL invalide' },
          { status: 400 }
        );
      }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Vérifier si le loft existe
    const { data: loft, error: loftError } = await supabase
      .from('lofts')
      .select('id, name')
      .eq('id', loft_id)
      .single();

    if (loftError || !loft) {
      return NextResponse.json(
        { error: 'Loft non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si une config existe déjà
    const { data: existingConfig } = await supabase
      .from('property_sync_config')
      .select('id')
      .eq('loft_id', loft_id)
      .single();

    let result;

    if (existingConfig) {
      // Mettre à jour la config existante
      const updateData: any = {};
      if (ical_url !== undefined) updateData.ical_url = ical_url;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data, error } = await supabase
        .from('property_sync_config')
        .update(updateData)
        .eq('loft_id', loft_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Créer une nouvelle config
      const { data, error } = await supabase
        .from('property_sync_config')
        .insert({
          loft_id,
          ical_url: ical_url || null,
          is_active: is_active !== undefined ? is_active : false,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      config: {
        ...result,
        loft_name: loft.name,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la config:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
