import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function checkAuth(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization') || '';

  // Auth via AIRBNB_API_SECRET (Python scraper / system)
  const apiKey = process.env.AIRBNB_API_SECRET;
  if (apiKey && authHeader === `Bearer ${apiKey}`) return true;

  // Auth via session utilisateur (web UI)
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      const sb = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user } } = await sb.auth.getUser(token);
      if (user) return true;
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    if (!(await checkAuth(request))) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const listingId = body.listing_id;
    if (!listingId) {
      return NextResponse.json({ error: 'listing_id requis' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await supabase
      .from('sync_queue')
      .insert({
        listing_id: Number(listingId),
        status: 'pending',
        reason: body.reason || 'Déclenché manuellement depuis le tableau de bord',
        retry_count: 0,
      });

    if (error) {
      console.error('[Sync Trigger] Erreur insert:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Sync planifié' });
  } catch (error) {
    console.error('[Sync Trigger] Erreur:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
