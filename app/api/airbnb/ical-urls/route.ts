/**
 * API Route: Airbnb iCal URLs Sync
 *
 * Reçoit les URLs iCal collectées par le scraper Python et les enregistre
 * dans property_sync_config pour que le cron iCal puisse les utiliser.
 *
 * POST /api/airbnb/ical-urls
 * Auth: Bearer {AIRBNB_API_SECRET} (même clé que /api/airbnb/sync)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// VALIDATION
// ============================================================================

const ListingSchema = z.object({
  listing_id: z.string().min(1, 'Listing ID is required'),
  ical_url: z.string().url('Invalid iCal URL').optional().or(z.literal('')),
});

const ICalUrlsRequestSchema = z.object({
  listings: z.array(ListingSchema).min(1).max(200),
});

// ============================================================================
// ENDPOINT
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing Authorization header' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);
    const expectedKey = process.env.AIRBNB_API_SECRET || process.env.NEXTJS_API_KEY;

    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // 2. Parse body
    const body = await request.json();
    const parsed = ICalUrlsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { listings } = parsed.data;

    // 3. Supabase client (service role)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Get all lofts with airbnb_listing_id
    const listingIds = listings.map(l => l.listing_id);
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, airbnb_listing_id')
      .in('airbnb_listing_id', listingIds);

    if (loftsError) {
      console.error('[iCal URLs] Error fetching lofts:', loftsError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    // Build map: airbnb_listing_id → loft_id
    const loftMap = new Map<string, string>();
    for (const loft of lofts || []) {
      if (loft.airbnb_listing_id) {
        loftMap.set(loft.airbnb_listing_id, loft.id);
      }
    }

    // 5. Upsert into property_sync_config
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const listing of listings) {
      const loftId = loftMap.get(listing.listing_id);

      if (!loftId) {
        skipped++;
        continue;
      }

      if (!listing.ical_url) {
        skipped++;
        continue;
      }

      // Check if config exists
      const { data: existing } = await supabase
        .from('property_sync_config')
        .select('id')
        .eq('loft_id', loftId)
        .single();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('property_sync_config')
          .update({ ical_url_airbnb: listing.ical_url })
          .eq('loft_id', loftId);

        if (error) {
          errors.push(`loft ${listing.listing_id}: ${error.message}`);
        } else {
          updated++;
        }
      } else {
        // Insert
        const { error } = await supabase
          .from('property_sync_config')
          .insert({
            loft_id: loftId,
            ical_url_airbnb: listing.ical_url,
            is_active: true,
          });

        if (error) {
          errors.push(`loft ${listing.listing_id}: ${error.message}`);
        } else {
          created++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      metrics: {
        received: listings.length,
        created,
        updated,
        skipped,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[iCal URLs] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
