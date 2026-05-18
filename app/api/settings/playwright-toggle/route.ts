/**
 * API Route: Playwright Toggle
 * 
 * Endpoint pour gérer le flag d'activation/désactivation du Playwright CSV export.
 * Utilisé par GitHub Actions pour vérifier si le script doit s'exécuter.
 * 
 * GET /api/settings/playwright-toggle
 * Headers: Authorization: Bearer {API_SECRET}
 * 
 * PUT /api/settings/playwright-toggle
 * Headers: Authorization: Bearer {USER_TOKEN}
 * Body: { enabled: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Valide le token API_SECRET (pour GitHub Actions)
 */
function validateApiSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const apiSecret = process.env.API_SECRET;

  if (!apiSecret) {
    console.error('API_SECRET not configured');
    return false;
  }

  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
  return token === apiSecret;
}

/**
 * Vérifie si l'utilisateur est authentifié et admin (pour PUT)
 */
async function validateAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return { valid: false, error: 'Missing authorization header', userId: null };
  }

  const token = authHeader.replace('Bearer ', '');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { valid: false, error: 'Supabase configuration missing', userId: null };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Vérifier le token
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { valid: false, error: 'Invalid token', userId: null };
  }

  // Vérifier le rôle admin
  const role = user.user_metadata?.role;
  if (role !== 'admin' && role !== 'superuser') {
    return { valid: false, error: 'Insufficient permissions', userId: null };
  }

  return { valid: true, userId: user.id };
}

/**
 * Récupère la valeur du toggle depuis la base de données
 */
async function getToggleValue(supabase: any): Promise<boolean> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'playwright_toggle')
    .single();

  if (error || !data) {
    // Par défaut, le toggle est activé
    return true;
  }

  return data.value === 'true';
}

/**
 * Met à jour la valeur du toggle
 */
async function updateToggleValue(
  supabase: any,
  enabled: boolean,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('system_settings')
      .update({
        value: enabled ? 'true' : 'false',
        updated_by: userId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'playwright_toggle');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * GET /api/settings/playwright-toggle
 * Retourne l'état actuel du toggle
 */
export async function GET(request: NextRequest) {
  try {
    // Valider le token API_SECRET (pour GitHub Actions)
    if (!validateApiSecret(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialiser Supabase
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

    // Récupérer la valeur du toggle
    const enabled = await getToggleValue(supabase);

    return NextResponse.json({
      success: true,
      enabled,
      message: enabled
        ? 'Playwright CSV export is enabled'
        : 'Playwright CSV export is disabled',
    });
  } catch (error) {
    console.error('Get playwright toggle error:', error);

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
 * PUT /api/settings/playwright-toggle
 * Met à jour l'état du toggle (admin uniquement)
 */
export async function PUT(request: NextRequest) {
  try {
    // Valider l'utilisateur admin
    const userValidation = await validateAdminUser(request);
    if (!userValidation.valid) {
      return NextResponse.json(
        { success: false, error: userValidation.error },
        { status: 401 }
      );
    }

    // Parser le body
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Expected: { enabled: boolean }' },
        { status: 400 }
      );
    }

    // Initialiser Supabase
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

    // Mettre à jour le toggle
    const updateResult = await updateToggleValue(
      supabase,
      enabled,
      userValidation.userId || undefined
    );

    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, error: updateResult.error },
        { status: 500 }
      );
    }

    // Logger le changement
    console.log(
      `Playwright toggle updated to ${enabled} by user ${userValidation.userId}`
    );

    return NextResponse.json({
      success: true,
      enabled,
      message: enabled
        ? 'Playwright CSV export activé'
        : 'Playwright CSV export désactivé',
      updated_by: userValidation.userId,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Update playwright toggle error:', error);

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
 * OPTIONS /api/settings/playwright-toggle
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Désactiver le cache
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
