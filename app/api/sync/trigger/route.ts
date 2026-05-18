/**
 * API Route: Sync Trigger (Manual)
 * 
 * Endpoint pour déclencher manuellement une synchronisation iCal.
 * Accessible via le bouton "Synchroniser maintenant" dans l'interface admin.
 * 
 * POST /api/sync/trigger
 * Headers: Authorization: Bearer {USER_TOKEN}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Vérifie si l'utilisateur est authentifié et admin
 */
async function validateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return { valid: false, error: 'Missing authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { valid: false, error: 'Supabase configuration missing' };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Vérifier le token
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { valid: false, error: 'Invalid token' };
  }

  // Vérifier le rôle admin
  const role = user.user_metadata?.role;
  if (role !== 'admin' && role !== 'superuser') {
    return { valid: false, error: 'Insufficient permissions' };
  }

  return { valid: true, user };
}

/**
 * Vérifie le délai minimum entre deux syncs manuels
 */
async function checkSyncDelay(supabase: any): Promise<{
  allowed: boolean;
  lastSync?: Date;
  nextAllowedSync?: Date;
}> {
  // Récupérer le dernier sync manuel
  const { data: lastManualSync } = await supabase
    .from('airbnb_sync_logs')
    .select('created_at, sync_type')
    .eq('sync_type', 'sync_now')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!lastManualSync) {
    // Aucun sync manuel précédent, OK
    return { allowed: true };
  }

  const lastSyncDate = new Date(lastManualSync.created_at);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60);

  // Délai minimum: 10 minutes
  const minDelayMinutes = 10;

  if (diffMinutes < minDelayMinutes) {
    const nextAllowedSync = new Date(lastSyncDate.getTime() + minDelayMinutes * 60 * 1000);
    return {
      allowed: false,
      lastSync: lastSyncDate,
      nextAllowedSync,
    };
  }

  // Vérifier si le dernier sync était automatique (cron)
  const { data: lastAutoSync } = await supabase
    .from('airbnb_sync_logs')
    .select('created_at, sync_type')
    .eq('sync_type', 'ical_auto')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Si le dernier sync était automatique, autoriser immédiatement
  if (lastAutoSync) {
    const lastAutoSyncDate = new Date(lastAutoSync.created_at);
    if (lastAutoSyncDate > lastSyncDate) {
      return { allowed: true };
    }
  }

  return { allowed: true };
}

/**
 * POST /api/sync/trigger
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Valider l'utilisateur
    const userValidation = await validateUser(request);
    if (!userValidation.valid) {
      return NextResponse.json(
        { success: false, error: userValidation.error },
        { status: 401 }
      );
    }

    // 2. Initialiser Supabase avec service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 3. Vérifier le délai minimum
    const delayCheck = await checkSyncDelay(supabase);
    if (!delayCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sync too frequent',
          message: `Veuillez attendre ${Math.ceil(
            (delayCheck.nextAllowedSync!.getTime() - Date.now()) / (1000 * 60)
          )} minutes avant la prochaine synchronisation manuelle`,
          last_sync: delayCheck.lastSync,
          next_allowed_sync: delayCheck.nextAllowedSync,
        },
        { status: 429 }
      );
    }

    // 4. Créer un log de sync initial
    const { data: syncLog } = await supabase
      .from('airbnb_sync_logs')
      .insert({
        sync_type: 'sync_now',
        status: 'success',
        severity: 'info',
        properties_synced: 0,
        bookings_created: 0,
        bookings_updated: 0,
        conflicts_detected: 0,
        errors_count: 0,
        duration_ms: 0,
      })
      .select()
      .single();

    // 5. Déclencher la synchronisation de manière asynchrone
    // On utilise le même endpoint que le cron mais avec le CRON_SECRET
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { success: false, error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    // Construire l'URL complète
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host');
    const cronUrl = `${protocol}://${host}/api/cron/sync-ical`;

    // Déclencher la sync de manière asynchrone (fire and forget)
    fetch(cronUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    }).catch(error => {
      console.error('Failed to trigger sync:', error);
    });

    // 6. Retourner immédiatement
    return NextResponse.json({
      success: true,
      message: 'Synchronisation démarrée',
      sync_log_id: syncLog?.id,
      note: 'La synchronisation s\'exécute en arrière-plan. Consultez les logs pour suivre la progression.',
    });
  } catch (error) {
    console.error('Sync trigger error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/trigger
 * Retourne le statut du dernier sync
 */
export async function GET(request: NextRequest) {
  try {
    // Valider l'utilisateur
    const userValidation = await validateUser(request);
    if (!userValidation.valid) {
      return NextResponse.json(
        { success: false, error: userValidation.error },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer le dernier sync
    const { data: lastSync } = await supabase
      .from('airbnb_sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!lastSync) {
      return NextResponse.json({
        success: true,
        last_sync: null,
        message: 'Aucune synchronisation effectuée',
      });
    }

    // Vérifier si un sync manuel est autorisé
    const delayCheck = await checkSyncDelay(supabase);

    return NextResponse.json({
      success: true,
      last_sync: {
        id: lastSync.id,
        sync_type: lastSync.sync_type,
        status: lastSync.status,
        created_at: lastSync.created_at,
        properties_synced: lastSync.properties_synced,
        bookings_created: lastSync.bookings_created,
        bookings_updated: lastSync.bookings_updated,
        conflicts_detected: lastSync.conflicts_detected,
        errors_count: lastSync.errors_count,
        duration_ms: lastSync.duration_ms,
      },
      can_sync_now: delayCheck.allowed,
      next_allowed_sync: delayCheck.nextAllowedSync,
    });
  } catch (error) {
    console.error('Get sync status error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Désactiver le cache
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
